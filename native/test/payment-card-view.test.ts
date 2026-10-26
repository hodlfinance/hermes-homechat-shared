import assert from "node:assert/strict";
import test from "node:test";
import { openCardEnvelope, type CardRequest } from "../core/payment-card";
import {
  cardApprovalSentence, cardRequestFrom, paymentCardCopy, parseCardScanText, sealCardEntry, sealPaymentCvc,
} from "../core/payment-card-view";

const today = new Date("2026-10-26T00:00:00Z");

async function guest() {
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
  return { guestKey: { kty: "EC" as const, crv: "P-256" as const, x: pub.x!, y: pub.y! }, privateKey: await crypto.subtle.exportKey("jwk", pair.privateKey) };
}

const base = (extra: Partial<CardRequest>): CardRequest => ({
  id: "crq_aaaaaaaaaaaaaaaa", kind: "entry", runId: "run_1", status: "pending", expiresAt: "2026-10-26T01:00:00Z", createdAt: "2026-10-26T00:00:00Z",
  payment: null, suggestedName: "Max Muster", guestKey: null, card: null, ...extra,
});

test("the form seals a valid card to the guest and shows only field errors for a bad one", async () => {
  const { guestKey, privateKey } = await guest();
  const request = base({ guestKey });
  const ok = await sealCardEntry(request, { number: "4242 4242 4242 4242", expiry: "12/28", cvc: "123", name: "Max Muster" }, today);
  assert.ok(ok.ok);
  const opened = await openCardEnvelope(ok.body.envelope, privateKey, "card-entry:crq_aaaaaaaaaaaaaaaa") as Record<string, unknown>;
  assert.equal(opened.number, "4242424242424242");
  assert.ok(!("cvc" in opened), "the CVC never travels with the card");
  assert.ok(!JSON.stringify(ok.body).includes("4242"));
  const bad = await sealCardEntry(request, { number: "4242 4242 4242 4241", expiry: "01/20", cvc: "", name: "" }, today);
  assert.deepEqual(bad, { ok: false, errors: { number: true, expiry: true, name: true } });
  assert.deepEqual(await sealCardEntry(base({}), { number: "4242424242424242", expiry: "12/28", cvc: "", name: "M" }, today), { ok: false, errors: {}, reason: "guest_key_missing" });
});

test("the approval seals this payment's CVC to the guest and names merchant, host, amount and card", async () => {
  const { guestKey, privateKey } = await guest();
  const request = base({
    id: "cpay_aaaaaaaaaaaaaaaa", kind: "payment", guestKey,
    payment: { cardId: "card_aaaaaaaaaaaaaaaa", merchant: "Zurich Test Box", merchantHost: "shop.example.ch", amountMinor: 4890, currency: "CHF" },
    card: { id: "card_aaaaaaaaaaaaaaaa", brand: "visa", last4: "1234", expMonth: 8, expYear: 2028, isDefault: true, createdAt: "" },
  });
  assert.equal(cardApprovalSentence(request, "en").replace(/\u00a0/gu, " "), "Pay CHF 48.90 to Zurich Test Box (shop.example.ch) with Visa …1234?");
  assert.match(cardApprovalSentence(request, "de"), /an Zurich Test Box \(shop\.example\.ch\) mit Visa …1234 zahlen\?/);
  assert.deepEqual(await sealPaymentCvc(request, "12"), { ok: false });
  const sealed = await sealPaymentCvc(request, "123");
  assert.ok(sealed.ok);
  assert.deepEqual(await openCardEnvelope(sealed.body.envelope, privateKey, "card-cvc:cpay_aaaaaaaaaaaaaaaa"), { cvc: "123" });
});

test("answers from the control plane are checked, and an unknown locale reads English", () => {
  assert.throws(() => cardRequestFrom({ id: "x", kind: "entry", status: "pending" }));
  assert.equal(cardRequestFrom({ id: "crq_aaaaaaaaaaaaaaaa", kind: "manage", status: "pending", payment: null }).kind, "manage");
  assert.equal(paymentCardCopy("ja").save, "Save card");
  assert.equal(paymentCardCopy("de").save, "Karte speichern");
});

test("a card scan fills number, expiry and name, and offers nothing it cannot trust", () => {
  const scan = parseCardScanText(["VISA", "4242 4242 4242 4242", "VALID THRU 12/28", "MAX MUSTER"], today);
  assert.deepEqual(scan, { number: "4242424242424242", expiry: "12/28", name: "Max Muster" });
  assert.deepEqual(parseCardScanText(["4242 4242 4242 4241", "01/20"], today), {});
  assert.equal(parseCardScanText(["5555 5555 5555 4444 exp 03/29"], today).number, "5555555555554444");
});

test("the pure-JS sealer (React Native) makes envelopes the guest's WebCrypto opener reads", async () => {
  const { sealerWithRandom } = await import("../core/payment-card-js");
  const { randomBytes } = await import("node:crypto");
  const { guestKey, privateKey } = await guest();
  const request = base({ guestKey });
  const sealed = await sealCardEntry(request, { number: "5555555555554444", expiry: "12/28", cvc: "", name: "Max Muster" }, today, sealerWithRandom((n) => new Uint8Array(randomBytes(n))));
  assert.ok(sealed.ok);
  const opened = await openCardEnvelope(sealed.body.envelope, privateKey, "card-entry:crq_aaaaaaaaaaaaaaaa") as Record<string, unknown>;
  assert.equal(opened.number, "5555555555554444");
  await assert.rejects(openCardEnvelope(sealed.body.envelope, privateKey, "card-entry:crq_bbbbbbbbbbbbbbbb"));
});

test("only a host that passes a cards port gets the card surface; policy never lists the card routes", async () => {
  const { readFileSync } = await import("node:fs");
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.ok(surface.includes("host.cards && token && activeConversationSessionId"));
  assert.ok(surface.includes("host.cards && snapshot"));
  const policy = readFileSync(new URL("../policy.ts", import.meta.url), "utf8");
  assert.ok(!policy.includes("/cards"), "HODL and LiveQuote keep no card routes");
});
