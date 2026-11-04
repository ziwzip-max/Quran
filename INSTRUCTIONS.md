# Al-Hifz — Build, Deploy and Install

Al-Hifz targets two platforms:

| Platform | How it is built | Where it goes |
|---|---|---|
| **Web** (main) | `npm run web:build` (Expo export + post-build step) | Vercel, on every push to `main` |
| **Android** | GitHub Actions: Expo prebuild + Gradle | A signed APK on the GitHub release `android-latest` |

iOS and Expo Go are not supported.

---

## Web (Vercel)

The Vercel project is connected to this repository. `vercel.json` defines the build:

- install: `npm ci`
- build: `npx expo export --platform web --output-dir dist && node scripts/web-postbuild.cjs dist`
- output: `dist/`, served as a single-page app

`scripts/web-postbuild.cjs` sets the page language to Arabic and adds the web app manifest and the
offline service worker from `public/`. Every push to `main` deploys to production; every other
branch gets a preview URL.

Build and check locally:

```bash
npm ci
npm run web:build
npx serve -s dist     # then open http://localhost:3000
```

---

## Android (APK)

### Download and install

1. Open the repository's **Releases** page and the release **`android-latest`**.
2. Download `al-hifz-<version>.apk` on the phone.
3. Open it. Android asks to allow installing apps from this source (your browser or file manager):
   allow it once, then install.

Updates are installed the same way, over the existing app, and keep your data: every APK is
signed with the same release key.

### How the APK is built

`.github/workflows/android.yml` runs on every push to `main` that changes the app and on every
pull request, and can be started by hand (**Actions → Android APK → Run workflow**). It:

1. installs dependencies and runs the type-check and tests;
2. generates the native project with `npx expo prebuild --platform android`;
3. builds a release APK with Gradle (Hermes, release JS bundle);
4. signs it with the release key from the repository secrets;
5. uploads it as a workflow artifact (on pull requests too, to test a change on a phone) and,
   for `main`, to the release `android-latest`.

If the signing secrets below are missing, the workflow still builds a **test APK** signed with the
development key and does not publish it.

The version shown in the app is `expo.version` in `app.json`; the workflow uses the run number as
the Android `versionCode`, so each build installs as an update.

### Signing key (important)

The APK is signed with a release keystore stored as repository secrets:

| Secret | Content |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | The keystore file, base64-encoded |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore and key password |
| `ANDROID_KEY_ALIAS` | Key alias (`alhifz`) |

**Keep a copy of the keystore and its password somewhere safe.** Android only installs an update
if it is signed with the same key; if the key is lost, users must uninstall the app (losing its
data unless they made a backup) to install a new one. Never commit the keystore to the repository.

To create a new key (only if you are starting over):

```bash
keytool -genkeypair -v -keystore alhifz-release.keystore -alias alhifz \
  -keyalg RSA -keysize 4096 -validity 10000
base64 -w0 alhifz-release.keystore   # value for ANDROID_KEYSTORE_BASE64
```

### Build locally (optional)

Needs the Android SDK (platform 36, build-tools 36.0.0, NDK 27.1) and JDK 17.

```bash
npm ci
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk (signed with the debug key)
```

`android/` is generated and ignored by git: change `app.json`, not the generated files.
To check that the app's JavaScript compiles for Android without the SDK:
`npm run android:bundle-check`.

---

## Data and backups

All user data (bookmarks, mastery levels, review dates, settings, history) is stored on the
device or in the browser. Use **Settings → النسخ الاحتياطي** to export a JSON backup and
**استيراد البيانات** to restore it, for example to move from the web app to the Android app.

---

## Troubleshooting

**Android says "App not installed" when updating.** The installed app was signed with a different
key (for example a locally built APK). Back up your data, uninstall, then install the new APK.

**The web app shows an old version.** Reload the page: the service worker fetches the page from
the network first and only falls back to its cached copy when offline.

**Tafsir or translation does not load.** The first view of each surah needs an internet connection;
after that it is kept on the device.

**Audio does not play.** Recitations are streamed from everyayah.com and mp3quran.net and need a
connection, except surahs downloaded on Android.
