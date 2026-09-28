import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildSupportRequestUserInput, isApplePrivateRelayEmail, supportReplyEmailPrefill } from "../core/support-request";
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
  // With a server email the hint never shows.
  assert.deepEqual(supportReplyEmailPrefill(verified, "abc123@privaterelay.appleid.com"), { value: "", appleRelayHint: false });
  assert.equal(
    supportRequestCopy("en").appleRelayHint,
    "Apple private relay addresses may not receive our replies — please enter an email you can read.",
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
