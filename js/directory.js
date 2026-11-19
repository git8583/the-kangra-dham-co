function matchesDirectoryListing(text, listingCategory, query, category) {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const searchableText = text.toLocaleLowerCase();
    return (category === 'all' || listingCategory === category) &&
        terms.every(term => searchableText.includes(term));
}

if (typeof module !== 'undefined') module.exports = { matchesDirectoryListing };

if (typeof document !== 'undefined') {
    const filters = document.getElementById('directoryFilters');
    const search = document.getElementById('directorySearch');
    const category = document.getElementById('directoryCategory');
    const listings = Array.from(document.querySelectorAll('#directoryListings [data-category]'));
    const status = document.getElementById('directoryStatus');
    const empty = document.getElementById('directoryEmpty');
    const clear = document.getElementById('directoryClear');

    function updateDirectory() {
        let count = 0;
        listings.forEach(listing => {
            const matches = matchesDirectoryListing(listing.textContent, listing.dataset.category, search.value, category.value);
            listing.hidden = !matches;
            if (matches) count++;
        });
        status.textContent = `${count} ${count === 1 ? 'listing' : 'listings'} found.`;
        empty.hidden = count !== 0;
    }

    search.addEventListener('input', updateDirectory);
    category.addEventListener('change', updateDirectory);
    clear.addEventListener('click', () => {
        search.value = '';
        category.value = 'all';
        updateDirectory();
        search.focus();
    });
    updateDirectory();
    filters.hidden = false;
}
