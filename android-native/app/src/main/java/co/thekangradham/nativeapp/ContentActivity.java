package co.thekangradham.nativeapp;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class ContentActivity extends Activity {
    private ImageLoader images;
    private LinearLayout root;
    private ScrollView scroll;
    private String page;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        images = new ImageLoader(this);
        scroll = new ScrollView(this);
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        int padding = Math.round(20 * getResources().getDisplayMetrics().density);
        root.setPadding(padding, padding, padding, padding);
        scroll.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        scroll.addView(root);
        setContentView(scroll);
        page = state == null ? getIntent().getStringExtra("page") : state.getString("page");
        try (InputStream input = getAssets().open("pages.json")) {
            JSONObject pages = new JSONObject(read(input, 2 * 1024 * 1024));
            JSONObject content = pages.getJSONObject(page);
            JSONArray blocks = content.getJSONArray("blocks");
            for (int i = 0; i < blocks.length(); i++) {
                JSONObject block = blocks.getJSONObject(i);
                String type = block.getString("type");
                String value = block.getString("text");
                if ("privacy".equals(page) && value.startsWith("Google Analytics loads only")) {
                    value = "This native app does not load Google Analytics.";
                }
                TextView text = new TextView(this);
                text.setText((type.equals("li") ? "• " : "") + value);
                text.setTextSize(type.matches("h[1-4]") ? 21 : 16);
                text.setPadding(0, 12, 0, 12);
                root.addView(text);
            }
            JSONArray gallery = content.getJSONArray("images");
            for (int i = 0; i < gallery.length(); i++) {
                JSONObject image = gallery.getJSONObject(i);
                images.add(root, image.getString("url"), image.getString("caption"));
            }
            if ("corporate".equals(page) || "catering".equals(page)) {
                button("Catering enquiry", () -> {
                    Intent intent = new Intent(this, EnquiryActivity.class);
                    intent.putExtra("catering", true);
                    startActivity(intent);
                });
                button("Enquire on WhatsApp", () -> open("https://wa.me/917011376087?text=Hi%21%20Corporate%20catering%20enquiry"));
            }
            if ("corporate".equals(page)) {
                button("Daily lunch enquiry", () -> open("https://wa.me/917011376087?text=Hi%21%20I%27d%20like%20daily%20lunch%20subscription%20info"));
                button("Weekly plan enquiry", () -> open("https://wa.me/917011376087?text=Hi%21%20I%27d%20like%20the%20Weekly%20Office%20Plan%20subscription"));
                button("Monthly plan enquiry", () -> open("https://wa.me/917011376087?text=Hi%21%20I%27d%20like%20the%20Monthly%20Subscription%20plan"));
            }
            if ("about".equals(page)) {
                button("View menu", () -> navigate("menu"));
                button("Find us", () -> navigate("location"));
            }
            if ("gallery".equals(page)) button("Share your Dham photos", () -> startActivity(new Intent(this, EnquiryActivity.class)));
            if ("gallery".equals(page)) button("Visit us", () -> navigate("location"));
            if ("privacy".equals(page)) {
                button("Email", () -> open("mailto:kapil8583@gmail.com"));
                button("Call", () -> open("tel:+917011376087"));
            }
        } catch (IOException | JSONException error) {
            TextView text = new TextView(this);
            text.setText("Unable to load this page: " + error.getMessage());
            root.addView(text);
        }
        if (state != null) {
            int position = state.getInt("scrollY");
            scroll.post(() -> scroll.scrollTo(0, position));
        }
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        state.putString("page", page);
        state.putInt("scrollY", scroll.getScrollY());
        super.onSaveInstanceState(state);
    }

    private void navigate(String screen) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("screen", screen);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
    }

    private static String read(InputStream input, int limit) throws IOException {
        return new String(readBytes(input, limit), StandardCharsets.UTF_8);
    }
    private static byte[] readBytes(InputStream input, int limit) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int count;
        while ((count = input.read(buffer)) != -1) {
            if (output.size() + count > limit) throw new IOException("Content is too large");
            output.write(buffer, 0, count);
        }
        return output.toByteArray();
    }
    private void open(String uri) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(uri))); }
        catch (ActivityNotFoundException error) { Toast.makeText(this, "No app is available for this action.", Toast.LENGTH_LONG).show(); }
    }
    private void button(String text, Runnable action) {
        Button button = new Button(this);
        button.setText(text);
        button.setAllCaps(false);
        button.setOnClickListener(v -> action.run());
        root.addView(button);
    }
    @Override protected void onDestroy() { images.close(); super.onDestroy(); }
}
