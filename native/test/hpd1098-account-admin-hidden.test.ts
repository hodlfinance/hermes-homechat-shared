import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { serverAccessCopy, serverAccessVisible, serverAccessWithheldVisible } from "../src/server-access";

// HPD-1098: Justus, 2026-10-08, about "Invite person" and "People" on the app's account
// screen: "das ist ja für Admin, das soll gar nicht erscheinen in der App, wenn man
// eingeloggt ist." Inviting and managing people stays on the web Admin tab.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const accountScreen = surface.slice(
  surface.indexOf("<AccountSecurityPanel"),
  surface.indexOf("mobileDangerZoneText(appLocale)"),
);

test("the app's account screen never renders Invite person or People, for no role", () => {
  assert.ok(accountScreen.length > 0);
  assert.doesNotMatch(accountScreen, /systemPages\.account\.invite\b/);
  assert.doesNotMatch(accountScreen, /systemPages\.account\.ownerTitle\b/);
  assert.doesNotMatch(accountScreen, /onPress=\{\(\) => void createAccount\(\)\}/);
  assert.doesNotMatch(accountScreen, /onDisable=\{disableAccount\}/);
});

test("every signed-in account, the admin included, sees only its own account row", () => {
  assert.match(accountScreen, /host\.session\.mode === "standalone" && currentAccount \? \(\s*<MobileSystemSection title=\{t\.systemPages\.account\.memberTitle\}>/);
  assert.doesNotMatch(accountScreen, /&& isOwner \?/);
});

test("the Owner of a server whose SSH access is withheld reads one honest line", () => {
  const withheld = { serverOwner: true, ownerAccessAvailable: false, ownerAccessWithheld: true };
  assert.equal(serverAccessWithheldVisible(withheld), true);
  assert.equal(serverAccessVisible(withheld), false);
  assert.equal(serverAccessWithheldVisible({ ...withheld, serverOwner: false }), false);
  assert.equal(serverAccessWithheldVisible({ ...withheld, ownerAccessAvailable: true }), false);
  assert.equal(serverAccessWithheldVisible({ serverOwner: true, ownerAccessAvailable: false }), false);
  assert.equal(serverAccessWithheldVisible(null), false);
  assert.equal(serverAccessCopy("de").withheldNote, "Serverzugang ist für diesen Server noch nicht freigeschaltet.");
  assert.equal(serverAccessCopy("en").withheldNote, "Server access is not enabled for this server yet.");
  assert.equal(serverAccessCopy("fr").withheldNote, serverAccessCopy("en").withheldNote);
});

test("the note stands where the server access section would, under its title", () => {
  assert.match(
    accountScreen,
    /serverAccessVisible\(serverIdentity\) \? \([\s\S]*?<ServerAccessSection[\s\S]*?\) : serverAccessWithheldVisible\(serverIdentity\) \? \([\s\S]*?serverAccessCopy\(appLocale\)\.title[\s\S]*?serverAccessCopy\(appLocale\)\.withheldNote/,
  );
});
