# Native Android (in progress)

This is a native Android application, separate from the earlier Capacitor
website wrapper. It is not ready for publication. Native menu, directory,
content, order, enquiry and admin implementations are under development; see
`PARITY.md` for missing behavior and verification requirements.

A bounded `testDebugUnitTest assembleDebug` build and debug APK signature
verification have passed. The APK at
`app\build\outputs\apk\debug\app-debug.apk` is for testing only, not a
production update. It has not passed on-device parity testing and is not
published.

Build from this directory using `gradlew.bat testDebugUnitTest assembleDebug`
on Windows with Android SDK 35 and JDK 17 or newer. The app bundles the
repository's menu as an offline fallback; a successful API refresh is cached
locally. Cached and bundled information may be stale.

When a dedicated test emulator or device is available, run
`scripts\smoke-test.ps1 -Serial <serial> -Apk app\build\outputs\apk\debug\app-debug.apk`.
The smoke test checks read-only navigation, search and client-side validation;
it does not submit enquiries or perform production admin writes.

Run `node android-native\test\native-api-contract.js` from the repository root
after installing the existing Node dependencies to exercise the backend
contracts against a temporary database and an ephemeral loopback-only server.
It never uses the production database.

To additionally exercise the native Java API client against that backend,
compile `ApiClient.java`, `MenuResponse.java` and
`test\NativeBackendContract.java` with the Gradle-resolved `org.json`,
OkHttp, Okio and Kotlin standard-library JARs, then set
`KANGRA_NATIVE_CLIENT_CP` to the compiled classes and those JARs when running
the same Node command.
