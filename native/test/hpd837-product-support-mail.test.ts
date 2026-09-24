import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { supportMailCopy, supportRequestCopy } from "../core/support-request";

// HPD-837, Justus 24.09.: HODL's own help buttons open the same help screen as
// Hermes, without Hermes blocks, without Hey wording, with the product's own
// support address, and they compose an email because there is no Hermes session.

const form = readFileSync(new URL("../src/SupportRequestForm.tsx", import.meta.url), "utf8");

test("the product mail copy names the host product and never Hey", () => {
  for (const locale of ["en", "de", "fr", "es", "it", "pt", "ja"] as const) {
    const copy = supportMailCopy(locale, "HODL");
    for (const text of Object.values(copy)) {
      assert.doesNotMatch(text, /Hey|heyhermes|\{product\}/, `${locale}: ${text}`);
    }
    assert.match(copy.subtitle, /HODL/);
  }
  assert.equal(supportMailCopy("en", "HODL").subject, "HODL support");
  // The Hermes form's own copy is unchanged.
  assert.match(supportRequestCopy("en").subtitle, /Hey Hermes/);
});

test("mail mode renders only the product form: no account row, no reference, no Hey address", () => {
  const mail = form.slice(form.indexOf("function ProductSupportMailForm("), form.indexOf("function HermesSupportRequestForm("));
  assert.doesNotMatch(mail, /MOBILE_SUPPORT_EMAIL|heyhermes|copy\.account|copy\.subtitle|copy\.boundary|submission|client\./);
  assert.match(mail, /mailCopyText\.subtitle/);
  assert.match(mail, /mailCopyText\.boundary/);
  assert.match(mail, /\{`\$\{copy\.email\} \$\{supportEmail\}`\}/);
  assert.match(form, /if \(props\.mode === "mail"\) \{\s+return \(\s+<ProductSupportMailForm/);
  assert.match(form, /return <HermesSupportRequestForm \{\.\.\.props\} mode=\{props\.mode \?\? "signed_in"\} \/>;/);
});
