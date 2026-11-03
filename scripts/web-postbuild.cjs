// Runs after `expo export --platform web`: marks the page as Arabic and wires
// up the web app manifest and offline service worker from public/.
const fs = require("fs");
const path = require("path");

const outDir = process.argv[2] || "dist";
const file = path.join(outDir, "index.html");
let html = fs.readFileSync(file, "utf8");

html = html.replace(/<html lang="[^"]*"/, '<html lang="ar"');

const head = [
  '<meta name="theme-color" content="#F5F0E8" />',
  '<meta name="description" content="تطبيق لقراءة القرآن الكريم وحفظه ومراجعته" />',
  '<link rel="manifest" href="/manifest.webmanifest" />',
  '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />',
].join("\n    ");
html = html.replace("</head>", `  ${head}\n  </head>`);

const sw = `<script>
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    });
  }
</script>`;
html = html.replace("</body>", `${sw}\n</body>`);

fs.writeFileSync(file, html);
console.log("web-postbuild: updated", file);
