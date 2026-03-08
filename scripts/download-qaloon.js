const fs = require("fs");
const https = require("https");
const path = require("path");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "Accept": "application/json" } }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function main() {
  const surahs = [];

  for (let n = 1; n <= 114; n++) {
    process.stdout.write(`\rDownloading surah ${n}/114...   `);
    let verses = [];
    let attempts = 0;
    while (attempts < 4 && verses.length === 0) {
      try {
        const data = await fetchJson(`https://api.alquran.cloud/v1/surah/${n}/qaloon`);
        if (data?.data?.ayahs?.length > 0) {
          verses = data.data.ayahs.map((a) => ({
            number: a.numberInSurah,
            text: a.text,
          }));
        }
      } catch {}
      attempts++;
      if (verses.length === 0) await delay(800);
    }
    surahs.push({ number: n, verses });
    await delay(100);
  }

  process.stdout.write("\n");

  const output = `export const QALOON_SURAHS: Array<{ number: number; verses: Array<{ number: number; text: string }> }> = ${JSON.stringify(surahs)};\n`;

  const outPath = path.join(__dirname, "..", "constants", "qaloonData.ts");
  fs.writeFileSync(outPath, output, "utf8");
  const sizeMB = (output.length / 1024 / 1024).toFixed(2);
  console.log(`✓ Written to ${outPath} (${sizeMB} MB, ${surahs.length} surahs)`);
}

main().catch(console.error);
