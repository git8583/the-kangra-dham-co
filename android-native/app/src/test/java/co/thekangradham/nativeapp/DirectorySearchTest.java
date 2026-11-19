package co.thekangradham.nativeapp;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import org.junit.Test;

public class DirectorySearchTest {
    @Test public void searchMatchesAllWordsIgnoringCaseAndSpacing() {
        String listing = "The Kangra Dham Co. Food & drink Sector 137 Noida";
        assertTrue(DirectorySearch.matches(listing, "food", "  NOIDA  kangra ", "all"));
        assertTrue(DirectorySearch.matches(listing, "food", " ", "food"));
        assertFalse(DirectorySearch.matches(listing, "food", "kangra hospital", "all"));
        assertFalse(DirectorySearch.matches(listing, "food", "noida", "other"));
    }
}
