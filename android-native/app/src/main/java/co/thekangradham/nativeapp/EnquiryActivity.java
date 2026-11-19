package co.thekangradham.nativeapp;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class EnquiryActivity extends Activity {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final ApiClient api = new ApiClient();
    private EditText name, email, phone, company, guests, message;
    private Spinner choice;
    private TextView status;
    private Button submit;
    private boolean catering;
    private boolean sending;
    private final String[] subjects = {"", "general", "feedback", "catering", "corporate", "franchise", "complaint", "other"};
    private final String[] services = {"", "corporate-lunch", "group-booking", "event-catering", "bulk-order", "subscription", "other"};

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        catering = getIntent().getBooleanExtra("catering", false);
        ScrollView scroll = new ScrollView(this);
        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        int padding = Math.round(20 * getResources().getDisplayMetrics().density);
        form.setPadding(padding, padding, padding, padding);
        scroll.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        scroll.addView(form);
        setContentView(scroll);
        TextView heading = new TextView(this);
        heading.setText(catering ? "Catering enquiry" : "Contact us");
        heading.setTextSize(24);
        form.addView(heading);
        if (!catering) {
            TextView contact = new TextView(this);
            contact.setText("Retail Arcade, Sector 137 (Opp. Metro Station), Noida Expressway\n"
                    + "+91 7011376087\nkapil8583@gmail.com\n"
                    + "Lunch: 12:00 PM – 3:30 PM • Snacks: 4:30 PM – 6:30 PM • Dinner: 7:30 PM – 10:00 PM");
            form.addView(contact);
            action(form, "Call", "tel:+917011376087");
            action(form, "WhatsApp", "https://wa.me/917011376087");
            action(form, "Email", "mailto:kapil8583@gmail.com");
        }
        name = field(form, "Name (required)", InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_WORDS);
        if (catering) company = field(form, "Company (optional)", InputType.TYPE_CLASS_TEXT);
        email = field(form, "Email (required)", InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
        phone = field(form, catering ? "Phone (required)" : "Phone (optional)", InputType.TYPE_CLASS_PHONE);
        TextView label = new TextView(this);
        label.setText(catering ? "Service (required)" : "Subject (required)");
        form.addView(label);
        choice = new Spinner(this);
        choice.setId(View.generateViewId());
        label.setLabelFor(choice.getId());
        String[] labels = catering
                ? new String[] {"Select a service", "Corporate lunch", "Group booking", "Event catering", "Bulk order", "Subscription", "Other"}
                : new String[] {"Select a subject", "General enquiry", "Feedback", "Catering request", "Corporate partnership", "Franchise enquiry", "Complaint", "Other"};
        choice.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, labels));
        form.addView(choice);
        if (catering) guests = field(form, "Number of people (optional)", InputType.TYPE_CLASS_NUMBER);
        message = field(form, catering ? "Message (optional)" : "Message (required)",
                InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        message.setMinLines(3);
        status = new TextView(this);
        status.setAccessibilityLiveRegion(TextView.ACCESSIBILITY_LIVE_REGION_POLITE);
        form.addView(status);
        submit = new Button(this);
        submit.setText("Send enquiry");
        submit.setOnClickListener(view -> send());
        form.addView(submit);
        if (state != null) {
            name.setText(state.getString("name", ""));
            email.setText(state.getString("email", ""));
            phone.setText(state.getString("phone", ""));
            message.setText(state.getString("message", ""));
            if (catering) {
                company.setText(state.getString("company", ""));
                guests.setText(state.getString("guests", ""));
            }
            choice.setSelection(state.getInt("choice", 0));
            status.setText(state.getBoolean("sending")
                    ? "The previous submission may have been received. Check before retrying to avoid duplicate enquiries."
                    : state.getString("status", ""));
        }
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        state.putString("name", name.getText().toString());
        state.putString("email", email.getText().toString());
        state.putString("phone", phone.getText().toString());
        state.putString("message", message.getText().toString());
        if (catering) {
            state.putString("company", company.getText().toString());
            state.putString("guests", guests.getText().toString());
        }
        state.putInt("choice", choice.getSelectedItemPosition());
        state.putString("status", status.getText().toString());
        state.putBoolean("sending", sending);
        super.onSaveInstanceState(state);
    }

    private void action(LinearLayout form, String label, String uri) {
        Button action = new Button(this);
        action.setText(label);
        action.setAllCaps(false);
        action.setOnClickListener(view -> {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(uri))); }
            catch (ActivityNotFoundException error) {
                Toast.makeText(this, "No app is available for this action.", Toast.LENGTH_LONG).show();
            }
        });
        form.addView(action);
    }

    private EditText field(LinearLayout form, String label, int type) {
        TextView title = new TextView(this);
        title.setText(label);
        form.addView(title);
        EditText value = new EditText(this);
        value.setId(View.generateViewId());
        title.setLabelFor(value.getId());
        value.setSingleLine((type & InputType.TYPE_TEXT_FLAG_MULTI_LINE) == 0);
        value.setInputType(type);
        form.addView(value);
        return value;
    }

    private void send() {
        JSONObject body = new JSONObject();
        int selected = choice.getSelectedItemPosition();
        String selection = catering ? services[selected] : subjects[selected];
        String validation = EnquiryValidation.validate(catering, name.getText().toString(),
                email.getText().toString(), phone.getText().toString(),
                catering ? company.getText().toString() : "", selection,
                catering ? guests.getText().toString() : "", message.getText().toString());
        if (validation != null) {
            status.setText(validation);
            return;
        }
        try {
            body.put("name", name.getText().toString());
            body.put("email", email.getText().toString());
            body.put("phone", phone.getText().toString());
            body.put("message", message.getText().toString());
            body.put(catering ? "service" : "subject", selection);
            if (catering) {
                body.put("company", company.getText().toString());
                body.put("guests", guests.getText().toString());
            }
        } catch (JSONException error) {
            status.setText("Could not prepare enquiry: " + error.getMessage());
            return;
        }
        sending = true;
        setFormEnabled(false);
        status.setText("Sending…");
        executor.execute(() -> {
            try {
                JSONObject result = new JSONObject(api.request("POST", "/api/enquiries/" + (catering ? "catering" : "contact"), body));
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    sending = false;
                    status.setText(result.optString("message", "Enquiry received."));
                    name.setText(""); email.setText(""); phone.setText(""); message.setText("");
                    if (catering) { company.setText(""); guests.setText(""); }
                    choice.setSelection(0);
                    setFormEnabled(true);
                });
            } catch (IOException | JSONException error) {
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    sending = false;
                    status.setText("Could not confirm submission: " + error.getMessage()
                            + " Check before retrying to avoid duplicate enquiries.");
                    setFormEnabled(true);
                });
            }
        });
    }

    @Override public void onBackPressed() {
        if (!sending) { super.onBackPressed(); return; }
        new AlertDialog.Builder(this)
                .setMessage("The enquiry is being sent and may still be received if you leave.")
                .setNegativeButton("Stay", null)
                .setPositiveButton("Leave", (dialog, which) -> finish())
                .show();
    }

    private void setFormEnabled(boolean enabled) {
        submit.setEnabled(enabled);
        name.setEnabled(enabled);
        email.setEnabled(enabled);
        phone.setEnabled(enabled);
        choice.setEnabled(enabled);
        message.setEnabled(enabled);
        if (catering) { company.setEnabled(enabled); guests.setEnabled(enabled); }
    }

    @Override protected void onDestroy() {
        executor.shutdownNow();
        super.onDestroy();
    }
}
