package co.thekangradham.nativeapp;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

final class ImageLoader {
    private static final int MAX_BYTES = 8 * 1024 * 1024;
    private final ExecutorService executor = Executors.newFixedThreadPool(3);
    private final Activity activity;

    ImageLoader(Activity activity) { this.activity = activity; }
    void close() { executor.shutdownNow(); }

    void add(LinearLayout parent, String uri, String caption) {
        TextView state = new TextView(activity);
        state.setText(caption + " — loading image");
        parent.addView(state);
        ImageView image = new ImageView(activity);
        image.setContentDescription(caption);
        image.setAdjustViewBounds(true);
        parent.addView(image);
        executor.execute(() -> {
            try {
                URL url = new URL(uri);
                if (!url.getProtocol().equals("https")) throw new IOException("Image must use HTTPS");
                File cached = new File(activity.getCacheDir(), "image-" + key(uri));
                byte[] bytes;
                boolean cacheUnavailable = false;
                if (cached.isFile()) {
                    try (InputStream input = new FileInputStream(cached)) { bytes = read(input); }
                } else {
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setConnectTimeout(10000);
                    connection.setReadTimeout(15000);
                    try {
                        if (connection.getResponseCode() != 200) throw new IOException("Image unavailable");
                        try (InputStream input = connection.getInputStream()) { bytes = read(input); }
                    } finally {
                        connection.disconnect();
                    }
                    File temporary = null;
                    try {
                        temporary = File.createTempFile("image-", ".part", activity.getCacheDir());
                        try (FileOutputStream output = new FileOutputStream(temporary)) { output.write(bytes); }
                        if (!temporary.renameTo(cached) && !cached.isFile()) throw new IOException("Unable to save image cache");
                    } catch (IOException error) {
                        cacheUnavailable = true;
                    } finally {
                        if (temporary != null && temporary.exists()) temporary.delete();
                    }
                }
                BitmapFactory.Options bounds = new BitmapFactory.Options();
                bounds.inJustDecodeBounds = true;
                BitmapFactory.decodeByteArray(bytes, 0, bytes.length, bounds);
                BitmapFactory.Options options = new BitmapFactory.Options();
                options.inSampleSize = 1;
                while (bounds.outWidth / options.inSampleSize > 720 || bounds.outHeight / options.inSampleSize > 720) {
                    options.inSampleSize *= 2;
                }
                Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length, options);
                if (bitmap == null) {
                    cached.delete();
                    throw new IOException("Invalid image");
                }
                boolean failedToCache = cacheUnavailable;
                activity.runOnUiThread(() -> {
                    if (activity.isFinishing() || activity.isDestroyed()) return;
                    image.setImageBitmap(bitmap);
                    state.setText(failedToCache ? caption + " — offline image cache unavailable" : caption);
                });
            } catch (IOException error) {
                activity.runOnUiThread(() -> {
                    if (!activity.isFinishing() && !activity.isDestroyed()) state.setText(caption + " — image unavailable");
                });
            }
        });
    }

    private static byte[] read(InputStream input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int count;
        while ((count = input.read(buffer)) != -1) {
            if (output.size() + count > MAX_BYTES) throw new IOException("Image is too large");
            output.write(buffer, 0, count);
        }
        return output.toByteArray();
    }
    private static String key(String value) throws IOException {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte b : digest) result.append(String.format(java.util.Locale.ROOT, "%02x", b & 0xff));
            return result.toString();
        } catch (NoSuchAlgorithmException error) {
            throw new IOException("Image cache unavailable", error);
        }
    }
}
