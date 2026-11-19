package co.thekangradham.nativeapp;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.DateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final String MENU_URL = "https://kangradham.kran-apps.cloud/api/menu";
    private static final String LISTING = "The Kangra Dham Co. Food & drink Dine-in takeaway bulk pickup "
            + "Retail Arcade Sector 137 Opp. Metro Station Noida Expressway "
            + "Lunch 12:00 PM 3:30 PM Evening Snacks Chai 4:30 PM 6:30 PM "
            + "Dinner 7:30 PM 10:00 PM +91 7011376087";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private ImageLoader images;
    private LinearLayout content;
    private JSONObject menu;
    private Integer overrideDay;
    private int selectedDay;
    private boolean daySelectedByUser;
    private String source = "";
    private long menuUpdatedAt;
    private String screen = "home";
    private String directoryQuery = "";
    private int directoryCategory;
    private boolean hindi;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        images = new ImageLoader(this);
        hindi = getPreferences(MODE_PRIVATE).getBoolean("hindi", false);
        selectedDay = Calendar.getInstance().get(Calendar.DAY_OF_WEEK) - 1;
        if (state != null) {
            selectedDay = state.getInt("selectedDay", selectedDay);
            daySelectedByUser = state.getBoolean("daySelectedByUser");
            directoryQuery = state.getString("directoryQuery", "");
            directoryCategory = state.getInt("directoryCategory", 0);
        }
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(250, 248, 245));
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(0, insets.getSystemWindowInsetTop(), 0, insets.getSystemWindowInsetBottom());
            return insets;
        });
        setContentView(root);

        TextView title = text("The Kangra Dham Co. — native preview", 22);
        title.setBackgroundColor(Color.rgb(142, 69, 40));
        title.setTextColor(Color.WHITE);
        title.setPadding(dp(16), dp(14), dp(16), dp(14));
        root.addView(title);

        LinearLayout navigation = new LinearLayout(this);
        navigation.addView(button("Home", this::showHome), weighted());
        navigation.addView(button("Menu", this::showMenu), weighted());
        navigation.addView(button("Local", this::showDirectory), weighted());
        navigation.addView(button("More", this::showMore), weighted());
        root.addView(navigation);

        ScrollView scroll = new ScrollView(this);
        content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(16), dp(16), dp(16), dp(24));
        scroll.addView(content);
        root.addView(scroll);
        loadLocalMenu();
        if (state == null) routeIntent(getIntent());
        else restoreScreen(state.getString("screen", "home"));
        refreshMenu();
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        state.putString("screen", screen);
        state.putInt("selectedDay", selectedDay);
        state.putBoolean("daySelectedByUser", daySelectedByUser);
        state.putString("directoryQuery", directoryQuery);
        state.putInt("directoryCategory", directoryCategory);
        super.onSaveInstanceState(state);
    }

    private void restoreScreen(String target) {
        switch (target) {
            case "menu": showMenu(); break;
            case "directory": showDirectory(); break;
            case "location": showLocations(); break;
            case "order": showOrder(); break;
            case "more": showMore(); break;
            default: showHome();
        }
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        routeIntent(intent);
    }

    private void routeIntent(Intent intent) {
        String target = intent.getStringExtra("screen");
        if ("menu".equals(target)) showMenu();
        else if ("location".equals(target)) showLocations();
        else showHome();
    }

    private void loadLocalMenu() {
        String cached = getPreferences(MODE_PRIVATE).getString("menu_response", null);
        if (cached != null) {
            try {
                applyResponse(new JSONObject(cached));
                menuUpdatedAt = getPreferences(MODE_PRIVATE).getLong("menu_updated_at", 0);
                source = menuUpdatedAt > 0
                        ? "Saved menu last refreshed " + formatDate(menuUpdatedAt) + "; refresh to check for changes."
                        : "Saved menu; refresh to check for changes. Last refresh time is unavailable.";
                return;
            } catch (JSONException error) {
                Toast.makeText(this, "Saved menu was invalid; using the bundled menu.", Toast.LENGTH_LONG).show();
            }
        }
        try (InputStream input = getAssets().open("menu.json")) {
            menu = new JSONObject(readAll(input));
            source = "Bundled menu; confirm current details before ordering.";
        } catch (IOException | JSONException error) {
            source = "Unable to load the bundled menu: " + error.getMessage();
        }
    }

    private void applyResponse(JSONObject response) throws JSONException {
        MenuResponse.validate(response);
        JSONObject nextMenu = response.getJSONObject("menu");
        int nextOverride = response.isNull("override") ? -1 : response.getInt("override");
        menu = nextMenu;
        overrideDay = nextOverride < 0 ? null : nextOverride;
        if (!daySelectedByUser) {
            selectedDay = overrideDay == null ? Calendar.getInstance().get(Calendar.DAY_OF_WEEK) - 1 : overrideDay;
        }
    }

    private void refreshMenu() {
        executor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(MENU_URL).openConnection();
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                connection.setRequestProperty("Accept", "application/json");
                int status = connection.getResponseCode();
                if (status != 200) throw new IOException("HTTP " + status);
                String json;
                try (InputStream input = connection.getInputStream()) {
                    json = readAll(input);
                }
                JSONObject response = new JSONObject(json);
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    try {
                        applyResponse(response);
                        menuUpdatedAt = System.currentTimeMillis();
                        getPreferences(MODE_PRIVATE).edit()
                                .putString("menu_response", json)
                                .putLong("menu_updated_at", menuUpdatedAt)
                                .apply();
                        source = "Live menu refreshed " + formatDate(menuUpdatedAt) + ".";
                    } catch (JSONException error) {
                        source = "Menu refresh failed: " + error.getMessage();
                    }
                    updateMenuScreen();
                });
            } catch (IOException | JSONException error) {
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    source = menu == null
                            ? "Menu refresh failed; no menu is available. " + error.getMessage()
                            : "Menu refresh failed; showing saved or bundled information. "
                                    + (menuUpdatedAt > 0
                                    ? "Last successful refresh: " + formatDate(menuUpdatedAt) + ". "
                                    : "The bundled menu's currentness could not be verified. ")
                                    + error.getMessage();
                    updateMenuScreen();
                });
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }

    private void updateMenuScreen() {
        if (screen.equals("menu")) showMenu();
        else if (screen.equals("home")) showHome();
    }

    private void showHome() {
        screen = "home";
        content.removeAllViews();
        addHeading(hindi ? "परम्परा, स्वाद और भावना" : "Tradition, Taste & Emotion");
        addText(hindi
                ? "प्रामाणिक हिमाचली भोज — भारी पीतल की चरोटी में धीमी आंच पर पकाया, रोज़ ताज़ा परोसा।"
                : "The Authentic Himachali Feast — Slow-Cooked in Brass Charotis, Served Fresh Daily.");
        content.addView(button(hindi ? "English" : "हिंदी", () -> {
            hindi = !hindi;
            getPreferences(MODE_PRIVATE).edit().putBoolean("hindi", hindi).apply();
            showHome();
        }));
        addHeading(hindi ? "आज का मद्रा" : "Today's Dham");
        addText(source);
        if (menu != null) {
            try {
                int day = overrideDay == null ? Calendar.getInstance().get(Calendar.DAY_OF_WEEK) - 1 : overrideDay;
                JSONObject today = menu.getJSONArray("daily").getJSONObject(day);
                addText(today.getString("day") + " — " + today.getString("title") + "\n"
                        + today.getString("madra") + "\n" + today.getString("khatta")
                        + "\n" + today.getString("price"));
            } catch (JSONException error) {
                addText("Today's menu could not be displayed: " + error.getMessage());
            }
        }
        content.addView(button(hindi ? "आज का मेनू देखें" : "View today's menu", () -> {
            daySelectedByUser = false;
            selectedDay = overrideDay == null ? Calendar.getInstance().get(Calendar.DAY_OF_WEEK) - 1 : overrideDay;
            showMenu();
        }));
        content.addView(button(hindi ? "ऑर्डर करें" : "Order now", this::showOrder));
        content.addView(button(hindi ? "दिशा-निर्देश" : "Get directions",
                () -> openIntent("https://maps.google.com/?q=Sector+137+Noida")));
        content.addView(button(hindi ? "हमारी विरासत" : "Our heritage", () -> showContent("about")));
        content.addView(button("Catering & corporate orders", () -> showContent("catering")));
        appendHomeContent();
    }

    private void appendHomeContent() {
        try (InputStream input = getAssets().open("pages.json")) {
            JSONObject page = new JSONObject(readAll(input)).getJSONObject("index");
            JSONArray blocks = page.getJSONArray("blocks");
            for (int i = 0; i < blocks.length(); i++) {
                JSONObject block = blocks.getJSONObject(i);
                String type = block.getString("type");
                String text = block.getString("text");
                if (type.equals("h1") || text.equals("Tradition, Taste & Emotion")
                        || text.equals("The Authentic Himachali Feast — Slow-Cooked in Brass Charotis, Served Fresh Daily.")
                        || text.equals("Today's Dham")) continue;
                if (type.matches("h[2-4]")) addHeading(text);
                else addText((type.equals("li") ? "• " : "") + text);
            }
            JSONArray pictures = page.getJSONArray("images");
            for (int i = 0; i < pictures.length(); i++) {
                JSONObject picture = pictures.getJSONObject(i);
                images.add(content, picture.getString("url"), picture.getString("caption"));
            }
        } catch (IOException | JSONException error) {
            addText("Additional home content is unavailable: " + error.getMessage());
        }
    }

    private void showMenu() {
        screen = "menu";
        content.removeAllViews();
        addHeading("Weekly menu");
        addText(source);
        content.addView(button("Refresh menu", this::refreshMenu));
        if (menu == null) return;
        try {
            JSONArray days = menu.getJSONArray("daily");
            HorizontalScrollView dayScroll = new HorizontalScrollView(this);
            LinearLayout dayButtons = new LinearLayout(this);
            int[] order = {1, 2, 3, 4, 5, 6, 0};
            for (int i : order) {
                final int day = i;
                Button tab = button(days.getJSONObject(i).getString("dayShort"), () -> {
                    daySelectedByUser = true;
                    selectedDay = day;
                    showMenu();
                });
                tab.setContentDescription(days.getJSONObject(i).getString("day")
                        + (i == selectedDay ? ", selected" : ""));
                if (i == selectedDay) {
                    tab.setTextColor(Color.WHITE);
                    tab.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(142, 69, 40)));
                }
                dayButtons.addView(tab);
            }
            dayScroll.addView(dayButtons);
            content.addView(dayScroll);
            JSONObject item = days.getJSONObject(selectedDay);
            addHeading(item.getString("day") + ": " + item.getString("title"));
            if (!item.isNull("image")) images.add(content, item.getString("image"), item.getString("title"));
            addText(item.getString("price") + "\n" + item.getString("madra") + "\n"
                    + item.getString("khatta") + "\n" + item.getString("note"));
            addHeading("Included with every thali");
            JSONArray fixed = menu.getJSONArray("fixedItems");
            for (int i = 0; i < fixed.length(); i++) addText("• " + fixed.getString(i));
            appendItems("Sides", menu.getJSONArray("sideMenu"));
            appendItems("Retail", menu.getJSONArray("retail"));
            content.addView(button("Ask about today's menu on WhatsApp", () -> openIntent(
                    "https://wa.me/917011376087?text=Hi%21%20What%27s%20today%27s%20Dham%20menu%3F")));
        } catch (JSONException error) {
            addText("Menu information could not be displayed: " + error.getMessage());
        }
    }

    private void appendItems(String heading, JSONArray items) throws JSONException {
        addHeading(heading);
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.getJSONObject(i);
            String size = item.optString("size", "");
            addText(item.getString("name") + " — " + item.getString("price")
                    + (size.isEmpty() ? "" : " (" + size + ")") + "\n" + item.getString("desc"));
            if (!item.isNull("image")) images.add(content, item.getString("image"), item.getString("name"));
        }
    }

    private void showDirectory() {
        screen = "directory";
        content.removeAllViews();
        addHeading("Local directory");
        addText("This small directory currently includes only our own location. "
                + "Other local services and community resources have not yet been added. "
                + "Please confirm details before visiting.");
        EditText search = new EditText(this);
        search.setSingleLine(true);
        search.setHint("Search listings");
        search.setText(directoryQuery);
        content.addView(search);
        addText("Category");
        Spinner category = new Spinner(this);
        category.setContentDescription("Directory category");
        category.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item,
                new String[] {"All categories", "Food & drink"}));
        category.setSelection(directoryCategory);
        content.addView(category);
        TextView result = text("", 16);
        content.addView(result);
        LinearLayout listing = new LinearLayout(this);
        listing.setOrientation(LinearLayout.VERTICAL);
        content.addView(listing);
        TextView name = text("The Kangra Dham Co. — Food & drink", 20);
        listing.addView(name);
        listing.addView(text("Dine-in, takeaway and bulk pickup\n\n"
                + "Retail Arcade, Sector 137 (Opp. Metro Station), Noida Expressway\n\n"
                + "Lunch: 12:00 PM – 3:30 PM\nEvening Snacks & Chai: 4:30 PM – 6:30 PM\n"
                + "Dinner: 7:30 PM – 10:00 PM\n\n+91 7011376087", 16));
        listing.addView(button("Call", () -> openIntent("tel:+917011376087")));
        listing.addView(button("Map", () -> openIntent("https://maps.google.com/?q=Sector+137+Noida")));
        Runnable filter = () -> {
            String selectedCategory = category.getSelectedItemPosition() == 0 ? "all" : "food";
            boolean matches = DirectorySearch.matches(LISTING, "food", search.getText().toString(), selectedCategory);
            listing.setVisibility(matches ? View.VISIBLE : View.GONE);
            result.setText(matches ? "1 listing found." : "No listings match. Try a different search or clear the filters.");
        };
        search.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                directoryQuery = s.toString();
                filter.run();
            }
            @Override public void afterTextChanged(Editable s) {}
        });
        category.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                directoryCategory = position;
                filter.run();
            }
            @Override public void onNothingSelected(AdapterView<?> parent) { filter.run(); }
        });
        content.addView(button("Clear filters", () -> {
            search.setText("");
            directoryCategory = 0;
            category.setSelection(0);
            search.requestFocus();
        }));
        filter.run();
    }

    private void showMore() {
        screen = "more";
        content.removeAllViews();
        addHeading("Explore");
        content.addView(button("Order", this::showOrder));
        content.addView(button("Find us", this::showLocations));
        content.addView(button("Our heritage", () -> showContent("about")));
        content.addView(button("Gallery", () -> showContent("gallery")));
        content.addView(button("Stories", () -> showContent("stories")));
        content.addView(button("Corporate plans", () -> showContent("corporate")));
        content.addView(button("Catering", () -> showContent("catering")));
        content.addView(button("Privacy policy", () -> showContent("privacy")));
        content.addView(button("Contact enquiry", () -> startEnquiry(false)));
        content.addView(button("Catering enquiry", () -> startEnquiry(true)));
        content.addView(button("Administrator", () -> startActivity(new Intent(this, AdminActivity.class))));
    }

    private void showContent(String page) {
        Intent intent = new Intent(this, ContentActivity.class);
        intent.putExtra("page", page);
        startActivity(intent);
    }

    private void startEnquiry(boolean catering) {
        Intent intent = new Intent(this, EnquiryActivity.class);
        intent.putExtra("catering", catering);
        startActivity(intent);
    }

    private void showOrder() {
        screen = "order";
        content.removeAllViews();
        addHeading("Order");
        addText("Walk in and dine at Sector 137, Noida.");
        content.addView(button("Find the location", this::showLocations));
        addText("Order via WhatsApp for pickup, or call to place your order.");
        content.addView(button("Order on WhatsApp", () -> openIntent(
                "https://wa.me/917011376087?text=Hi%21%20I%27d%20like%20to%20order%20from%20The%20Kangra%20Dham%20Co.")));
        content.addView(button("Call", () -> openIntent("tel:+917011376087")));
        addText("Delivery through partners: coming soon.");
        addHeading("UPI / online pay");
        addText("UPI ID: 7011376087@upi. Show the payment screenshot at the counter for prepaid pickup.");
        content.addView(button("Pay via UPI", () -> openIntent(
                "upi://pay?pa=7011376087@upi&pn=The%20Kangra%20Dham%20Co&cu=INR")));
        addHeading("Meal subscription");
        addText("Daily, weekly and monthly meal plans with special pricing.");
        content.addView(button("View corporate plans", () -> showContent("corporate")));
        addHeading("Loyalty programme — coming soon");
        addText("Reward points, digital wallet, referral programme and membership tiers are coming soon.");
        content.addView(button("Back", this::showMore));
    }

    private void showLocations() {
        screen = "location";
        content.removeAllViews();
        addHeading("Find us — Sector 137, Noida");
        addText("The Kangra Dham Co. — Sector 137, Noida (Flagship)\n\n"
                + "Retail Arcade, Sector 137 (Opp. Metro Station), Noida Expressway\n"
                + "Lunch: 12:00 PM – 3:30 PM\nEvening Snacks & Chai: 4:30 PM – 6:30 PM\n"
                + "Dinner: 7:30 PM – 10:00 PM\n+91 7011376087\nkapil8583@gmail.com\n\n"
                + "Ample parking available • Opp. Metro Station\n"
                + "Walking distance from Sector 137 & 142 corporate offices\n"
                + "Dine-in (AC seating) • Standing • Takeaway • Bulk pickup");
        content.addView(button("Google Maps", () -> openIntent("https://maps.google.com/?q=Sector+137+Noida")));
        content.addView(button("Call", () -> openIntent("tel:+917011376087")));
        content.addView(button("Email", () -> openIntent("mailto:kapil8583@gmail.com")));
        content.addView(button("Browse local directory", this::showDirectory));
        addHeading("More outlets coming soon");
        addText("Greater Noida — Coming Q1 2027\nDelhi NCR — Coming 2027\nGurgaon — Coming 2027");
        content.addView(button("Contact us", () -> startEnquiry(false)));
    }

    private void openIntent(String uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(uri)));
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, "No app is available to open this action.", Toast.LENGTH_LONG).show();
        }
    }

    private static String readAll(InputStream input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int count;
        while ((count = input.read(buffer)) != -1) {
            if (output.size() + count > 1024 * 1024) throw new IOException("Menu data is too large");
            output.write(buffer, 0, count);
        }
        return new String(output.toByteArray(), StandardCharsets.UTF_8);
    }

    private String formatDate(long timestamp) {
        return DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT)
                .format(new Date(timestamp));
    }

    private LinearLayout.LayoutParams weighted() {
        return new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private Button button(String label, Runnable action) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setOnClickListener(view -> action.run());
        return button;
    }
    private TextView text(String value, int size) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(Color.rgb(34, 34, 34));
        view.setPadding(0, dp(6), 0, dp(6));
        return view;
    }
    private void addHeading(String value) {
        TextView view = text(value, 20);
        view.setGravity(Gravity.START);
        view.setTextColor(Color.rgb(142, 69, 40));
        content.addView(view);
    }
    private void addText(String value) { content.addView(text(value, 16)); }

    @Override public void onBackPressed() {
        if (screen.equals("home")) super.onBackPressed();
        else if (screen.equals("order")) showMore();
        else showHome();
    }

    @Override protected void onDestroy() {
        executor.shutdownNow();
        images.close();
        super.onDestroy();
    }
}
