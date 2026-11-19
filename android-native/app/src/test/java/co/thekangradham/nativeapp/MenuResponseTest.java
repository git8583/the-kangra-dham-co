package co.thekangradham.nativeapp;

import static org.junit.Assert.assertThrows;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;

public class MenuResponseTest {
    private JSONObject valid() throws JSONException {
        JSONArray days = new JSONArray();
        for (int i = 0; i < 7; i++) days.put(new JSONObject()
                .put("day", "Day").put("dayShort", "D").put("title", "Dham")
                .put("price", "Price").put("madra", "Madra").put("khatta", "Khatta").put("note", "Note"));
        return new JSONObject().put("menu", new JSONObject().put("daily", days)
                .put("fixedItems", new JSONArray()).put("sideMenu", new JSONArray())
                .put("retail", new JSONArray())).put("override", JSONObject.NULL);
    }

    @Test public void acceptsCompleteMenuAndRejectsBadOverride() throws Exception {
        JSONObject response = valid();
        MenuResponse.validate(response);
        response.put("override", 1.5);
        assertThrows(JSONException.class, () -> MenuResponse.validate(response));
    }

    @Test public void rejectsIncompleteMenuBeforeItIsCached() throws Exception {
        JSONObject response = valid();
        response.getJSONObject("menu").getJSONArray("daily").getJSONObject(3).remove("price");
        assertThrows(JSONException.class, () -> MenuResponse.validate(response));
    }
}
