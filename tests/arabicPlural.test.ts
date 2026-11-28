import test from "node:test";
import assert from "node:assert/strict";
import { countAyat } from "../utils/arabicPlural";

test("Arabic number agreement for آية", () => {
  assert.equal(countAyat(1), "1 آية");
  assert.equal(countAyat(2), "آيتان");
  assert.equal(countAyat(3), "3 آيات");
  assert.equal(countAyat(10), "10 آيات");
  assert.equal(countAyat(11), "11 آية");
  assert.equal(countAyat(286), "286 آية");
});
