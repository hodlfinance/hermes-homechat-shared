import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildSupportRequestUserInput,
  isApplePrivateRelayEmail,
  supportReplyEmailBlocksSubmit,
  supportReplyEmailPrefill,
  supportReplyEmailRelayUser,
} from "../core/support-request";
import { supportRequestCopy } from "../core/support-request-copy";
import { appLocales } from "../core/types";

// HPD-838: a HODL user's Hermes account has only a placeholder address, so the
// Hey server answers reply_email_required and the form showed an empty field
// although HODL knows the signed-in email. The host passes it as a fallback.

const required = { kind: "reply_email_required" } as const;
const verified = { kind: "verified_product_email", display: "j•••@gmail.com" } as const;

test("the host email fills the reply field only when the server has none", () => {
  assert.deepEqual(supportReplyEmailPrefill(required, "  anna@example.org "), { value: "anna@example.org", appleRelayHint: false });
  // The server email wins: the verified branch never takes the fallback.
  assert.deepEqual(supportReplyEmailPrefill(verified, "anna@example.org"), { value: "", appleRelayHint: false });
  // No prop: exactly the old behaviour, an empty required field.
  assert.deepEqual(supportReplyEmailPrefill(required, undefined), { value: "", appleRelayHint: false });
  assert.deepEqual(supportReplyEmailPrefill(required, null), { value: "", appleRelayHint: false });
  assert.deepEqual(supportReplyEmailPrefill(required, "   "), { value: "", appleRelayHint: false });
});

test("an invalid or placeholder host email is never prefilled", () => {
  assert.deepEqual(supportReplyEmailPrefill(required, "not-an-email"), { value: "", appleRelayHint: false });
  assert.deepEqual(supportReplyEmailPrefill(required, "managed-hodl-x@runtime.hey-hermes.local"), { value: "", appleRelayHint: false });
});

test("an Apple private relay address is not prefilled and shows the hint", () => {
  assert.equal(isApplePrivateRelayEmail("abc123@privaterelay.appleid.com"), true);
  assert.equal(isApplePrivateRelayEmail("ABC123@PrivateRelay.AppleID.com "), true);
  assert.equal(isApplePrivateRelayEmail("abc@appleid.com"), false);
  assert.deepEqual(supportReplyEmailPrefill(required, "abc123@privaterelay.appleid.com"), { value: "", appleRelayHint: true });
  // A relay login keeps the hint even when the server has an email: a reply email is required.
  assert.deepEqual(supportReplyEmailPrefill(verified, "abc123@privaterelay.appleid.com"), { value: "", appleRelayHint: true });
  assert.equal(
    supportRequestCopy("en").appleRelayHint,
    "Apple private relay addresses can't receive our replies. Please enter an email address you can read.",
  );
  for (const locale of appLocales) assert.ok(supportRequestCopy(locale).appleRelayHint.length > 20, locale);
});

test("a prefilled address is still validated on submit like typed input", () => {
  const projection = { accountDisplay: "HODL account", replyChannel: required };
  const prefill = supportReplyEmailPrefill(required, "anna@example.org").value;
  assert.deepEqual(buildSupportRequestUserInput({ problem: "Broken", replyEmail: prefill, projection, allowAlternateReplyEmail: false }), {
    ok: true,
    value: { problem: "Broken", replyEmail: "anna@example.org" },
  });
  // Customer cleared the field: required again.
  assert.deepEqual(buildSupportRequestUserInput({ problem: "Broken", replyEmail: "", projection, allowAlternateReplyEmail: false }), {
    ok: false,
    error: { field: "replyEmail", reason: "reply_email_required" },
  });
});

test("a relay user cannot send with an empty or relay reply email, typed or server-provided", () => {
  const relay = "abc123@privaterelay.appleid.com";
  const relayServer = { kind: "verified_product_email", display: "a•••@privaterelay.appleid.com" } as const;
  assert.equal(supportReplyEmailRelayUser(required, relay), true);
  assert.equal(supportReplyEmailRelayUser(verified, "ABC@PrivateRelay.AppleID.com"), true);
  assert.equal(supportReplyEmailRelayUser(relayServer, undefined), true);
  assert.equal(supportReplyEmailRelayUser(required, "anna@example.org"), false);
  assert.equal(supportReplyEmailRelayUser(verified, "anna@example.org"), false);

  assert.equal(supportReplyEmailBlocksSubmit(true, ""), true);
  assert.equal(supportReplyEmailBlocksSubmit(true, "  "), true);
  assert.equal(supportReplyEmailBlocksSubmit(true, "X@PRIVATERELAY.APPLEID.COM"), true);
  assert.equal(supportReplyEmailBlocksSubmit(true, "anna@example.org"), false);
  // Everyone else: unchanged, the button is never blocked by the reply field.
  assert.equal(supportReplyEmailBlocksSubmit(false, ""), false);
  assert.equal(supportReplyEmailBlocksSubmit(false, relay), false);

  for (const projection of [
    { accountDisplay: "HODL account", replyChannel: required },
    { accountDisplay: "HODL account", replyChannel: relayServer },
  ]) {
    const base = { problem: "Broken", projection, allowAlternateReplyEmail: projection.replyChannel.kind !== "reply_email_required", requireNonRelayReplyEmail: true };
    assert.deepEqual(buildSupportRequestUserInput({ ...base, replyEmail: "" }), { ok: false, error: { field: "replyEmail", reason: "reply_email_required" } });
    assert.deepEqual(buildSupportRequestUserInput({ ...base, replyEmail: "Q@PrivateRelay.AppleID.com" }), {
      ok: false,
      error: { field: "replyEmail", reason: "reply_email_apple_relay" },
    });
    assert.deepEqual(buildSupportRequestUserInput({ ...base, replyEmail: "nope" }), { ok: false, error: { field: "replyEmail", reason: "reply_email_invalid" } });
    assert.deepEqual(buildSupportRequestUserInput({ ...base, replyEmail: "anna@example.org" }), {
      ok: true,
      value: { problem: "Broken", replyEmail: "anna@example.org" },
    });
  }
  // Non-relay verified user: optional alternate stays optional.
  assert.deepEqual(
    buildSupportRequestUserInput({ problem: "Broken", replyEmail: "", projection: { accountDisplay: "a", replyChannel: verified }, allowAlternateReplyEmail: true }),
    { ok: true, value: { problem: "Broken" } },
  );
});

const form = readFileSync(new URL("../src/SupportRequestForm.tsx", import.meta.url), "utf8");
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

test("the surface hands the host email to the Hermes form; the field stays editable", () => {
  assert.match(surface, /supportReplyEmailFallback\?: string \| null;/);
  assert.match(surface, /<MobileSupportRequestForm locale=\{appLocale\} client=\{supportRequestClient\} replyEmailFallback=\{supportReplyEmailFallback\} \/>/);
  assert.match(form, /replyEmailFallback\?: string \| null;/);
  assert.match(form, /supportReplyEmailPrefill\(contextResult\.projection\.replyChannel, replyEmailFallback\)/);
  // Typed input is never overwritten by a late host email.
  assert.match(form, /if \(replyPrefill\.value && !replyEmailEdited\.current\) setReplyEmail\(replyPrefill\.value\);/);
  assert.match(form, /onChangeText=\{editReplyEmail\}/);
  assert.match(form, /\{replyPrefill\.appleRelayHint \? \(\s+<Text[^>]*testID="support-apple-relay-hint"[^>]*>\{copy\.appleRelayHint\}<\/Text>/);
});

test("the form blocks the send button for a relay user and shows the relay reason", () => {
  assert.match(form, /supportReplyEmailRelayUser\(contextResult\.projection\.replyChannel, replyEmailFallback\)/);
  assert.match(form, /requireNonRelayReplyEmail: relayUser,/);
  assert.match(form, /const sendBlocked = submitDisabled \|\| supportReplyEmailBlocksSubmit\(relayUser, replyEmail\);/);
  assert.match(form, /disabled=\{sendBlocked\}/);
  assert.match(form, /if \(reason === "reply_email_apple_relay"\) return copy\.appleRelayHint;/);
});
