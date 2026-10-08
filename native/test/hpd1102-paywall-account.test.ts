import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales } from "../core/types";
import { heyPaywallAccountCopy } from "../src/hey-preparing";

// HPD-1102: an account without a plan sees only the purchase screen or the
// preparing screen. Apple 5.1.1(v) requires account deletion to stay
// reachable, so both screens carry a quiet "Account" entry that offers Sign
// out and the existing deletion flow, and nothing else of Hermes.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

function functionBody(name: string) {
  const start = surface.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} exists`);
  const next = surface.indexOf("\nfunction ", start + 1);
  return surface.slice(start, next < 0 ? undefined : next);
}

test("the account entry has its words in all eight languages", () => {
  for (const locale of appLocales) {
    const copy = heyPaywallAccountCopy(locale);
    for (const [key, value] of Object.entries(copy)) assert.ok(value.trim(), `${locale}.${key}`);
    assert.ok(copy.signedInAs.includes("{email}"), `${locale}.signedInAs`);
    if (locale !== "en") assert.notEqual(copy.title, heyPaywallAccountCopy("en").title, locale);
  }
  assert.equal(heyPaywallAccountCopy("de").entry, "Konto");
});

test("the purchase and the preparing screen both open the account panel from their quiet footer", () => {
  for (const name of ["HeyPreparingPanel", "IosPaywallOfferPanel"]) {
    const body = functionBody(name);
    assert.match(body, /onPress=\{onOpenAccount\}[\s\S]*?paywallFooterLink[\s\S]*?\{accountLabel\}/, name);
  }
  const gate = surface.slice(surface.indexOf("HPD-1102: the account panel"), surface.indexOf('if (productAccessScreen === "purchase")'));
  assert.match(gate, /if \(paywallAccountOpen && \(pendingProductAccess \|\| productAccessScreen === "no_access" \|\| productAccessScreen === "purchase"\)\)/);
  assert.match(gate, /<HeyPaywallAccountPanel/);
  assert.match(gate, /deletion=\{accountDeletionPanel\}/);
  assert.match(gate, /onSignOut=\{\(\) => void logout\(\)\}/);
});

test("the paywall and the settings page render the same deletion flow", () => {
  assert.equal(surface.match(/<AccountDeletionSection\b/g)?.length, 1, "one deletion element, used twice");
  assert.match(surface, /const accountDeletionPanel = host\.session\.mode === "standalone" && snapshot \? \(\s*<AccountDeletionSection/);
  assert.match(surface, /<View style=\{styles\.systemSurfaceNotice\}>\s*\{accountDeletionPanel\}/);
});

test("the account panel offers only sign out and deletion", () => {
  const body = functionBody("HeyPaywallAccountPanel");
  assert.match(body, /\{deletion\}/);
  assert.match(body, /onPress=\{onSignOut\}/);
  assert.match(body, /onPress=\{onBack\}/);
  assert.doesNotMatch(body, /selectMobileScreen|sendMessage|Composer|onPurchase/);
});

test("a deletion email link returns to the account panel when the paywall is up", () => {
  assert.match(
    surface,
    /if \(session\.purpose === "account_deletion_reauthenticate"\) \{\s*setAccountDeletionEmailReauthenticationAccountId\(session\.account\.id\);\s*setPaywallAccountOpen\(true\);/,
  );
  const logout = surface.slice(surface.indexOf("const logout = useCallback("), surface.indexOf("const logout = useCallback(") + 600);
  assert.match(logout, /setPaywallAccountOpen\(false\);/);
});
