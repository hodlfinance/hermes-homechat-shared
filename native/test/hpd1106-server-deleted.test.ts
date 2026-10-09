import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales, type ServerDeletedSnapshotView } from "../core/types";
import {
  heyServerDeletedCopy,
  heyServerDeletedDateLine,
  heyServerDeletedErrorMessage,
  heyServerDeletedModel,
  heyServerDeletedReceiptLine,
} from "../src/hey-server-deleted";
import { mobileProductAccessScreen } from "../src/mobile-product-access";

// HPD-1106: after "Server löschen" the account read "Dein Hermes wird eingerichtet" forever,
// because the deletion fences new provisioning. The app now shows the deleted screen instead.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const deletion: ServerDeletedSnapshotView = {
  state: "deleted",
  deletedAt: "2026-10-08T10:05:00.000Z",
  receipt: { removedVolumes: 2, removedFiles: 3, remainingVolumes: 0, remainingFiles: 0, offHostCopiesChecked: false },
  newServer: "available",
};
const base = {
  standalone: true,
  ios: true,
  showPaywallOnboarding: false,
  snapshot: { me: { id: "a" }, workspace: { id: "w" }, entitlement: { status: "active", comped: false } },
  status: null,
} as unknown as Parameters<typeof mobileProductAccessScreen>[0];

function functionBody(name: string) {
  const start = surface.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} exists`);
  const next = surface.indexOf("\nfunction ", start + 1);
  return surface.slice(start, next < 0 ? undefined : next);
}

test("a deleted server is its own screen, ahead of preparing and of the paywall", () => {
  assert.equal(mobileProductAccessScreen(base), "preparing");
  const deleted = { ...base, snapshot: { ...base.snapshot, serverDeletion: deletion } };
  assert.equal(mobileProductAccessScreen(deleted), "deleted");
  // Subscription ended and the iOS paywall would show: still the deleted state.
  assert.equal(mobileProductAccessScreen({ ...deleted, showPaywallOnboarding: true,
    snapshot: { ...deleted.snapshot, entitlement: { status: "expired", comped: false } } } as typeof base), "deleted");
  assert.equal(mobileProductAccessScreen({ ...deleted, standalone: false }), "home");
});

test("offers a new server only while the subscription runs and the Plane allows it", () => {
  assert.deepEqual(heyServerDeletedModel({ deletion, subscriptionActive: true }), { subscriptionActive: true, newServerOffered: true, manageOffered: true });
  assert.deepEqual(heyServerDeletedModel({ deletion: { ...deletion, newServer: "unavailable" }, subscriptionActive: true }),
    { subscriptionActive: true, newServerOffered: false, manageOffered: true });
  assert.deepEqual(heyServerDeletedModel({ deletion, subscriptionActive: false }), { subscriptionActive: false, newServerOffered: false, manageOffered: false });
});

test("has every word in all eight languages, with the date and the receipt filled in", () => {
  for (const locale of appLocales) {
    const copy = heyServerDeletedCopy(locale);
    for (const [key, value] of Object.entries(copy)) assert.ok(value.trim(), `${locale}.${key}`);
    assert.ok(copy.title.includes(copy.titleAccent), `${locale} accent`);
    assert.ok(copy.deletedOn.includes("{date}"), `${locale}.deletedOn`);
    assert.ok(copy.receipt.includes("{volumes}") && copy.receipt.includes("{files}"), `${locale}.receipt`);
    if (locale !== "en") assert.notEqual(copy.title, heyServerDeletedCopy("en").title, locale);
  }
  const de = heyServerDeletedCopy("de");
  assert.equal(de.title, "Dein Server wurde gelöscht");
  assert.equal(de.newServer, "Neuen Server einrichten");
  assert.equal(de.manage, "Abo verwalten");
  assert.match(de.confirmBody, /frischen Server/);
  assert.match(de.confirmBody, /alten Daten sind weg/);
  assert.equal(heyServerDeletedDateLine("de", deletion.deletedAt, () => "08.10.2026"), "Gelöscht am 08.10.2026.");
  assert.equal(heyServerDeletedReceiptLine("de", deletion.receipt), "Beleg: 2 Datenträger und 3 Dateien entfernt, vom Server ist nichts übrig.");
  assert.equal(heyServerDeletedReceiptLine("de", { ...deletion.receipt!, remainingFiles: 1 }), null);
  assert.equal(heyServerDeletedErrorMessage("de", "server_capacity_waitlist"), de.waitlist);
  assert.equal(heyServerDeletedErrorMessage("de", "subscription_required"), de.subscriptionRequired);
  assert.equal(heyServerDeletedErrorMessage("de", "boom"), de.failed);
});

test("the surface shows the deleted screen instead of the preparing screen and asks before a new server", () => {
  const gate = surface.indexOf('if (productAccessScreen === "deleted" && snapshot.serverDeletion)');
  const preparing = surface.indexOf("if (pendingProductAccess || productAccessScreen === \"no_access\") {");
  assert.ok(gate > 0 && gate < preparing, "deleted gate comes before the preparing gate");
  assert.match(surface.slice(gate, preparing), /<HeyServerDeletedPanel[\s\S]*?api\.requestNewServerAfterDeletion\(\)[\s\S]*?await refresh\(\)/);
  assert.match(surface, /paywallAccountOpen && \([^)]*productAccessScreen === "deleted"\)/);
  const panel = functionBody("HeyServerDeletedPanel");
  // The request only runs from the confirmation step, never from the first button.
  assert.match(panel, /onPress=\{\(\) => setConfirming\(true\)\}[\s\S]*?copy\.newServer/);
  assert.match(panel, /copy\.confirmBody[\s\S]*?onPress=\{\(\) => void confirmNewServer\(\)\}/);
  assert.match(panel, /model\.manageOffered && onManage/);
  assert.match(panel, /onOpenAccount[\s\S]*?onSignOut/);
});
