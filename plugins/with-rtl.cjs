// Expo config plugin: start the Android app right to left on the very first launch.
//
// The whole app is Arabic and its layout assumes a right-to-left direction. The JavaScript side
// calls I18nManager.forceRTL(true), but that only takes effect from the next launch. Setting the
// same preferences in MainApplication.onCreate, before React Native starts, applies them at once.
const { withMainApplication } = require("expo/config-plugins");

const MARKER = "// al-hifz: right-to-left layout";
const ANCHOR = "    loadReactNative(this)\n";

/** Adds the right-to-left setup to the source of MainApplication.kt (a no-op if already there). */
function inject(src) {
  if (src.includes(MARKER)) return src;
  if (!src.includes(ANCHOR)) {
    // Fail the build loudly rather than silently shipping a left-to-right app.
    throw new Error("plugins/with-rtl.cjs: could not find `loadReactNative(this)` in MainApplication. Update the plugin for the new template.");
  }
  const lines = [
    `    ${MARKER}`,
    "    val i18n = com.facebook.react.modules.i18nmanager.I18nUtil.getInstance()",
    "    i18n.allowRTL(this, true)",
    "    i18n.forceRTL(this, true)",
    // Keep `left` / `right` styles literal; only row order and start / end follow the direction.
    "    i18n.swapLeftAndRightInRTL(this, false)",
    "",
  ].join("\n");
  return src.replace(ANCHOR, `${lines}${ANCHOR}`);
}

function withRtl(config) {
  return withMainApplication(config, (cfg) => {
    cfg.modResults.contents = inject(cfg.modResults.contents);
    return cfg;
  });
}

module.exports = withRtl;
module.exports.inject = inject;
