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

test("the host can put a grey support button left of the chat-header lock that opens the Hermes support screen", () => {
  const header = surface.slice(surface.indexOf("<View style={styles.mobileAppBar}>"), surface.indexOf('{dashboardOpenState !== "idle"'));
  const supportAt = header.indexOf("ChatHeaderSupportIcon &&");
  const lockAt = header.indexOf("<Lock size={27}", Math.max(supportAt, 0));
  assert.ok(supportAt > 0 && lockAt > 0 && supportAt < lockAt, "support button sits before (left of) the lock");
  const supportButton = header.slice(supportAt, lockAt);
  assert.match(supportButton, /selectMobileScreen\("support"\)/);
  assert.match(supportButton, /color=\{palette\.muted\}/);
  assert.match(supportButton, /accessibilityLabel=\{t\.nav\.support\}/);
  assert.match(surface, /const ChatHeaderSupportIcon = host\.presentation\?\.chatHeaderSupportIcon/);
  assert.match(host, /chatHeaderSupportIcon\?: ComponentType<\{ size: number; color: ColorValue \}>/);
});

test("support requests carry the build number next to the app version", () => {
  const clients = surface.slice(surface.indexOf("const supportRequestClient = useMemo("), surface.indexOf("const googleClientId ="));
  assert.equal((clients.match(/appVersion: supportAppVersion/g) ?? []).length, 2);
  assert.match(surface, /const supportAppVersion = [^;]*Constants\.nativeBuildVersion/);
});
