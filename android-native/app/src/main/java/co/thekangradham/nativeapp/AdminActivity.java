package co.thekangradham.nativeapp;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.text.InputType;
import android.text.InputFilter;
import android.text.TextWatcher;
import android.text.Editable;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AdminActivity extends Activity {
    private static final ApiClient api = new ApiClient();
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private LinearLayout root;
    private TextView status;
    private JSONObject menu;
    private JSONObject editorBaseline;
    private JSONArray enquiries;
    private int override = -1;
    private boolean dirty;
    private int editRevision;
    private boolean busy;
    private boolean editingMenu;
    private Runnable saveEditorFields;
    private Spinner editorDaySelect, editorOverrideSelect;

    private static final class EditorSnapshot {
        String menu, baseline;
        JSONArray enquiries;
        int override, selectedOverride, selectedDay;
        boolean dirty, busy;
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE,
                android.view.WindowManager.LayoutParams.FLAG_SECURE);
        ScrollView scroll = new ScrollView(this);
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
        Object retained = getLastNonConfigurationInstance();
        if (retained instanceof EditorSnapshot) {
            EditorSnapshot snapshot = (EditorSnapshot) retained;
            try {
                menu = new JSONObject(snapshot.menu);
                editorBaseline = new JSONObject(snapshot.baseline);
                enquiries = snapshot.enquiries;
                override = snapshot.override;
                dirty = snapshot.dirty;
                editMenu(snapshot);
                return;
            } catch (JSONException error) {
                loginScreen();
                status.setText("Could not restore the menu editor: " + error.getMessage());
                return;
            }
        }
        loginScreen();
        if (api.hasSession()) {
            execute(() -> {
                JSONObject session = new JSONObject(api.request("GET", "/api/admin/session", null));
                api.setCsrf(session.getString("csrfToken"));
                loadData();
            });
        }
    }

    private void loginScreen() {
        editingMenu = false;
        root.removeAllViews();
        heading("Administrator sign in");
        EditText password = field("Password", true);
        status = statusLabel();
        button("Sign in", () -> {
            if (password.getText().toString().isEmpty()) {
                status.setText("Enter the administrator password.");
                return;
            }
            JSONObject payload = new JSONObject();
            try { payload.put("password", password.getText().toString()); }
            catch (JSONException error) { status.setText(error.getMessage()); return; }
            execute(() -> {
                JSONObject result = new JSONObject(api.request("POST", "/api/admin/login", payload));
                api.setCsrf(result.getString("csrfToken"));
                loadData();
            });
        });
    }

    private void loadData() throws IOException, JSONException {
        JSONObject data = new JSONObject(api.request("GET", "/api/menu", null));
        JSONObject nextMenu = data.getJSONObject("menu");
        int nextOverride = data.isNull("override") ? -1 : data.getInt("override");
        JSONArray nextEnquiries = new JSONArray(api.request("GET", "/api/admin/enquiries", null));
        runOnUiThread(() -> {
            if (isFinishing() || isDestroyed()) return;
            menu = nextMenu;
            override = nextOverride;
            enquiries = nextEnquiries;
            dirty = false;
            dashboard();
        });
    }

    private void dashboard() {
        editingMenu = false;
        root.removeAllViews();
        heading("Administration");
        status = statusLabel();
        button("Edit weekly menu", this::editMenu);
        button("Enquiries", this::showEnquiries);
        button("Change password", this::passwordScreen);
        button("Sign out", () -> executeWrite(() -> {
            api.request("POST", "/api/admin/logout", null);
            api.clearSession();
            runOnUiThread(() -> { if (!isFinishing() && !isDestroyed()) loginScreen(); });
        }));
    }

    private void editMenu() {
        editMenu(null);
    }

    private void editMenu(EditorSnapshot snapshot) {
        editingMenu = true;
        root.removeAllViews();
        heading("Weekly menu");
        try {
            if (snapshot == null) editorBaseline = new JSONObject(menu.toString());
            JSONArray days = menu.getJSONArray("daily");
            String[] dayNames = new String[days.length()];
            String[] overrides = new String[days.length() + 1];
            overrides[0] = "Automatic (calendar day)";
            for (int i = 0; i < days.length(); i++) {
                dayNames[i] = days.getJSONObject(i).getString("day");
                overrides[i + 1] = dayNames[i];
            }
            label("Edit day");
            Spinner daySelect = spinner(dayNames);
            editorDaySelect = daySelect;
            label("Today's override");
            Spinner overrideSelect = spinner(overrides);
            editorOverrideSelect = overrideSelect;
            overrideSelect.setSelection(snapshot == null ? override + 1 : snapshot.selectedOverride);
            String[] keys = {"title", "price", "madra", "khatta", "note", "emoji", "image"};
            String[] names = {"Title", "Price", "Madra", "Khatta", "Note", "Emoji", "Image URL"};
            int[] maximums = {100, 50, 500, 500, 300, 20, 1000};
            EditText[] fields = new EditText[keys.length];
            for (int i = 0; i < fields.length; i++) {
                fields[i] = field(names[i], false);
                fields[i].setFilters(new InputFilter[] { new InputFilter.LengthFilter(maximums[i]) });
            }
            CheckBox highlight = new CheckBox(this);
            highlight.setText("Highlight this day");
            root.addView(highlight);
            status = statusLabel();
            final int[] previous = {-1};
            final boolean[] filling = {false};
            Runnable saveFields = () -> {
                if (previous[0] < 0) return;
                try {
                    JSONObject day = days.getJSONObject(previous[0]);
                    for (int i = 0; i < keys.length; i++) {
                        String value = fields[i].getText().toString().trim();
                        day.put(keys[i], keys[i].equals("image") && value.isEmpty() ? JSONObject.NULL : value);
                    }
                    day.put("highlight", highlight.isChecked());
                } catch (JSONException error) { status.setText(error.getMessage()); }
            };
            saveEditorFields = saveFields;
            for (EditText field : fields) field.addTextChangedListener(new TextWatcher() {
                @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                    if (!filling[0]) { dirty = true; editRevision++; }
                }
                @Override public void afterTextChanged(Editable s) {}
            });
            highlight.setOnCheckedChangeListener((view, checked) -> {
                if (!filling[0]) { dirty = true; editRevision++; }
            });
            daySelect.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
                @Override public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                    saveFields.run();
                    previous[0] = position;
                    filling[0] = true;
                    try {
                        JSONObject day = days.getJSONObject(position);
                        for (int i = 0; i < keys.length; i++) fields[i].setText(day.isNull(keys[i]) ? "" : day.optString(keys[i], ""));
                        highlight.setChecked(day.optBoolean("highlight"));
                    } catch (JSONException error) { status.setText(error.getMessage()); }
                    filling[0] = false;
                }
                @Override public void onNothingSelected(AdapterView<?> parent) {}
            });
            if (snapshot != null) daySelect.setSelection(snapshot.selectedDay);
            overrideSelect.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
                @Override public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                    if (position - 1 != override) { dirty = true; editRevision++; }
                }
                @Override public void onNothingSelected(AdapterView<?> parent) {}
            });
            button("Save menu", () -> {
                for (int i = 0; i < keys.length - 1; i++) {
                    if (fields[i].getText().toString().trim().isEmpty()) {
                        status.setText(names[i] + " is required.");
                        fields[i].requestFocus();
                        return;
                    }
                }
                String image = fields[6].getText().toString().trim();
                if (!image.isEmpty()) {
                    try {
                        if (!new URL(image).getProtocol().equals("https")) {
                            status.setText("Image URL must use HTTPS.");
                            return;
                        }
                    } catch (MalformedURLException error) {
                        status.setText("Enter a valid HTTPS image URL.");
                        return;
                    }
                }
                saveFields.run();
                int selectedOverride = overrideSelect.getSelectedItemPosition() - 1;
                int submittedRevision = editRevision;
                JSONObject body = new JSONObject();
                try {
                    body.put("menu", new JSONObject(menu.toString()));
                    body.put("override", selectedOverride < 0 ? JSONObject.NULL : selectedOverride);
                } catch (JSONException error) { status.setText(error.getMessage()); return; }
                executeWrite(() -> {
                    api.request("PUT", "/api/admin/menu", body);
                    runOnUiThread(() -> {
                        if (isFinishing() || isDestroyed()) return;
                        override = selectedOverride;
                        try { editorBaseline = body.getJSONObject("menu"); }
                        catch (JSONException error) { status.setText("Menu saved; refresh before editing further."); return; }
                        dirty = editRevision != submittedRevision;
                        status.setText(dirty ? "Menu saved; newer edits are not saved." : "Menu saved.");
                    });
                });
            });
            button("Sign in again", this::reauthenticate);
            button("Back to administration", this::leaveEditor);
            if (snapshot != null && snapshot.busy) {
                status.setText("The previous request may have completed. Check the server state before retrying.");
            } else if (snapshot != null && !api.hasSession()) {
                status.setText("Your edits are preserved. Sign in again before saving.");
            }
        } catch (JSONException error) {
            status = label("Unable to display menu: " + error.getMessage());
            button("Back", this::dashboard);
        }
    }

    private void reauthenticate() {
        EditText password = new EditText(this);
        password.setHint("Administrator password");
        password.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        new AlertDialog.Builder(this).setTitle("Sign in again")
                .setView(password)
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Sign in", (dialog, which) -> {
                    if (password.length() == 0) { status.setText("Enter the administrator password."); return; }
                    JSONObject payload = new JSONObject();
                    try { payload.put("password", password.getText().toString()); }
                    catch (JSONException error) { status.setText(error.getMessage()); return; }
                    execute(() -> {
                        JSONObject result = new JSONObject(api.request("POST", "/api/admin/login", payload));
                        api.setCsrf(result.getString("csrfToken"));
                        runOnUiThread(() -> {
                            if (!isFinishing() && !isDestroyed()) status.setText("Signed in; unsaved edits are still present.");
                        });
                    });
                }).show();
    }

    private void leaveEditor() {
        if (!dirty) { dashboard(); return; }
        new AlertDialog.Builder(this).setMessage("Discard unsaved menu changes?")
                .setNegativeButton("Keep editing", null)
                .setPositiveButton("Discard", (dialog, which) -> {
                    menu = editorBaseline;
                    dirty = false;
                    dashboard();
                }).show();
    }

    private void passwordScreen() {
        editingMenu = false;
        root.removeAllViews();
        heading("Change administrator password");
        EditText current = field("Current password", true);
        EditText next = field("New password", true);
        EditText confirm = field("Confirm new password", true);
        status = statusLabel();
        button("Update password", () -> {
            if (!next.getText().toString().equals(confirm.getText().toString())) {
                status.setText("New password confirmation does not match."); return;
            }
            if (next.length() < 12 || next.length() > 128) {
                status.setText("New password must contain 12–128 characters."); return;
            }
            if (next.getText().toString().equals(current.getText().toString())) {
                status.setText("Choose a new password that differs from the current password."); return;
            }
            JSONObject payload = new JSONObject();
            try {
                payload.put("currentPassword", current.getText().toString());
                payload.put("newPassword", next.getText().toString());
            } catch (JSONException error) { status.setText(error.getMessage()); return; }
            executeWrite(() -> {
                api.request("PUT", "/api/admin/password", payload);
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    current.setText(""); next.setText(""); confirm.setText("");
                    status.setText("Password updated.");
                });
            });
        });
        button("Back", this::dashboard);
    }

    private void showEnquiries() {
        editingMenu = false;
        root.removeAllViews();
        heading("Enquiries");
        status = statusLabel();
        button("Refresh", () -> execute(this::loadData));
        if (enquiries.length() == 0) label("No enquiries yet.");
        for (int i = 0; i < enquiries.length(); i++) {
            try {
                JSONObject item = enquiries.getJSONObject(i);
                int id = item.getInt("id");
                String service = value(item, "service", value(item, "subject", value(item, "type", "")));
                String message = value(item, "message", "Guests: " + value(item, "guests", "—"));
                label(value(item, "created_at", "") + "\n" + value(item, "name", "") + "\n"
                        + value(item, "email", "") + "\n" + value(item, "phone", "")
                        + "\n" + service + "\n" + message);
                String[] statuses = {"new", "contacted", "closed"};
                Spinner selector = spinner(statuses);
                for (int n = 0; n < statuses.length; n++) if (statuses[n].equals(item.optString("status"))) selector.setSelection(n);
                button("Update status", () -> {
                    JSONObject payload = new JSONObject();
                    String nextStatus = statuses[selector.getSelectedItemPosition()];
                    try { payload.put("status", nextStatus); }
                    catch (JSONException error) { status.setText(error.getMessage()); return; }
                    executeWrite(() -> {
                        api.request("PATCH", "/api/admin/enquiries/" + id, payload);
                        runOnUiThread(() -> {
                            if (isFinishing() || isDestroyed()) return;
                            try { item.put("status", nextStatus); }
                            catch (JSONException error) { status.setText("Status updated; refresh to see it."); return; }
                            status.setText("Status updated.");
                        });
                    });
                });
                button("Delete enquiry", () -> new AlertDialog.Builder(this)
                        .setMessage("Delete this enquiry? This cannot be undone.")
                        .setNegativeButton("Cancel", null)
                        .setPositiveButton("Delete", (dialog, which) -> executeWrite(() -> {
                            api.request("DELETE", "/api/admin/enquiries/" + id, null);
                            loadData();
                        })).show());
            } catch (JSONException error) { status.setText("Unable to display enquiry: " + error.getMessage()); }
        }
        button("Back", this::dashboard);
    }

    interface Request { void run() throws IOException, JSONException; }
    private static String value(JSONObject item, String key, String fallback) {
        return item.isNull(key) ? fallback : item.optString(key, fallback);
    }
    private void execute(Request request) {
        execute(request, false);
    }
    private void executeWrite(Request request) {
        execute(request, true);
    }
    private void execute(Request request, boolean write) {
        if (busy) return;
        busy = true;
        status.setText("Working…");
        executor.execute(() -> {
            try {
                request.run();
            } catch (IOException | JSONException error) {
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    if (error instanceof ApiClient.HttpError && ((ApiClient.HttpError) error).status == 401) {
                        api.clearSession();
                        if (dirty) {
                            status.setText("Session expired or credentials were rejected. Your unsaved edits remain; sign in again before saving."
                                    + (write ? " Check the server state before retrying." : ""));
                        } else {
                            loginScreen();
                            status.setText("Session expired or credentials were rejected. Sign in again."
                                    + (write ? " Check the server state before retrying." : ""));
                        }
                    } else {
                        status.setText("Request failed: " + error.getMessage()
                                + (write
                                ? " The change may have completed; check before retrying." : ""));
                    }
                });
            } finally {
                runOnUiThread(() -> { busy = false; });
            }
        });
    }

    private TextView label(String value) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setPadding(0, 10, 0, 10);
        root.addView(view);
        return view;
    }
    private TextView statusLabel() {
        TextView view = label("");
        view.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        return view;
    }
    private void heading(String value) { TextView view = label(value); view.setTextSize(24); }
    private EditText field(String name, boolean secret) {
        TextView title = label(name);
        EditText value = new EditText(this);
        value.setId(View.generateViewId());
        title.setLabelFor(value.getId());
        if (secret) value.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        root.addView(value);
        return value;
    }
    private Spinner spinner(String[] options) {
        Spinner view = new Spinner(this);
        view.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, options));
        root.addView(view);
        return view;
    }
    private void button(String text, Runnable action) {
        Button view = new Button(this);
        view.setText(text);
        view.setAllCaps(false);
        view.setOnClickListener(v -> {
            if (busy) { status.setText("Please wait for the current request."); return; }
            action.run();
        });
        root.addView(view);
    }

    @Override public void onBackPressed() {
        if (busy) status.setText("Please wait for the current request.");
        else if (dirty) leaveEditor();
        else super.onBackPressed();
    }
    @Override public Object onRetainNonConfigurationInstance() {
        if (!editingMenu || menu == null || editorBaseline == null || saveEditorFields == null) return null;
        saveEditorFields.run();
        EditorSnapshot snapshot = new EditorSnapshot();
        snapshot.menu = menu.toString();
        snapshot.baseline = editorBaseline.toString();
        snapshot.enquiries = enquiries;
        snapshot.override = override;
        snapshot.selectedOverride = editorOverrideSelect.getSelectedItemPosition();
        snapshot.selectedDay = editorDaySelect.getSelectedItemPosition();
        snapshot.dirty = dirty;
        snapshot.busy = busy;
        return snapshot;
    }
    @Override protected void onDestroy() { executor.shutdownNow(); super.onDestroy(); }
}
