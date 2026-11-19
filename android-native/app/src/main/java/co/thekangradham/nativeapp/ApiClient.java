package co.thekangradham.nativeapp;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

final class ApiClient {
    private static final String BASE = "https://kangradham.kran-apps.cloud";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private final String base;
    private final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS).readTimeout(15, TimeUnit.SECONDS)
            .followRedirects(false).followSslRedirects(false).retryOnConnectionFailure(false).build();
    private String cookie;
    private String csrf;

    ApiClient() { this(BASE); }
    ApiClient(String base) { this.base = base; }

    void setCsrf(String token) { csrf = token; }
    void clearSession() { cookie = null; csrf = null; }
    boolean hasSession() { return cookie != null; }

    static final class HttpError extends IOException {
        final int status;
        HttpError(int status, String message) { super(message); this.status = status; }
    }

    String request(String method, String path, JSONObject body) throws IOException, JSONException {
        if (!path.startsWith("/") || path.startsWith("//")) throw new IOException("Invalid request path.");
        Request.Builder request = new Request.Builder().url(base + path).header("Accept", "application/json");
        if (cookie != null) request.header("Cookie", cookie);
        if (csrf != null && !method.equals("GET")) request.header("X-CSRF-Token", csrf);
        RequestBody requestBody = body == null
                ? (method.equals("POST") || method.equals("PUT") || method.equals("PATCH")
                    ? RequestBody.create(new byte[0], null) : null)
                : RequestBody.create(body.toString(), JSON);
        request.method(method, requestBody);
        try (Response response = client.newCall(request.build()).execute()) {
            int status = response.code();
            if (status >= 200 && status < 300) {
                for (String setCookie : response.headers("Set-Cookie")) {
                    if (setCookie.startsWith("kdc_admin=")) cookie = setCookie.split(";", 2)[0];
                }
                if (status == 204) return "";
                ResponseBody responseBody = response.body();
                if (responseBody == null) throw new IOException("Empty response.");
                return read(responseBody.byteStream());
            }
            String message = "Request failed (HTTP " + status + ").";
            ResponseBody responseBody = response.body();
            if (responseBody != null) {
                String error = read(responseBody.byteStream());
                try {
                    message = new JSONObject(error).optString("error", message);
                } catch (JSONException ignored) {
                    // Non-JSON errors retain their HTTP status.
                }
            }
            throw new HttpError(status, message);
        }
    }

    private static String read(InputStream input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int count;
        while ((count = input.read(buffer)) != -1) {
            if (output.size() + count > 2 * 1024 * 1024) throw new IOException("Response is too large.");
            output.write(buffer, 0, count);
        }
        return new String(output.toByteArray(), StandardCharsets.UTF_8);
    }
}
