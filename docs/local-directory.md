# Local directory

The local directory is a curated, static set of listings for Sector 137, Noida.
It currently contains only The Kangra Dham Co.'s own location, using details
from `locations.html`; it is not a comprehensive directory. Confirm details
before visiting.

To add a listing, verify its details and add an article to `directory.html`
inside `#directoryListings`, with a `data-category` matching an option in
`#directoryCategory`. Include only verified information, and keep the category
label and searchable details in the article text. Update the introduction if
the scope changes. Search matches all entered words against the listing text;
the category filter and search work together.

The service worker precaches the directory, its script and the site stylesheet.
After a successful online visit installs the service worker, the directory can
be browsed offline. External services such as maps and phone calls still require
their respective connectivity, and cached details may be out of date.
