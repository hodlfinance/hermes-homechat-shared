import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// HPD-889, Build 63 smoke: iOS refuses canOpenURL("mailto:…") unless the host
// lists mailto in LSApplicationQueriesSchemes, so the help form must open the
// mail app with openURL alone and treat its rejection as "no mail app".

const form = readFileSync(new URL("../src/SupportRequestForm.tsx", import.meta.url), "utf8");
const opener = form.slice(
  form.indexOf("export async function openSupportMailUrl("),
  form.indexOf("/** The mailto URL of a product support email"),
);

test("the mail opener calls openURL directly and never asks canOpenURL", () => {
  assert.doesNotMatch(form, /Linking\.canOpenURL/);
  assert.match(opener, /await Linking\.openURL\(url\);\s+return true;/);
  assert.match(opener, /catch \{\s+return false;/);
});
