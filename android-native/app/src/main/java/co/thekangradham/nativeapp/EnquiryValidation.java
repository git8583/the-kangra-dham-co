package co.thekangradham.nativeapp;

import java.util.regex.Pattern;

final class EnquiryValidation {
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");
    private static final Pattern PHONE = Pattern.compile("^(?:\\+?91[\\s-]?)?[6-9]\\d{9}$");

    static String validate(boolean catering, String name, String email, String phone, String company,
                           String choice, String guests, String message) {
        name = name.trim(); email = email.trim(); phone = phone.trim();
        company = company.trim(); guests = guests.trim(); message = message.trim();
        if (name.isEmpty() || email.isEmpty() || choice.isEmpty() || (catering && phone.isEmpty())
                || (!catering && message.isEmpty())) return "Complete all required fields.";
        if (name.length() > 100 || email.length() > 254 || phone.length() > 20
                || company.length() > 150 || message.length() > 2000) return "A field exceeds its allowed length.";
        if (!EMAIL.matcher(email).matches()) return "Enter a valid email address.";
        if (!phone.isEmpty() && !PHONE.matcher(phone.replaceAll("\\s+", "")).matches()) {
            return "Enter a valid Indian phone number.";
        }
        if (!guests.isEmpty()) {
            try {
                int count = Integer.parseInt(guests);
                if (count < 1 || count > 10000) return "Number of people must be between 1 and 10,000.";
            } catch (NumberFormatException error) {
                return "Number of people must be between 1 and 10,000.";
            }
        }
        return null;
    }

    private EnquiryValidation() {}
}
