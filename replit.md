# Al-Hifz — تطبيق حفظ القرآن الكريم

Application mobile Expo React Native pour apprendre et mémoriser le Coran en arabe.

## Architecture

- **Frontend**: Expo Router (file-based routing), React Native, TypeScript
- **Backend**: Express.js (port 5000) — sert les assets statiques et l'API
- **Données locales**: AsyncStorage pour la persistance de tous les réglages
- **Données Coran**: Fichier TypeScript statique (`constants/quranData.ts`) avec les 114 sourates et le texte arabe

## Structure des fichiers

```
app/
  _layout.tsx              # Root layout, providers, fonts, NotificationScheduler
  (tabs)/
    _layout.tsx            # 4 onglets: السور / محفوظاتي / المراجعة / الأدعية
    index.tsx              # Liste des sourates + VOTD + recherche plein texte + filtres Juz + "continuer la lecture" + Du'a du jour
    bookmarks.tsx          # Mémorisation — sourates avec niveaux L0-L3 + stats hebdo + graphique 7 jours
    practice.tsx           # 5 modes: عرض / اختبار / بطاقات / إملاء (dictée) / تغطية (masquage progressif)
    dua.tsx                # Bibliothèque de du'as + ajout personnalisé
  surah/[id].tsx           # Lecture avec audio, Tajweed, Tafsir, navigation infinie, minuteur sommeil, téléchargement hors-ligne

constants/
  quranData.ts             # 114 sourates avec texte arabe (Hafs)
  qaloonData.ts            # Texte arabe selon la riwaya Qaloon
  quranMeta.ts             # Métadonnées (type, juz, mots, lettres)
  themes.ts                # 4 thèmes: sombre, sepia (parchmin), ocean, desert + 9 récitateurs
  duaaData.ts              # 490+ du'as classiques par catégorie
  verseOfDayList.ts        # ~70 versets sélectionnés pour le Verset du Jour

contexts/
  BookmarksContext.tsx     # Signets + blocs consécutifs
  MasteryContext.tsx       # Niveaux L0-L3 + spaced repetition + enregistrement activité quotidienne
  AudioContext.tsx         # Lecture audio (9 récitateurs) + pause/resume + mode surah + minuteur sommeil + cache hors-ligne
  SettingsContext.tsx      # Thème, police, récitateur, options lecture + mode nuit auto

utils/
  notifications.ts         # Notifications SRS intelligentes (expo-notifications)

components/
  SettingsModal.tsx        # Modal paramètres avec gestion du cache audio
  ErrorBoundary.tsx        # Error boundary global
```

## Fonctionnalités

### 1. Lecture du Coran (القرآن)
- Liste des 114 sourates avec numéros et noms arabes
- Recherche par nom (arabe ou translittération) + recherche plein texte arabe dans les 6236 versets
- Filtres Juz (1-30) et type de révélation (mecquoise/médinoise)
- Page de lecture avec Bismillah, numéros de versets
- Navigation infinie entre sourates (swipe ou flèches)
- Bouton Tajweed dans le header (sans ouvrir les paramètres)
- Widget "continuer la lecture" sur l'écran d'accueil

### 2. Audio
- 9 récitateurs dont 2 en mode surah complet (Raad Al-Kurdi, Islam Sobhi)
- Minuteur de sommeil (15/30/45/60 min) avec compte à rebours visible
- Cache hors-ligne: téléchargement par sourate, lecture sans connexion
- Vitesse de lecture (0.75x / 1x / 1.25x), répétition, lecture continue

### 3. Mémorisation (الحفظ)
- Versets regroupés par blocs consécutifs avec niveaux L0-L3
- Statistiques: graphique 7 jours, barre de maîtrise, streak
- Révision par répétition espacée (SRS)

### 4. Pratique (5 modes)
- **عرض**: Affichage des versets suggérés
- **اختبار**: Révélation mot par mot
- **بطاقات**: Flashcards avec animation de retournement
- **إملاء**: Dictée — taper le verset et vérification mot par mot
- **تغطية**: Masquage progressif des mots

### 5. Paramètres
- 4 thèmes: ليلي / نهاري / عتيق / أبيض (blanc pur, texte noir) + 5 couleurs d'accent
- 5 polices arabes: افتراضي, نسخ, أميري قرآن, شهرزاد, لطيف (×1.2 multiplicateur auto)
- Mode nuit automatique (suit le thème système)
- Notifications SRS intelligentes avec compte des versets dus
- Gestion du cache audio (voir taille + vider)

## AsyncStorage Keys
- `al_hifz_settings` — tous les réglages
- `al_hifz_bookmarks` — signets
- `al_hifz_mastery` — niveaux de maîtrise
- `al_hifz_reviews` — dates de révision
- `al_hifz_pos_{n}` — position de scroll par sourate
- `al_hifz_last_surah` — dernière sourate visitée
- `al_hifz_pins` — sourates épinglées
- `al_hifz_today` — stats du jour
- `al_hifz_streak` — série de jours actifs
- `al_hifz_dua_custom` — du'as personnalisés
- `al_hifz_daily_counts` — activité quotidienne (JSON {date: count})

## Workflows

- `Start Backend`: `npm run server:dev` → port 5000
- `Start Frontend`: `npm run expo:dev` → port 8081 (avec HMR)
