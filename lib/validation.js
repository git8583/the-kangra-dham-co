const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/;
const ALLOWED_SERVICES = new Set(['corporate-lunch', 'group-booking', 'event-catering', 'bulk-order', 'subscription', 'other']);
const ALLOWED_SUBJECTS = new Set(['general', 'feedback', 'catering', 'corporate', 'franchise', 'complaint', 'other']);

function text(value, max, required = false) {
    const result = typeof value === 'string' ? value.trim() : '';
    if (required && !result) throw new Error('A required field is missing.');
    if (result.length > max) throw new Error(`A field exceeds the ${max} character limit.`);
    return result;
}

function validateEnquiry(body, type) {
    if (!body || typeof body !== 'object') throw new Error('Invalid request body.');
    if (text(body.website_url_hp, 200)) throw new Error('Submission rejected.');

    const name = text(body.name, 100, true);
    const email = text(body.email, 254, true).toLowerCase();
    const phone = text(body.phone, 20, type === 'catering').replace(/\s+/g, '');
    const message = text(body.message, 2000, type === 'contact');
    if (!EMAIL.test(email)) throw new Error('Enter a valid email address.');
    if (phone && !PHONE.test(phone)) throw new Error('Enter a valid Indian phone number.');

    const result = { type, name, email, phone: phone || null, message: message || null };
    if (type === 'contact') {
        result.subject = text(body.subject, 40, true);
        if (!ALLOWED_SUBJECTS.has(result.subject)) throw new Error('Select a valid subject.');
        result.company = null;
        result.service = null;
        result.guests = null;
    } else {
        result.company = text(body.company, 150) || null;
        result.service = text(body.service, 40, true);
        if (!ALLOWED_SERVICES.has(result.service)) throw new Error('Select a valid service.');
        const guests = body.guests === '' || body.guests == null ? null : Number(body.guests);
        if (guests !== null && (!Number.isInteger(guests) || guests < 1 || guests > 10000)) {
            throw new Error('Number of people must be between 1 and 10,000.');
        }
        result.guests = guests;
        result.subject = null;
    }
    return result;
}

function validateMenu(menu) {
    if (!menu || !Array.isArray(menu.daily) || menu.daily.length !== 7) {
        throw new Error('Menu must contain exactly seven daily entries.');
    }
    const daily = menu.daily.map((item, index) => ({
        day: text(item.day, 20, true),
        dayShort: text(item.dayShort, 5, true),
        title: text(item.title, 100, true),
        madra: text(item.madra, 500, true),
        khatta: text(item.khatta, 500, true),
        note: text(item.note, 300, true),
        price: text(item.price, 50, true),
        emoji: text(item.emoji, 20, true),
        highlight: Boolean(item.highlight),
        image: text(item.image, 1000) || null
    }));
    if (new Set(daily.map(item => item.day.toLowerCase())).size !== 7) {
        throw new Error('Every menu day must be unique.');
    }
    return {
        fixedItems: Array.isArray(menu.fixedItems) ? menu.fixedItems.map(item => text(item, 200, true)).slice(0, 20) : [],
        daily,
        sideMenu: Array.isArray(menu.sideMenu) ? menu.sideMenu.slice(0, 50) : [],
        retail: Array.isArray(menu.retail) ? menu.retail.slice(0, 50) : []
    };
}

module.exports = { validateEnquiry, validateMenu };
