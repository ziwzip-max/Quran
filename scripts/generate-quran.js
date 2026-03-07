const https = require('https');
const fs = require('fs');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching full Quran from api.alquran.cloud...');
  const data = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
  
  if (data.code !== 200) {
    console.error('API error:', data);
    process.exit(1);
  }

  const surahs = data.data.surahs;
  console.log(`Got ${surahs.length} surahs`);

  // Build the TypeScript file
  let output = `export interface Verse {
  number: number;
  text: string;
}

export interface Surah {
  number: number;
  nameArabic: string;
  nameTranslit: string;
  nameFr: string;
  versesCount: number;
  verses: Verse[];
}

export const SURAHS: Surah[] = [\n`;

  // French names for surahs
  const frNames = [
    "L'Ouverture","La Vache","La Famille d'Imran","Les Femmes","La Table Servie",
    "Les Bestiaux","Les Hauteurs","Le Butin","Le Repentir","Jonas",
    "Houd","Joseph","Le Tonnerre","Abraham","Al-Hijr",
    "Les Abeilles","Le Voyage Nocturne","La Caverne","Marie","Ta-Ha",
    "Les Prophètes","Le Pèlerinage","Les Croyants","La Lumière","Le Discernement",
    "Les Poètes","Les Fourmis","Le Récit","L'Araignée","Les Romains",
    "Luqman","La Prosternation","Les Coalisés","Saba","Le Créateur",
    "Ya-Sin","Les Rangées","Sad","Les Groupes","Le Pardonneur",
    "Fuçsilat","La Consultation","L'Ornement","La Fumée","L'Agenouillée",
    "Al-Ahqaf","Muhammad","La Victoire","Les Appartements","Qaf",
    "Les Dispersants","Le Mont","L'Étoile","La Lune","Le Tout Miséricordieux",
    "L'Inévitable","Le Fer","La Discussion","L'Examinée","Les Rangs",
    "Le Vendredi","Les Hypocrites","Le Gain Mutuel","Le Divorce","L'Interdiction",
    "La Royauté","La Plume","La Réalité","Les Degrés","Noé",
    "Les Djinns","L'Enveloppé","Le Revêtu","La Résurrection","L'Homme",
    "Les Envoyés","La Nouvelle","Ceux Qui Arrachent","Il S'est Renfrogné","L'Enroulement",
    "La Déchirure","La Fracture","Ceux Qui Fraudent","L'Éclatement","Les Constellations",
    "Le Visiteur Nocturne","Le Plus Haut","L'Enveloppante","L'Aube","La Cité",
    "Le Soleil","La Nuit","L'Aube du Matin","L'Élargissement","Le Figuier",
    "Le Caillot","La Nuit du Destin","La Preuve","Le Tremblement","Les Coureurs",
    "Le Coup Violent","La Rivalité","L'Après-Midi","Le Calomniateur","L'Éléphant",
    "Quraych","Les Ustensiles","L'Abondance","Les Infidèles","Le Secours",
    "La Corde de Palmier","L'Intégrité","L'Aube du Matin","Les Hommes"
  ];

  for (const surah of surahs) {
    const verses = surah.ayahs.map(a => `      { number: ${a.numberInSurah}, text: ${JSON.stringify(a.text)} }`).join(',\n');
    const frName = frNames[surah.number - 1] || surah.englishName;
    output += `  {\n`;
    output += `    number: ${surah.number},\n`;
    output += `    nameArabic: ${JSON.stringify(surah.name)},\n`;
    output += `    nameTranslit: ${JSON.stringify(surah.englishName)},\n`;
    output += `    nameFr: ${JSON.stringify(frName)},\n`;
    output += `    versesCount: ${surah.ayahs.length},\n`;
    output += `    verses: [\n${verses}\n    ],\n`;
    output += `  },\n`;
  }

  output += `];\n`;

  fs.writeFileSync('constants/quranData.ts', output);
  console.log('Done! File written to constants/quranData.ts');
  
  // Count total verses
  const totalVerses = surahs.reduce((sum, s) => sum + s.numberOfAyahs, 0);
  console.log(`Total verses: ${totalVerses}`);
}

main().catch(console.error);
