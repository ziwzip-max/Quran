const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Keep Arabic text as UTF-8 in production bundles. With the default
// `ascii_only: true`, every Quran character becomes a 6-byte `\uXXXX` escape,
// roughly tripling the size of the bundled Quran text.
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  output: { ...config.transformer.minifierConfig?.output, ascii_only: false },
};

module.exports = config;
