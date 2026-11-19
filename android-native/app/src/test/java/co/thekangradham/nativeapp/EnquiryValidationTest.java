package co.thekangradham.nativeapp;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import org.junit.Test;

public class EnquiryValidationTest {
    @Test public void acceptsContactWithOptionalPhoneAndCateringWithIndianPhone() {
        assertNull(EnquiryValidation.validate(false, "Test", "test@example.com", "", "", "general", "", "Message"));
        assertNull(EnquiryValidation.validate(true, "Test", "test@example.com", "+91 9876543210", "", "bulk-order", "100", ""));
    }
    @Test public void rejectsMissingFieldsAndOutOfRangeGuests() {
        assertNotNull(EnquiryValidation.validate(false, "Test", "test@example.com", "", "", "general", "", ""));
        assertNotNull(EnquiryValidation.validate(true, "Test", "test@example.com", "123", "", "bulk-order", "10", ""));
        assertNotNull(EnquiryValidation.validate(true, "Test", "test@example.com", "9876543210", "", "bulk-order", "10001", ""));
    }
}
