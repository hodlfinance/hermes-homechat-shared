import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const opening = source.slice(
  source.indexOf("const renderChatOpening"),
  source.indexOf("if (!sessionRestored)"),
);

test("the native chat menu stays available while the external runtime is connecting", () => {
  assert.match(opening, /onPress=\{\(\) => setMenuOpen\(true\)\}/);
  const menuButton = opening.slice(opening.indexOf("<Pressable"), opening.indexOf("</Pressable>") + "</Pressable>".length);
  assert.doesNotMatch(menuButton, /disabled/);
  assert.match(opening, /accessibilityState=\{\{ disabled: true \}\}/);
  assert.match(opening, /<MobileNavigationDrawer/);
  assert.match(opening, /onNewPage=\{/);
  assert.match(opening, /onOpenAutomations=\{/);
  assert.match(opening, /onOpenAiAccess=\{/);
  assert.match(opening, /onOpenDashboard=\{/);
  assert.doesNotMatch(opening, /<MobileSystemRow/);
});

test("the connecting drawer keeps navigation live while runtime actions stay fail closed", () => {
  assert.match(opening, /onOpenHome=\{\(\) => \{\s*setMenuOpen\(false\);\s*setOpeningDestinationTitle\(null\);\s*setTab\("chat"\);\s*\}\}/s);
  assert.match(opening, /onLocaleChange=\{setAppLocale\}/);
  assert.doesNotMatch(source, /runtimeAvailable/);
  assert.match(opening, /onNewPage=\{\(\) => \{\s*setMenuOpen\(false\);\s*setOpeningDestinationTitle/s);
  assert.match(opening, /onOpenDashboard=\{\(\) => \{\s*setMenuOpen\(false\);\s*setOpeningDestinationTitle/s);
  assert.match(opening, /openingDestinationTitle \|\| tab !== "chat"/);
  assert.match(opening, /mobileScreenTitle\(tab, settingsSection, t\)/);
  assert.match(opening, /sessionFailureCopy\?\.body \|\| message/);
});
