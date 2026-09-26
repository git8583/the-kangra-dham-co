const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEnquiry, validateMenu } = require('../lib/validation');
const menu = require('../data/menu.json');

test('accepts a valid contact enquiry', () => {
    const result = validateEnquiry({
        name: 'Kapil Sharma',
        email: 'kapil@example.com',
        phone: '9876543210',
        subject: 'general',
        message: 'Please share opening hours.'
    }, 'contact');
    assert.equal(result.email, 'kapil@example.com');
    assert.equal(result.type, 'contact');
});

test('rejects an invalid catering phone number', () => {
    assert.throws(() => validateEnquiry({
        name: 'Kapil Sharma',
        email: 'kapil@example.com',
        phone: '123',
        service: 'bulk-order'
    }, 'catering'), /valid Indian phone number/);
});

test('rejects honeypot submissions', () => {
    assert.throws(() => validateEnquiry({
        name: 'Bot Person',
        email: 'bot@example.com',
        subject: 'general',
        message: 'Spam',
        website_url_hp: 'https://spam.example'
    }, 'contact'), /rejected/);
});

test('validates the complete seven-day menu', () => {
    const result = validateMenu(menu);
    assert.equal(result.daily.length, 7);
    assert.equal(result.daily[0].day, 'Sunday');
});

test('rejects incomplete menus', () => {
    assert.throws(() => validateMenu({ daily: [] }), /exactly seven/);
});
