import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { looksLikeReplyEmail, supportMailCopy } from "../core/support-request";

// HPD-889, Justus 24.09.: the product help screen shows the reported account,
// its email and the session sentence like the Hermes form, and takes a reply
// email. Signed out, only the reply field shows.

const form = readFileSync(new URL("../src/SupportRequestForm.tsx", import.meta.url), "utf8");
const mail = form.slice(form.indexOf("function ProductSupportMailForm("), form.indexOf("function HermesSupportRequestForm("));

test("the account and reply copy names the product and never Hey", () => {
  const en = supportMailCopy("en", "HODL");
  assert.equal(en.account, "HODL account");
  assert.equal(en.sessionSource, "Taken from your signed-in session and cannot be changed here.");
  assert.equal(en.replyEmail, "Reply email");
  assert.equal(supportMailCopy("de", "HODL").account, "HODL-Konto");
  for (const locale of ["en", "de", "fr"] as const) {
    for (const text of Object.values(supportMailCopy(locale, "HODL"))) {
      assert.doesNotMatch(text, /Hey|heyhermes|\{product\}/, `${locale}: ${text}`);
    }
  }
});

test("the account block shows only with an account; the reply field always", () => {
  assert.match(mail, /\{mailAccount \? \(\s+<View style=\{styles\.field\} testID="product-support-account">/);
  assert.match(mail, /\{mailAccount\.display\}/);
  assert.match(mail, /\{mailAccount\.email \? \(/);
  assert.match(mail, /mailCopyText\.sessionSource/);
  assert.match(mail, /accessibilityLabel=\{mailCopyText\.replyEmail\}/);
});

test("the reply address goes into the email and must look like an address", () => {
  assert.match(mail, /context: reply \? \[\.\.\.mailContext, `Reply email: \$\{reply\}`\] : mailContext/);
  assert.match(mail, /if \(reply && !looksLikeReplyEmail\(reply\)\)/);
  assert.equal(looksLikeReplyEmail("reply@example.com"), true);
  assert.equal(looksLikeReplyEmail("not an address"), false);
});
