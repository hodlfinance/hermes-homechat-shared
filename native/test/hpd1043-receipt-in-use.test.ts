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

test("HPD-1043: every app language explains the other Hey account and names the restore button", () => {
  const seen = new Set<string>();
  for (const locale of appLocales) {
    const message = iosReceiptInUseMessage(locale);
    assert.ok(!message.includes("{restore}"), locale);
    assert.ok(message.includes(iosPaywallCopy(locale).restore), `${locale} names its own restore button`);
    assert.ok(message.includes("Hey"), `${locale} names Hey`);
    assert.ok(!/already another active subscriber/i.test(message), locale);
    assert.ok(!seen.has(message), `${locale} is translated`);
    seen.add(message);
  }
  assert.match(iosReceiptInUseMessage("en"), /another Hey account.*Restore Purchases.*Hey Support/);
  assert.match(iosReceiptInUseMessage("de"), /anderen Hey-Konto.*Käufe wiederherstellen.*Hey-Support/);
});
