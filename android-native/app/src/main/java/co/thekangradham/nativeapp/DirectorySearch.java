package co.thekangradham.nativeapp;

import java.util.Locale;

final class DirectorySearch {
    static boolean matches(String text, String listingCategory, String query, String category) {
        if (!category.equals("all") && !category.equals(listingCategory)) return false;
        String normalized = query.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty()) return true;
        String searchable = text.toLowerCase(Locale.ROOT);
        for (String term : normalized.split("\\s+")) {
            if (!searchable.contains(term)) return false;
        }
        return true;
    }

    private DirectorySearch() {}
}
