import assert from "node:assert/strict";
import test from "node:test";
import { appLocales } from "../core/types";
import { connectionUiCopy } from "../core/connection-ui-copy";

// HPD-1181: Hey drafts Gmail replies (gmail.compose) and sends them only after
// the user approves. The Gmail card must not claim it cannot send.
const KEY = "Hermes can read and search your email. It drafts replies that are sent only after you approve them.";

test("the Gmail card says replies are sent only after approval, in every locale", () => {
  for (const locale of appLocales) {
    const copy = connectionUiCopy(locale) as Record<string, string>;
    assert.ok(copy[KEY], `${locale} has the Gmail approval sentence`);
    assert.ok(!Object.keys(copy).some((key) => /cannot send or delete mail/.test(key)), `${locale} has no old sentence`);
  }
  assert.equal((connectionUiCopy("en") as Record<string, string>)[KEY], KEY);
});
