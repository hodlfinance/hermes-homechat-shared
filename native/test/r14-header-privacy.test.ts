import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

test("the subtle chat-header lock opens the same localized Privacy sheet as the menu", () => {
  const header = source.slice(source.indexOf('<View style={styles.mobileAppBar}>'), source.indexOf('{dashboardOpenState !== "idle"'));
  const drawerCall = source.slice(source.indexOf("<MobileNavigationDrawer"), source.indexOf("{foregroundNotification"));

  assert.match(header, /tab === "chat"/);
  assert.match(header, /styles\.mobilePrivacyButton/);
  assert.match(header, /<Lock size=\{27\} strokeWidth=\{1\.4\} color=\{palette\.muted\}/);
  assert.match(header, /accessibilityLabel=\{t\.settings\.privacy\}/);
  assert.match(header, /setPrivacyWorkspace\(snapshot\.workspace\.id\)/);
  assert.match(drawerCall, /onOpenPrivacy=\{\(\) => \{ setMenuOpen\(false\); setPrivacyWorkspace\(snapshot\.workspace\.id\); \}\}/);
  assert.match(source, /mobilePrivacyButton: \{[\s\S]*?width: 44,[\s\S]*?height: 44,/);
});
