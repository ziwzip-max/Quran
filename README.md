# Al-Hifz — الحفظ

An app to read, memorise and review the Quran, in Arabic, right to left.
It runs **in the browser** (deployed on Vercel) and as an **Android app** (APK built by GitHub Actions).

- Web: https://al-hifz-kappa.vercel.app
- Android: download the latest `al-hifz-*.apk` from the repository's **Releases** page
  (release tag `android-latest`). See [INSTRUCTIONS.md](INSTRUCTIONS.md) to install it.

## Features

**Reading**
- 114 surahs (Hafs, Uthmani script) with the Qaloon riwaya as an option
- Search that ignores vowel marks and letter variants, with highlighted results
- Filters by Juz (1–30) and Meccan / Medinan
- Mushaf view, continue-reading card, verse of the day, du'a of the day
- Tajweed colouring with one legend per surah and an explanation for each rule
- Tafsir (Al-Muyassar) and an optional French or English translation, kept offline after the first view
- Share or copy a verse with its reference

**Audio**
- 9 reciters (verse by verse or whole surah), speed, per-verse repeat, continuous play, sleep timer
- Repeat a range of verses N times with a pause between rounds, for memorisation
- Mini player above the tabs; offline download of a surah on Android

**Memorisation**
- Bookmarked verses grouped into consecutive blocks with mastery levels 0–3
- Spaced repetition (3 / 7 / 30 days) and a guided daily review (forgot / hard / good)
- Statistics, streak, daily reminder notification (Android)
- Prayer-verses practice in five modes: display, word-by-word quiz, flashcards, dictation, progressive hiding
- Backup and restore of all data as a JSON file

**Interface**
- Right-to-left layout; side menu on wide screens
- Four themes, automatic night mode, five Arabic fonts (Noto Naskh by default)
- Installable web app that works offline after the first visit

## Development

Requirements: Node.js 22.

```bash
npm ci
npm start          # web dev server
npm test           # unit tests (search, Tajweed, spaced repetition, Quran data)
npm run typecheck
npm run lint
npm run web:build  # production web build in dist/ (what Vercel runs)
```

Android: the native project is generated, not committed. Building an APK locally needs the
Android SDK and JDK 17; the normal path is the GitHub Actions workflow
(`.github/workflows/android.yml`). Details in [INSTRUCTIONS.md](INSTRUCTIONS.md).

## Project structure

```
app/                 Screens (Expo Router)
  (tabs)/            السور · الحفظ · الصلاة · المصحف · الأدعية
  surah/[id].tsx     Surah reader
  review.tsx         Guided daily review
components/          Mini player, side menu, settings sheet, range repeat, Tajweed popup…
contexts/            Settings, bookmarks, mastery, audio
constants/           Quran text (Hafs, Qaloon), metadata, themes, du'as
utils/               Search, Tajweed parser, spaced repetition, translations/tafsir cache, sharing
public/              Web app manifest, icons, service worker
scripts/             Web post-build step, data generation scripts
tests/               Unit tests (node:test)
```

## Stored data (device / browser storage)

| Key | Content |
|---|---|
| `al_hifz_settings` | All settings |
| `al_hifz_bookmarks` | Bookmarked verses (`"surah:verse": true`) |
| `al_hifz_mastery` | Mastery level per verse (0–3) |
| `al_hifz_reviews` | Last review time per block (`"surah:start-end"`) |
| `al_hifz_daily_counts` | Verses reviewed per day |
| `al_hifz_history`, `al_hifz_last_surah`, `al_hifz_pins` | Reading history, last surah, pinned surahs |
| `al_hifz_search_history` | Recent searches |
| `al_hifz_pos_{n}` | Scroll position per surah |
| `al_hifz_ed_{edition}_{n}` | Cached tafsir / translation per surah |
