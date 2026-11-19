package co.thekangradham.nativeapp;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

final class MenuResponse {
    static void validate(JSONObject response) throws JSONException {
        JSONObject menu = response.getJSONObject("menu");
        JSONArray days = menu.getJSONArray("daily");
        if (days.length() != 7) throw new JSONException("Expected seven daily menus");
        for (int i = 0; i < days.length(); i++) {
            JSONObject item = days.getJSONObject(i);
            for (String key : new String[] {"day", "dayShort", "title", "price", "madra", "khatta", "note"}) {
                if (!(item.get(key) instanceof String)) throw new JSONException("Invalid menu field: " + key);
            }
        }
        JSONArray fixed = menu.getJSONArray("fixedItems");
        for (int i = 0; i < fixed.length(); i++) {
            if (!(fixed.get(i) instanceof String)) throw new JSONException("Invalid fixed item");
        }
        for (String list : new String[] {"sideMenu", "retail"}) {
            JSONArray items = menu.getJSONArray(list);
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                for (String key : new String[] {"name", "price", "desc"}) {
                    if (!(item.get(key) instanceof String)) throw new JSONException("Invalid " + list + " field: " + key);
                }
            }
        }
        if (!response.has("override")) throw new JSONException("Missing menu override");
        if (!response.isNull("override")) {
            Object value = response.get("override");
            if (!(value instanceof Number) || ((Number) value).doubleValue() != ((Number) value).intValue()
                    || ((Number) value).intValue() < 0 || ((Number) value).intValue() > 6) {
                throw new JSONException("Invalid menu override");
            }
        }
    }

    private MenuResponse() {}
}
