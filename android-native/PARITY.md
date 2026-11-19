# Native migration checklist

The APK is not ready to publish until each item is implemented and verified on
an Android device or emulator, including error and offline paths. The original
website and backend remain the reference. Never run production write tests
without business-owner approval.

Current implementation is partial: native screens exist for home, menu,
directory, location, ordering, enquiries, content pages and administration.
Those screens are not yet parity-certified. Content is extracted from the
website at build time and must be checked for missing prices, imagery,
navigation and formatting before publication.

- [ ] Home: today's menu, navigation, calls to action and consent/translation behavior.
- [ ] Menu: seven days, fixed items, sides and retail; live override, images,
  order actions, last-known/offline data and accurate stale-data notices.
- [ ] Locations and local directory: contact details, maps, categories,
  search/clear, empty states and offline behavior.
- [ ] Order: walk-in, WhatsApp, phone, UPI and subscription paths; coming-soon
  states.
- [ ] Contact and catering: all information, validated native forms, error
  handling and submission to existing enquiry APIs. Verify form restoration
  and the uncertain-submission warning after rotation.
- [ ] Heritage, gallery, corporate plans, customer stories and privacy:
  content, images, links and interactions.
- [ ] English/Hindi behavior where provided on the website.
- [ ] Admin: login/session/logout, menu and override editing, password change,
  enquiry list/status/delete, CSRF, session expiry and unsaved-change handling.
  Verify menu edits across rotation; they are not persisted across process death.
- [ ] Device checks: accessibility, keyboard, back navigation, rotation,
  small/large screens, online/offline transitions and safe external intents.
  Activities now use Android's default configuration recreation; home/menu,
  directory filters, enquiries, admin menu edits and content scroll position
  have state restoration paths. Verify those paths on-device.
- [x] Backend contract checks against an isolated test database: enquiry,
  login, CSRF, menu/override, password change, status, deletion and logout.
  The native Java client also passed against the isolated backend, including
  PATCH and logout. Native UI-to-backend integration still requires device validation.
- [x] Bounded `testDebugUnitTest assembleDebug` build and debug-certificate
  verification passed. APK is a debug build and is not a production update.
- [ ] On-device smoke and parity checks. No device or emulator was available
  for this build; do not publish until parity and validation pass, without
  touching release-signed installers.
