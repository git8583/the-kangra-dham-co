package co.thekangradham.nativeapp;

import org.json.JSONArray;
import org.json.JSONObject;

public final class NativeBackendContract {
    private static void require(boolean value, String message) {
        if (!value) throw new AssertionError(message);
    }

    public static void main(String[] args) throws Exception {
        ApiClient api = new ApiClient(args[0]);
        JSONObject menu = new JSONObject(api.request("GET", "/api/menu", null));
        MenuResponse.validate(menu);
        JSONObject contact = new JSONObject().put("name", "TEST PLEASE IGNORE")
                .put("email", "test@example.test").put("subject", "general")
                .put("message", "TEST PLEASE IGNORE isolated native API test.");
        long id = new JSONObject(api.request("POST", "/api/enquiries/contact", contact)).getLong("id");
        JSONObject login = new JSONObject(api.request("POST", "/api/admin/login",
                new JSONObject().put("password", args[1])));
        api.setCsrf(login.getString("csrfToken"));
        JSONArray enquiries = new JSONArray(api.request("GET", "/api/admin/enquiries", null));
        boolean found = false;
        for (int i = 0; i < enquiries.length(); i++) found |= enquiries.getJSONObject(i).getLong("id") == id;
        require(found, "Created enquiry not found");
        api.request("PATCH", "/api/admin/enquiries/" + id, new JSONObject().put("status", "contacted"));
        api.request("PUT", "/api/admin/menu", new JSONObject().put("menu", menu.getJSONObject("menu")).put("override", 1));
        require(new JSONObject(api.request("GET", "/api/menu", null)).getInt("override") == 1, "Override not saved");
        api.request("DELETE", "/api/admin/enquiries/" + id, null);
        api.request("POST", "/api/admin/logout", null);
        try {
            api.request("GET", "/api/admin/enquiries", null);
            throw new AssertionError("Logged-out session remained valid");
        } catch (ApiClient.HttpError error) {
            require(error.status == 401, "Unexpected logout response");
        }
        System.out.println("Native API client/backend contract passed.");
    }
}
