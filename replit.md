# Al-Hifz — تطبيق حفظ القرآن الكريم

Application mobile Expo React Native pour apprendre et mémoriser le Coran en arabe.

## Architecture

- **Frontend**: Expo Router (file-based routing), React Native, TypeScript
- **Backend**: Express.js (port 5000) — sert les assets statiques et l'API
- **Données locales**: AsyncStorage pour la persistance des signets
- **Données Coran**: Fichier TypeScript statique (`constants/quranData.ts`) avec les 114 sourates et le texte arabe

## Structure des fichiers

```
app/
  _layout.tsx              # Root layout, providers, fonts
  (tabs)/
    _layout.tsx            # 4 onglets: السور / محفوظاتي / المراجعة / الأدعية
    index.tsx              # Liste des sourates + Verset du jour + recherche
    bookmarks.tsx          # Mémorisation — sourates avec niveaux de maîtrise L0-L3
    practice.tsx           # Révision aléatoire avec flashcards
    dua.tsx                # Bibliothèque de du'as + ajout personnalisé
  surah/[id].tsx           # Lecture avec audio, Tajweed, bouton saut 1/3-2/3-fin

constants/
  quranData.ts             # 114 sourates avec texte arabe (Hafs)
  qaloonData.ts            # Texte arabe selon la riwaya Qaloon
  quranMeta.ts             # Métadonnées (type, juz, mots, lettres)
  themes.ts                # 4 thèmes: sombre, sepia (parchmin), ocean, desert
  duaaData.ts              # 66+ du'as classiques par catégorie
  verseOfDayList.ts        # ~70 versets sélectionnés pour le Verset du Jour

contexts/
  BookmarksContext.tsx     # Signets + blocs consécutifs
  MasteryContext.tsx       # Niveaux L0-L3 + spaced repetition
  AudioContext.tsx         # Lecture audio (9 récitateurs) + pause/resume + mode surah
  SettingsContext.tsx      # Thème, police, récitateur, options lecture
```

## Fonctionnalités

### 1. Lecture du Coran (القرآن)
- Liste des 114 sourates avec numéros et noms arabes
- Recherche par nom (arabe ou translittération)
- Page de lecture avec Bismillah, numéros de versets
- Bouton marque-page par verset (or = marqué)

### 2. Mémorisation (الحفظ)
- Versets regroupés par **blocs consécutifs** : si les versets 1, 2, 3 sont marqués, ils forment un seul bloc "الآيات 1 – 3"
- Interface collapsible : clic sur le nom de la sourate pour révéler les versets
- Suppression par bloc via l'icône poubelle

### 3. Tirage aléatoire (التسميع)
- Propose **2 blocs aléatoires** parmi les blocs mémorisés
- Triés dans l'ordre coranique (numéro de sourate puis verset)
- Bouton "تسميع جديد" pour régénérer

## Logique des blocs consécutifs

Dans `BookmarksContext.tsx`, la fonction `computeBlocks()`:
1. Regroupe les versets marqués par sourate
2. Trie les numéros de versets
3. Détecte les séquences consécutives (verset n et n+1)
4. Chaque séquence devient un `VerseBlock` avec startVerse/endVerse

## Design

- Thème sombre islamique : fond `#0A0E1A`, or `#C9A227`, teal `#1A8C7A`
- Interface 100% en arabe
- Police Inter pour les textes latins, taille 20-24px pour le texte arabe

## Workflows

- `Start Backend`: `npm run server:dev` → port 5000
- `Start Frontend`: `npm run expo:dev` → port 8081 (avec HMR)
