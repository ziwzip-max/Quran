import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { inject } = require("../plugins/with-rtl.cjs") as { inject: (src: string) => string };

const MAIN_APPLICATION = `  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }
`;

test("Android: RTL is forced before React Native starts", () => {
  const out = inject(MAIN_APPLICATION);
  assert.ok(out.includes("i18n.forceRTL(this, true)"));
  assert.ok(out.includes("i18n.swapLeftAndRightInRTL(this, false)"));
  assert.ok(out.indexOf("forceRTL") < out.indexOf("loadReactNative(this)"), "must run before loadReactNative");
});

test("Android: injecting twice changes nothing", () => {
  const once = inject(MAIN_APPLICATION);
  assert.equal(inject(once), once);
});

test("Android: an unexpected template fails the build instead of shipping left-to-right", () => {
  assert.throws(() => inject("class MainApplication {}"), /loadReactNative/);
});

test("web build is marked Arabic and right to left", () => {
  const dir = mkdtempSync(join(tmpdir(), "alhifz-web-"));
  writeFileSync(join(dir, "index.html"), '<!DOCTYPE html><html lang="en"><head></head><body></body></html>');
  execFileSync("node", [join(process.cwd(), "scripts/web-postbuild.cjs"), dir]);
  const html = readFileSync(join(dir, "index.html"), "utf8");
  assert.match(html, /<html lang="ar" dir="rtl">/);
  assert.ok(html.includes('rel="manifest"'));
});
