import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeSupportSignedInProjection, supportReplyDisplayIsPlaceholder } from "../core/support-request";

// HPD-837 (Launch lane F, Build 47).

test("a placeholder account address never becomes the verified reply email", () => {
  // Justus saw an address ending in hey-hermes.local as "Reply email" in the
  // HODL support form. Social and magic-link accounts carry an internal
  // placeholder until a real contact address is known; the form must then ask.
  for (const display of [
    "s•••@account.hey-hermes.local",
    "e•••@account.hey-hermes.local",
    "m•••@runtime.hey-hermes.local",
    "h•••@identity.finance.invalid",
    "x•••@Something.LOCAL",
  ]) {
    assert.equal(supportReplyDisplayIsPlaceholder(display), true, display);
    assert.deepEqual(
      normalizeSupportSignedInProjection({
        accountDisplay: "Hey account •••• AB12",
        replyChannel: { kind: "verified_product_email", display },
      }),
      { accountDisplay: "Hey account •••• AB12", replyChannel: { kind: "reply_email_required" } },
      display,
    );
  }
  assert.deepEqual(
    normalizeSupportSignedInProjection({
      accountDisplay: "Hey account •••• AB12",
      replyChannel: { kind: "verified_product_email", display: "j•••@gmail.com" },
    }),
    { accountDisplay: "Hey account •••• AB12", replyChannel: { kind: "verified_product_email", display: "j•••@gmail.com" } },
  );
});

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");

test("a host support button replaces the chat-header lock; Hey keeps the lock (HPD-837, Justus 24.09.)", () => {
  const header = surface.slice(surface.indexOf("<View style={styles.mobileAppBar}>", surface.indexOf("const renderChatOpening")), surface.indexOf('{dashboardOpenState !== "idle"'));
  const live = header.slice(header.lastIndexOf("<View style={styles.mobileAppBar}>"));
  // The support button: host glyph, header icon colour, opens the Hermes support screen.
  const supportAt = live.indexOf("ChatHeaderSupportIcon && activeSubthreadHeader");
  assert.ok(supportAt > 0);
  const supportButton = live.slice(supportAt, live.indexOf("</Pressable>", supportAt));
  assert.match(supportButton, /selectMobileScreen\("support"\)/);
  assert.match(supportButton, /<ChatHeaderSupportIcon size=\{24\} color=\{palette\.muted\} \/>/);
  assert.match(supportButton, /accessibilityLabel=\{t\.nav\.support\}/);
  // The lock renders only when the host brings no support button.
  assert.match(live, /\{tab === "chat" && !ChatHeaderSupportIcon \? \(\s+<Pressable[\s\S]*?setPrivacyWorkspace[\s\S]*?<Lock size=\{27\}/);
  const opening = surface.slice(surface.indexOf("const renderChatOpening"), surface.indexOf("const renderChatOpening") + 2500);
  assert.match(opening, /\{ChatHeaderSupportIcon \? \(\s+\/\/ HPD-837[^\n]*\n\s+<View style=\{styles\.mobileAppBarSpacer\} \/>\s+\) : \(\s+<View\s+style=\{\[styles\.mobilePrivacyButton, styles\.disabledButton\]\}/);
  // Privacy stays reachable from the left menu with the same view.
  assert.match(surface, /onOpenPrivacy=\{\(\) => \{ setMenuOpen\(false\); setPrivacyWorkspace\(snapshot\.workspace\.id\); \}\}/);
  assert.match(surface, /\{ id: "privacy", label: "Privacy" \} as const/);
  assert.match(surface, /const ChatHeaderSupportIcon = host\.presentation\?\.chatHeaderSupportIcon/);
  assert.match(host, /chatHeaderSupportIcon\?: ComponentType<\{ size: number; color: ColorValue \}>/);
});

test("support requests carry the build number next to the app version", () => {
  const clients = surface.slice(surface.indexOf("const supportRequestClient = useMemo("), surface.indexOf("const googleClientId ="));
  assert.equal((clients.match(/appVersion: supportAppVersion/g) ?? []).length, 2);
  assert.match(surface, /const supportAppVersion = [^;]*Constants\.nativeBuildVersion/);
});
