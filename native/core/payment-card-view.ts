/**
 * HPD-1722. What the clients (web, iPhone, Android) share for the card form,
 * the payment approval and the card list: the words (English and German, other
 * locales read the English), the request shapes the control plane answers, the
 * sealing of the card on the user's device, and the reading of a card scan.
 *
 * Nothing here talks to the network. The clients call the control plane and
 * pass the answers through `cardRequestFrom` / `paymentCardFrom`.
 */
import { defaultAppLocale, type AppLocale } from "./types";
import {
  cardBrandFor,
  cardIdPattern,
  cardPaymentIdPattern,
  cardRequestIdPattern,
  formatAmount,
  guestCardKeyFingerprint,
  guestCardPublicKeyFrom,
  cvcLength,
  luhnValid,
  parseExpiry,
  sealCardEnvelope,
  validateCardForm,
  type BillingAddress,
  type CardEnvelope,
  type CardFormErrors,
  type CardFormInput,
  type CardRequest,
  type GuestCardPublicKey,
  type PaymentCardMetadata,
} from "./payment-card";

const en = {
  formTitle: "Add a card",
  formHeading: "Pay with your own card",
  formExplanation: "Encrypted on your own Hey Hermes server, not on ours. Hermes never sees the numbers and always asks you before paying.",
  number: "Card number",
  expiry: "Expiry",
  expiryPlaceholder: "MM/YY",
  cvc: "CVC",
  cvcNote: "Not saved. You enter it again at every payment.",
  name: "Name on card",
  billing: "Billing address (optional)",
  billingLine1: "Street and number",
  billingPostalCode: "Postcode",
  billingCity: "City",
  billingCountry: "Country",
  numberInvalid: "Check the card number.",
  expiryInvalid: "Check the expiry date.",
  cvcInvalid: "Check the CVC.",
  nameInvalid: "Enter the name on the card.",
  save: "Save card",
  saving: "Saving…",
  cancel: "Cancel",
  scan: "Scan card",
  scanNote: "The photo is read on this device and is never sent anywhere. Check the fields before saving.",
  scanFailed: "The card could not be read. Type it in instead.",
  guestMissing: "Your Hey Hermes server cannot keep cards yet. It gets this with its next update.",
  guestKeyChanged: "The key of your Hey Hermes server is not the one your cards were first saved with. Nothing was sent. Do not enter a card; check this in Settings > Cards.",
  keyTitle: "Server key",
  keyNote: "Your cards are encrypted for this key on your own server. It is saved on this device when you first add a card, and the form refuses a different one.",
  keyUnknown: "Not saved on this device yet. It is saved when you add a card.",
  keyChanged: "This key differs from the one saved on this device. Only trust it if you set up a new server yourself.",
  keyTrust: "Trust this key",
  failed: "The card could not be saved. Try again.",
  saved: "Card saved.",
  approveTitle: "Approve payment",
  approveSentence: "Pay {amount} to {merchant} ({host}) with {card}?",
  approveCvc: "CVC of this card",
  approveCvcNote: "Used for this payment only and never saved.",
  approveYes: "Yes, pay",
  approveNo: "No",
  approveFailed: "The approval could not be sent. Try again.",
  approved: "Approved. Hermes is paying now. If your bank asks, confirm it in your bank app.",
  listTitle: "Your cards",
  listEmpty: "No card stored.",
  defaultBadge: "Default",
  makeDefault: "Make default",
  remove: "Remove",
  removing: "Removing…",
  add: "Add a card",
  close: "Close",
  expires: "expires {date}",
};

const de: typeof en = {
  formTitle: "Karte hinzufügen",
  formHeading: "Mit Deiner eigenen Karte bezahlen",
  formExplanation: "Verschlüsselt auf Deinem eigenen Hey-Hermes-Server, nicht auf unserem. Hermes sieht die Nummern nie und fragt Dich vor jeder Zahlung.",
  number: "Kartennummer",
  expiry: "Gültig bis",
  expiryPlaceholder: "MM/JJ",
  cvc: "Prüfziffer (CVC)",
  cvcNote: "Wird nicht gespeichert. Du gibst sie bei jeder Zahlung neu ein.",
  name: "Name auf der Karte",
  billing: "Rechnungsadresse (optional)",
  billingLine1: "Straße und Hausnummer",
  billingPostalCode: "PLZ",
  billingCity: "Ort",
  billingCountry: "Land",
  numberInvalid: "Prüfe die Kartennummer.",
  expiryInvalid: "Prüfe das Ablaufdatum.",
  cvcInvalid: "Prüfe die Prüfziffer.",
  nameInvalid: "Gib den Namen auf der Karte ein.",
  save: "Karte speichern",
  saving: "Wird gespeichert…",
  cancel: "Abbrechen",
  scan: "Karte scannen",
  scanNote: "Das Foto wird auf diesem Gerät gelesen und nirgendwohin gesendet. Prüfe die Felder vor dem Speichern.",
  scanFailed: "Die Karte konnte nicht gelesen werden. Gib sie stattdessen ein.",
  guestMissing: "Dein Hey-Hermes-Server kann noch keine Karten verwahren. Er bekommt das mit seinem nächsten Update.",
  guestKeyChanged: "Der Schlüssel Deines Hey-Hermes-Servers ist nicht der, mit dem Deine Karten zuerst gespeichert wurden. Es wurde nichts gesendet. Gib keine Karte ein; prüfe das unter Einstellungen > Karten.",
  keyTitle: "Server-Schlüssel",
  keyNote: "Deine Karten werden für diesen Schlüssel auf Deinem eigenen Server verschlüsselt. Er wird auf diesem Gerät gespeichert, wenn Du zum ersten Mal eine Karte hinzufügst, und das Formular lehnt einen anderen ab.",
  keyUnknown: "Noch nicht auf diesem Gerät gespeichert. Das passiert beim Hinzufügen einer Karte.",
  keyChanged: "Dieser Schlüssel weicht von dem ab, der auf diesem Gerät gespeichert ist. Vertraue ihm nur, wenn Du selbst einen neuen Server eingerichtet hast.",
  keyTrust: "Diesem Schlüssel vertrauen",
  failed: "Die Karte konnte nicht gespeichert werden. Versuch es noch einmal.",
  saved: "Karte gespeichert.",
  approveTitle: "Zahlung freigeben",
  approveSentence: "{amount} an {merchant} ({host}) mit {card} zahlen?",
  approveCvc: "Prüfziffer dieser Karte",
  approveCvcNote: "Nur für diese Zahlung, wird nie gespeichert.",
  approveYes: "Ja, zahlen",
  approveNo: "Nein",
  approveFailed: "Die Freigabe konnte nicht gesendet werden. Versuch es noch einmal.",
  approved: "Freigegeben. Hermes bezahlt jetzt. Wenn Deine Bank nachfragt, bestätige es in der Bank-App.",
  listTitle: "Deine Karten",
  listEmpty: "Keine Karte gespeichert.",
  defaultBadge: "Standard",
  makeDefault: "Als Standard",
  remove: "Entfernen",
  removing: "Wird entfernt…",
  add: "Karte hinzufügen",
  close: "Schließen",
  expires: "gültig bis {date}",
};

const copy: Partial<Record<AppLocale, typeof en>> = { en, de };

export function paymentCardCopy(locale: AppLocale = defaultAppLocale): typeof en {
  return copy[locale] ?? en;
}

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/gu, (_match, key: string) => values[key] ?? "");
}

export function cardExpiryText(card: Pick<PaymentCardMetadata, "expMonth" | "expYear">): string {
  return `${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`;
}

/** "Visa …1234 · 08/28" */
export function cardNameLine(card: Pick<PaymentCardMetadata, "brand" | "last4" | "expMonth" | "expYear">): string {
  return `${cardDisplay(card)} · ${cardExpiryText(card)}`;
}

function cardDisplay(card: Pick<PaymentCardMetadata, "brand" | "last4">) {
  const labels: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", discover: "Discover", diners: "Diners Club", jcb: "JCB", unionpay: "UnionPay", maestro: "Maestro" };
  return `${labels[card.brand] ?? "Card"} …${card.last4}`;
}

/** "Pay CHF 48.90 to Zurich Test Box (shop.example.ch) with Visa …1234?" The host is shown because the card can only be typed there. */
export function cardApprovalSentence(request: CardRequest, locale: AppLocale = defaultAppLocale): string {
  const text = paymentCardCopy(locale);
  const payment = request.payment;
  if (!payment || !request.card) return "";
  return fill(text.approveSentence, {
    amount: formatAmount(payment.amountMinor, payment.currency, locale),
    merchant: payment.merchant,
    host: payment.merchantHost,
    card: cardDisplay(request.card),
  });
}

// ---------------------------------------------------------------------------
// Answers from the control plane.

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The card answer is invalid.");
  return value as Record<string, unknown>;
}

export function paymentCardFrom(value: unknown): PaymentCardMetadata {
  const source = record(value);
  const last4 = String(source.last4 ?? "");
  if (!cardIdPattern.test(String(source.id ?? "")) || !/^\d{4}$/u.test(last4)) throw new Error("The card answer is invalid.");
  return {
    id: String(source.id),
    brand: String(source.brand ?? "unknown") as PaymentCardMetadata["brand"],
    last4,
    expMonth: Number(source.expMonth),
    expYear: Number(source.expYear),
    isDefault: source.isDefault === true,
    createdAt: String(source.createdAt ?? ""),
  };
}

export function paymentCardListFrom(value: unknown): PaymentCardMetadata[] {
  if (!Array.isArray(value) || value.length > 20) throw new Error("The card list is invalid.");
  return value.map(paymentCardFrom);
}

export function cardRequestFrom(value: unknown): CardRequest {
  const source = record(value);
  const id = String(source.id ?? "");
  const kind = source.kind;
  if (!(cardRequestIdPattern.test(id) || cardPaymentIdPattern.test(id)) || (kind !== "entry" && kind !== "payment" && kind !== "manage")) {
    throw new Error("The card request is invalid.");
  }
  const status = String(source.status ?? "");
  if (!["pending", "approved", "completed", "cancelled", "expired"].includes(status)) throw new Error("The card request is invalid.");
  const payment = source.payment === null || source.payment === undefined ? null : record(source.payment);
  if (kind === "payment") {
    // The consent sentence is built from these: a payment without a sound amount, currency and card is not shown.
    const amount = Number(payment?.amountMinor);
    if (!payment || !Number.isSafeInteger(amount) || amount <= 0 || !/^[A-Z]{3}$/u.test(String(payment.currency ?? "")) || !source.card) {
      throw new Error("The card request is invalid.");
    }
  }
  return {
    id,
    kind,
    runId: String(source.runId ?? ""),
    status: status as CardRequest["status"],
    expiresAt: String(source.expiresAt ?? ""),
    createdAt: String(source.createdAt ?? ""),
    payment: payment
      ? {
        cardId: String(payment.cardId ?? ""),
        merchant: String(payment.merchant ?? "").slice(0, 120),
        merchantHost: String(payment.merchantHost ?? "").slice(0, 253),
        amountMinor: Number(payment.amountMinor),
        currency: String(payment.currency ?? ""),
      }
      : null,
    suggestedName: typeof source.suggestedName === "string" ? source.suggestedName.slice(0, 80) : null,
    guestKey: source.guestKey ? guestCardPublicKeyFrom(source.guestKey) : null,
    card: source.card ? paymentCardFrom(source.card) : null,
  };
}

export function cardRequestListFrom(value: unknown): CardRequest[] {
  if (!Array.isArray(value) || value.length > 16) throw new Error("The card request list is invalid.");
  return value.map(cardRequestFrom);
}

/** True for the run-status events the card flow emits (card.entry.requested, card.payment.requested, ...). */
export function isCardRunEvent(event: unknown): boolean {
  const source = event && typeof event === "object" ? event as Record<string, unknown> : null;
  const payload = source?.payload && typeof source.payload === "object" ? source.payload as Record<string, unknown> : null;
  return (source?.type === "status" || source?.type === "run.status") && payload?.targetType === "payment_card" && typeof payload.action === "string" && payload.action.startsWith("card.");
}

// ---------------------------------------------------------------------------
// Sealing on the device.


/** Where a device keeps the fingerprint of the guest key it first saw. Web: local storage. App: the secure store. */
export type GuestKeyPin = Readonly<{ read: () => string | null | Promise<string | null>; write: (fingerprint: string) => void | Promise<void> }>;

export type GuestKeyCheck =
  | { status: "unpinned"; fingerprint: string }
  | { status: "match"; fingerprint: string }
  | { status: "changed"; fingerprint: string; pinned: string };

/** Compares the key a request carries with the one stored on this device. Stores nothing. */
export async function checkGuestKey(key: GuestCardPublicKey, pin: GuestKeyPin): Promise<GuestKeyCheck> {
  const fingerprint = guestCardKeyFingerprint(key);
  const pinned = await pin.read();
  if (!pinned) return { status: "unpinned", fingerprint };
  return pinned === fingerprint ? { status: "match", fingerprint } : { status: "changed", fingerprint, pinned };
}

/** The pin of this browser: local storage, one value. Storage that throws leaves the key unpinned. */
export function browserGuestKeyPin(storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | undefined = typeof localStorage === "undefined" ? undefined : localStorage): GuestKeyPin & { clear: () => void } {
  const name = "hey-hermes.card-guest-key";
  return {
    read: () => { try { return storage?.getItem(name) ?? null; } catch { return null; } },
    write: (fingerprint) => { try { storage?.setItem(name, fingerprint); } catch { /* Unpinned next time. */ } },
    clear: () => { try { storage?.removeItem(name); } catch { /* Nothing to clear. */ } },
  };
}

export type CardEntrySealResult =
  | { ok: true; body: { envelope: CardEnvelope } }
  | { ok: false; errors: CardFormErrors; reason?: undefined }
  | { ok: false; errors: CardFormErrors; reason: "guest_key_missing" | "guest_key_changed" };

/** Where WebCrypto is missing (React Native), the app passes the pure-JS sealer from payment-card-js.ts. */
export type Sealer = (payload: unknown, guestPublicKey: GuestCardPublicKey, context: string) => Promise<CardEnvelope>;

/**
 * Validates the form and seals the card to the guest key. The result holds no readable card.
 * With a `pin`, a key that differs from the one stored at the first entry is refused before
 * anything is sealed; the first key is stored once the card is sealed.
 */
export async function sealCardEntry(request: CardRequest, input: CardFormInput, today = new Date(), sealer: Sealer = sealCardEnvelope, pin?: GuestKeyPin): Promise<CardEntrySealResult> {
  if (request.kind !== "entry" || !request.guestKey) return { ok: false, errors: {}, reason: "guest_key_missing" };
  const checked = validateCardForm(input, { today });
  if (!checked.ok) return { ok: false, errors: checked.errors };
  const key = pin ? await checkGuestKey(request.guestKey, pin) : null;
  if (key?.status === "changed") return { ok: false, errors: {}, reason: "guest_key_changed" };
  const envelope = await sealer(checked.card, request.guestKey, `card-entry:${request.id}`);
  if (pin && key?.status === "unpinned") await pin.write(key.fingerprint);
  return { ok: true, body: { envelope } };
}

/** Seals this payment's CVC to the guest key. Used for this one approval only. A changed key is refused (`keyChanged`). */
export async function sealPaymentCvc(request: CardRequest, cvc: string, sealer: Sealer = sealCardEnvelope, pin?: GuestKeyPin): Promise<{ ok: true; body: { envelope: CardEnvelope } } | { ok: false; keyChanged?: true }> {
  const brand = request.card?.brand ?? "unknown";
  const text = cvc.trim();
  if (request.kind !== "payment" || !request.guestKey || !/^\d+$/u.test(text) || text.length !== cvcLength(brand)) return { ok: false };
  const key = pin ? await checkGuestKey(request.guestKey, pin) : null;
  if (key?.status === "changed") return { ok: false, keyChanged: true };
  const envelope = await sealer({ cvc: text }, request.guestKey, `card-cvc:${request.id}`);
  if (pin && key?.status === "unpinned") await pin.write(key.fingerprint);
  return { ok: true, body: { envelope } };
}

// ---------------------------------------------------------------------------
// A card scan, read on the device, becomes form fields the user checks.

export type CardScanFields = Readonly<{ number?: string; expiry?: string; name?: string }>;

/**
 * Reads recognised text lines (from the system card scan or on-device text
 * recognition) into form fields. The user always checks the result; a number
 * that fails Luhn is not offered, and a past expiry is not offered.
 */
export function parseCardScanText(lines: readonly string[], today = new Date()): CardScanFields {
  const text = lines.map((line) => line.trim()).filter(Boolean);
  const result: { number?: string; expiry?: string; name?: string } = {};
  for (const line of text) {
    const whole = line.replace(/[\s-]/gu, "");
    // The whole line is the number, or the line holds one grouped number (4-4-4-4 or 4-6-5) among other words.
    const grouped = /\b(\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{1,4}|\d{4}[ -]\d{6}[ -]\d{5})\b/u.exec(line)?.[1]?.replace(/[\s-]/gu, "");
    for (const digits of [whole, grouped ?? ""]) {
      if (!result.number && /^\d{12,19}$/u.test(digits) && luhnValid(digits)) result.number = digits;
    }
  }
  for (const line of text) {
    const match = /\b(0[1-9]|1[0-2])\s*[/\-]\s*(\d{2}|\d{4})\b/u.exec(line);
    if (match && parseExpiry(`${match[1]}/${match[2]}`, today)) { result.expiry = `${match[1]}/${String(match[2]).slice(-2)}`; break; }
  }
  const skip = /\d|valid|thru|until|expir|good|member|since|bank|credit|debit|visa|master|amex|express|platinum|gold|business|classic|world|electron|maestro|card|karte|vorname|sparkasse/iu;
  const candidates = text.filter((line) => /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'.\- ]{4,40}$/u.test(line) && line.split(/\s+/u).length >= 2 && !skip.test(line));
  const upper = candidates.filter((line) => line === line.toUpperCase());
  const name = upper[upper.length - 1] ?? candidates[candidates.length - 1];
  if (name) result.name = name.toLowerCase().replace(/(^|[\s\-'])([a-zà-ÿ])/gu, (_m, space: string, letter: string) => `${space}${letter.toUpperCase()}`);
  return result;
}

export type { BillingAddress };
