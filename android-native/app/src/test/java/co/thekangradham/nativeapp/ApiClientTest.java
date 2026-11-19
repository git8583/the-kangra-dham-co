package co.thekangradham.nativeapp;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;
import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.AtomicInteger;

public class ApiClientTest {
    private ServerSocket server;
    private Thread serverThread;
    private ApiClient client;
    private final AtomicReference<String> cookie = new AtomicReference<>();
    private final AtomicReference<String> csrf = new AtomicReference<>();
    private final AtomicReference<String> requestBody = new AtomicReference<>();
    private final AtomicReference<String> requestMethod = new AtomicReference<>();
    private final AtomicReference<Throwable> serverError = new AtomicReference<>();
    private final AtomicInteger droppedRequests = new AtomicInteger();

    @Before public void startServer() throws Exception {
        server = new ServerSocket(0, 10, InetAddress.getByName("127.0.0.1"));
        serverThread = new Thread(() -> {
            while (!server.isClosed()) {
                try (Socket socket = server.accept()) {
                    respond(socket);
                } catch (IOException error) {
                    if (!server.isClosed()) serverError.set(error);
                }
            }
        });
        serverThread.start();
        client = new ApiClient("http://127.0.0.1:" + server.getLocalPort());
    }

    @After public void stopServer() throws Exception {
        server.close();
        serverThread.join(2000);
        assertNull(serverError.get());
    }

    private void respond(Socket socket) throws IOException {
        BufferedInputStream input = new BufferedInputStream(socket.getInputStream());
        String[] requestLine = line(input).split(" ");
        requestMethod.set(requestLine[0]);
        String path = requestLine[1];
        Map<String, String> headers = new HashMap<>();
        String line;
        while (!(line = line(input)).isEmpty()) {
            int colon = line.indexOf(':');
            if (colon > 0) headers.put(line.substring(0, colon).toLowerCase(Locale.ROOT), line.substring(colon + 1).trim());
        }
        int length = Integer.parseInt(headers.getOrDefault("content-length", "0"));
        byte[] body = new byte[length];
        int offset = 0;
        while (offset < length) {
            int count = input.read(body, offset, length - offset);
            if (count < 0) throw new IOException("Incomplete request");
            offset += count;
        }
        if (path.equals("/drop")) {
            droppedRequests.incrementAndGet();
            return;
        }
        String result = "";
        String status = "204 No Content";
        String extra = "";
        if (path.equals("/login")) {
            requestBody.set(new String(body, StandardCharsets.UTF_8));
            result = "{\"csrfToken\":\"csrf-value\"}";
            status = "200 OK";
            extra = "Set-Cookie: kdc_admin=signed; HttpOnly; Secure; Path=/\r\n";
        } else if (path.equals("/save")) {
            cookie.set(headers.get("cookie"));
            csrf.set(headers.get("x-csrf-token"));
            result = "{\"error\":\"Invalid menu\"}";
            status = "400 Bad Request";
        } else if (path.equals("/logout")) {
            cookie.set(headers.get("cookie"));
            csrf.set(headers.get("x-csrf-token"));
        } else if (path.equals("/redirect")) {
            status = "302 Found";
            extra = "Location: /login\r\n";
        } else if (path.equals("/api/enquiries/contact")) {
            requestBody.set(new String(body, StandardCharsets.UTF_8));
            result = "{\"id\":1,\"message\":\"Thank you. Your enquiry has been received.\"}";
            status = "201 Created";
        }
        byte[] response = result.getBytes(StandardCharsets.UTF_8);
        OutputStream output = socket.getOutputStream();
        output.write(("HTTP/1.1 " + status + "\r\n" + extra + "Content-Type: application/json\r\nContent-Length: "
                + response.length + "\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(response);
        output.flush();
    }

    @Test public void enquiryPostsJsonWithoutAdminCredentials() throws Exception {
        JSONObject payload = new JSONObject().put("name", "TEST")
                .put("email", "test@example.test").put("subject", "general").put("message", "Test");
        JSONObject response = new JSONObject(client.request("POST", "/api/enquiries/contact", payload));
        assertEquals(1, response.getInt("id"));
        assertEquals("POST", requestMethod.get());
        assertEquals("general", new JSONObject(requestBody.get()).getString("subject"));
    }

    @Test public void doesNotRetryAnUnconfirmedWrite() {
        assertThrows(IOException.class, () -> client.request("POST", "/drop", new JSONObject()));
        assertEquals(1, droppedRequests.get());
    }

    private static String line(BufferedInputStream input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        int value;
        while ((value = input.read()) != -1 && value != '\n') {
            if (value != '\r') output.write(value);
        }
        if (value == -1) throw new IOException("Incomplete request line");
        return new String(output.toByteArray(), StandardCharsets.UTF_8);
    }

    @Test public void authenticatedWritesSendCookieAndCsrfAndExposeServerErrors() throws Exception {
        JSONObject login = new JSONObject(client.request("POST", "/login", new JSONObject()));
        client.setCsrf(login.getString("csrfToken"));
        IOException error = assertThrows(IOException.class, () -> client.request("PUT", "/save", new JSONObject()));
        assertEquals("Invalid menu", error.getMessage());
        assertEquals("{}", requestBody.get());
        assertEquals("kdc_admin=signed", cookie.get());
        assertEquals("csrf-value", csrf.get());
    }

    @Test public void sessionClearingRemovesCredentialsAndRedirectsAreNotFollowed() throws Exception {
        client.request("POST", "/login", new JSONObject().put("password", "test"));
        client.setCsrf("csrf-value");
        client.request("POST", "/logout", null);
        assertEquals("kdc_admin=signed", cookie.get());
        assertEquals("csrf-value", csrf.get());
        client.clearSession();
        client.request("POST", "/logout", null);
        assertNull(cookie.get());
        assertNull(csrf.get());
        IOException error = assertThrows(IOException.class, () -> client.request("GET", "/redirect", null));
        assertTrue(error.getMessage().contains("HTTP 302"));
    }

    @Test public void protocolRelativePathsAreRejected() {
        IOException error = assertThrows(IOException.class, () -> client.request("GET", "//example.test", null));
        assertTrue(error.getMessage().contains("Invalid request path"));
    }
}
