const test = require('node:test');
const assert = require('node:assert/strict');
const { matchesDirectoryListing } = require('../js/directory');

test('search matches all words case-insensitively and ignores extra whitespace', () => {
    const listing = 'The Kangra Dham Co. Food & drink Sector 137 Noida';
    assert.equal(matchesDirectoryListing(listing, 'food', '  NOIDA   kangra ', 'all'), true);
    assert.equal(matchesDirectoryListing(listing, 'food', 'kangra hospital', 'all'), false);
    assert.equal(matchesDirectoryListing(listing, 'food', ' ', 'food'), true);
});

test('category and search filters both apply', () => {
    assert.equal(matchesDirectoryListing('Food in Noida', 'food', 'noida', 'food'), true);
    assert.equal(matchesDirectoryListing('Food in Noida', 'food', 'noida', 'health'), false);
    assert.equal(matchesDirectoryListing('Food in Noida', 'food', 'delhi', 'food'), false);
});
