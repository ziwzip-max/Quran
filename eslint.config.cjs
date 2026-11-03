const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "server_dist/*", "static-build/*", "artifacts/*", "deploywalk/*", "attached_assets/*"],
  },
  {
    files: ["*.cjs", "scripts/**/*.js", "scripts/**/*.cjs"],
    languageOptions: { globals: globals.node },
  },
]);
