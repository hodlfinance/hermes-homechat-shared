import assert from "node:assert/strict";
import test from "node:test";
import { appLocales } from "../core/index";
import { iosPaywallCopy, iosReceiptInUseMessage } from "../src/ios-paywall";
import { isMobileReceiptAlreadyInUse } from "../src/revenuecat-purchases";

const sdkSentence = "There is already another active subscriber using the same receipt.";

test("HPD-1043: RevenueCat's receipt-in-use refusal is recognized in every shape the SDK reports", () => {
  assert.equal(isMobileReceiptAlreadyInUse({ code: "7", message: sdkSentence }), true);
  assert.equal(isMobileReceiptAlreadyInUse({ code: "1", readableErrorCode: "RECEIPT_ALREADY_IN_USE_ERROR" }), true);
  assert.equal(isMobileReceiptAlreadyInUse({ userInfo: { readableErrorCode: "RECEIPT_ALREADY_IN_USE_ERROR" } }), true);
  assert.equal(isMobileReceiptAlreadyInUse(new Error(sdkSentence)), true);
  assert.equal(isMobileReceiptAlreadyInUse({ code: "1", userCancelled: true }), false);
  assert.equal(isMobileReceiptAlreadyInUse(new Error("Network request failed")), false);
  assert.equal(isMobileReceiptAlreadyInUse(null), false);
});

test("HPD-1043: every app language explains the other Hey account without sending the user to Restore", () => {
  const seen = new Set<string>();
  for (const locale of appLocales) {
    const message = iosReceiptInUseMessage(locale);
    // Restore Purchases fails with the same refusal, so it is never offered.
    assert.ok(!message.includes(iosPaywallCopy(locale).restore), `${locale} does not offer restore`);
    assert.ok(message.includes("Hey"), `${locale} names Hey`);
    assert.ok(!/already another active subscriber/i.test(message), locale);
    assert.ok(!seen.has(message), `${locale} is translated`);
    seen.add(message);
  }
  assert.match(iosReceiptInUseMessage("en"), /another Hey account.*Sign in with the Hey account that bought it, or contact Hey Support/);
  assert.match(iosReceiptInUseMessage("de"), /anderen Hey-Konto.*Hey-Support/);
  // French uses "tu", like the rest of the paywall.
  assert.match(iosReceiptInUseMessage("fr"), /Connecte-toi.*contacte/);
  assert.doesNotMatch(iosReceiptInUseMessage("fr"), /\b(vous|Connectez|contactez)\b/);
});
