/**
 * HPD-1722. Payment cards the customer hands to Hermes so it can pay for them.
 *
 * Where the card lives: encrypted on the customer's own guest, never in the
 * control-plane database. The control plane holds only the brand, the last four
 * digits, the expiry and an opaque id, and it relays an end-to-end encrypted
 * envelope that it cannot open. The form encrypts in the user's browser to the
 * guest's public key (ECDH P-256 + HKDF-SHA256 + AES-256-GCM); only the guest
 * holds the private key.
 *
 * Nothing in this file touches the network or storage. It is used by the web
 * form (seal), the guest (open) and the control plane (shape checks only).
 */
import { sha256 } from "@noble/hashes/sha256";

export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners"
  | "jcb"
  | "unionpay"
  | "maestro"
  | "unknown";

/** What the control plane and the model may know about a card. No number, no CVC, no name. */
export type PaymentCardMetadata = Readonly<{
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  createdAt: string;
}>;

/**
 * The cleartext of a card. It exists in the form and inside the guest, nowhere
 * else. There is no CVC here on purpose: Justus decided on 2026-10-26 that the
 * CVC is asked at every payment and never stored.
 */
export type PaymentCardSecret = Readonly<{
  number: string;
  expMonth: number;
  expYear: number;
  name: string;
  billingAddress: BillingAddress | null;
}>;

export type BillingAddress = Readonly<{
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  region: string;
  country: string;
}>;

export const cardIdPattern = /^card_[A-Za-z0-9_-]{14,64}$/u;
export const cardRequestIdPattern = /^crq_[A-Za-z0-9_-]{14,64}$/u;
export const cardPaymentIdPattern = /^cpay_[A-Za-z0-9_-]{14,64}$/u;

const brandLabels: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
  maestro: "Maestro",
  unknown: "Card",
};

export function cardBrandLabel(brand: CardBrand): string {
  return brandLabels[brand] ?? brandLabels.unknown;
}

/** "Visa …1234". The only way a card is named in chat. */
export function cardDisplayName(card: Pick<PaymentCardMetadata, "brand" | "last4">): string {
  return `${cardBrandLabel(card.brand)} …${card.last4}`;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D+/gu, "");
}

export function luhnValid(number: string): boolean {
  const digits = digitsOnly(number);
  if (digits.length < 12 || digits.length > 19 || digits !== number.replace(/[\s-]+/gu, "")) return false;
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits.charCodeAt(index) - 48;
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardBrandFor(number: string): CardBrand {
  const digits = digitsOnly(number);
  const prefix = (length: number) => Number(digits.slice(0, length));
  if (/^4/u.test(digits)) return "visa";
  if (/^3[47]/u.test(digits)) return "amex";
  if (/^(5[1-5])/u.test(digits) || (prefix(4) >= 2221 && prefix(4) <= 2720)) return "mastercard";
  if (/^(6011|65|64[4-9])/u.test(digits)) return "discover";
  if (/^(30[0-5]|36|38|39)/u.test(digits)) return "diners";
  if (prefix(4) >= 3528 && prefix(4) <= 3589) return "jcb";
  if (/^62/u.test(digits)) return "unionpay";
  if (/^(50|5[6-9]|6)/u.test(digits)) return "maestro";
  return "unknown";
}

/** Groups of four, American Express as 4-6-5. Display only. */
export function formatCardNumber(value: string): string {
  const digits = digitsOnly(value).slice(0, 19);
  if (cardBrandFor(digits) === "amex") {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(" ");
  }
  return digits.replace(/(.{4})/gu, "$1 ").trim();
}

/** "1234" becomes "12/34" while typing; a leading 2-9 becomes "0N/". */
export function formatExpiryInput(value: string): string {
  let digits = digitsOnly(value).slice(0, 4);
  if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`;
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function parseExpiry(value: string, today = new Date(), window: "future" | "any" = "future"): { month: number; year: number } | null {
  const match = /^\s*(\d{1,2})\s*\/\s*(\d{2}|\d{4})\s*$/u.exec(value);
  if (!match) return null;
  const yearText = match[2] ?? "";
  const month = Number(match[1]);
  const year = yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);
  if (month < 1 || month > 12) return null;
  const currentYear = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth() + 1;
  if (window === "future" && (year < currentYear || (year === currentYear && month < currentMonth) || year > currentYear + 25)) return null;
  return { month, year };
}

export function cvcLength(brand: CardBrand): number {
  return brand === "amex" ? 4 : 3;
}

export type CardFormInput = Readonly<{
  number: string;
  expiry: string;
  /** Checked for shape if typed, then dropped. It is never sealed, sent or stored. */
  cvc: string;
  name: string;
  billingAddress?: Partial<BillingAddress> | null;
}>;

export type CardFormErrors = Partial<Record<"number" | "expiry" | "cvc" | "name", true>>;

/** One validation, used by the form while typing and by the guest before it stores anything. */
export function validateCardForm(
  input: CardFormInput,
  options: { today?: Date; expiry?: "future" | "any" } = {},
): { ok: true; card: PaymentCardSecret } | { ok: false; errors: CardFormErrors } {
  const errors: CardFormErrors = {};
  const number = input.number.replace(/[\s-]+/gu, "");
  if (!luhnValid(number)) errors.number = true;
  const brand = cardBrandFor(number);
  const expiry = parseExpiry(input.expiry, options.today, options.expiry);
  if (!expiry) errors.expiry = true;
  const cvc = input.cvc.trim();
  if (cvc && (!/^\d+$/u.test(cvc) || cvc.length !== cvcLength(brand))) errors.cvc = true;
  const name = input.name.trim().replace(/\s+/gu, " ");
  if (!name || name.length > 80 || /[\u0000-\u001f\u007f]/u.test(name)) errors.name = true;
  if (Object.keys(errors).length || !expiry) return { ok: false, errors };
  return {
    ok: true,
    card: {
      number,
      expMonth: expiry.month,
      expYear: expiry.year,
      name,
      billingAddress: billingAddressFrom(input.billingAddress),
    },
  };
}

const addressFields = ["line1", "line2", "postalCode", "city", "region", "country"] as const;

export function billingAddressFrom(value: Partial<BillingAddress> | null | undefined): BillingAddress | null {
  if (!value) return null;
  const clean = (text: unknown) =>
    typeof text === "string" ? text.trim().replace(/[\u0000-\u001f\u007f]/gu, "").slice(0, 120) : "";
  const address = Object.fromEntries(addressFields.map((field) => [field, clean(value[field])])) as BillingAddress;
  return addressFields.some((field) => address[field]) ? address : null;
}

// ---------------------------------------------------------------------------
// The sealed envelope.

export type CardEnvelope = Readonly<{
  v: 1;
  /** The sender's ephemeral public key (JWK, P-256). */
  epk: { kty: "EC"; crv: "P-256"; x: string; y: string };
  iv: string;
  ct: string;
}>;

export type GuestCardPublicKey = Readonly<{ kty: "EC"; crv: "P-256"; x: string; y: string }>;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const padded = text.replace(/-/gu, "+").replace(/_/gu, "/") + "=".repeat((4 - (text.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function webCrypto(): Crypto {
  const instance = (globalThis as { crypto?: Crypto }).crypto;
  if (!instance?.subtle) throw new Error("Secure encryption is unavailable on this device.");
  return instance;
}

function publicJwkFrom(value: unknown): GuestCardPublicKey {
  const key = value as Record<string, unknown> | null;
  if (
    !key || typeof key !== "object" || key.kty !== "EC" || key.crv !== "P-256" ||
    typeof key.x !== "string" || typeof key.y !== "string" || key.x.length > 64 || key.y.length > 64
  ) {
    throw new Error("The guest key is invalid.");
  }
  return { kty: "EC", crv: "P-256", x: key.x, y: key.y };
}

export function guestCardPublicKeyFrom(value: unknown): GuestCardPublicKey {
  return publicJwkFrom(value);
}

/**
 * The fingerprint of a guest key: SHA-256 over its fixed JWK form, the first
 * ten bytes as five groups of four hex characters. Settings > Cards shows it,
 * and the card form refuses a key that differs from the one stored at the first
 * entry, so a control plane cannot swap in its own key. Pure JS (@noble) so it
 * also runs in React Native, which has no WebCrypto; the web client computes the
 * same value with WebCrypto (fixed vector in both test suites).
 */
export function guestCardKeyFingerprint(key: GuestCardPublicKey): string {
  const checked = publicJwkFrom(key);
  const canonical = JSON.stringify({ crv: checked.crv, kty: checked.kty, x: checked.x, y: checked.y });
  const hex = Array.from(sha256(encoder.encode(canonical)).slice(0, 10), (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  return hex.match(/.{4}/gu)!.join(" ");
}

async function deriveAesKey(privateKey: CryptoKey, peerPublic: CryptoKey, context: string, usage: "encrypt" | "decrypt") {
  const crypto = webCrypto();
  const shared = await crypto.subtle.deriveBits({ name: "ECDH", public: peerPublic }, privateKey, 256);
  const hkdfKey = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: encoder.encode(`hey-hermes-card-v1|${context}`) },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    [usage],
  );
}

/**
 * Encrypt `payload` so that only the holder of the guest private key can read
 * it. `context` binds the envelope to one request (for example
 * "card-entry:crq_...") so an envelope cannot be replayed as another request.
 */
export async function sealCardEnvelope(
  payload: unknown,
  guestPublicKey: GuestCardPublicKey,
  context: string,
): Promise<CardEnvelope> {
  const crypto = webCrypto();
  const guestKey = await crypto.subtle.importKey(
    "jwk",
    { ...publicJwkFrom(guestPublicKey), ext: true },
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const ephemeral = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const aes = await deriveAesKey(ephemeral.privateKey, guestKey, context, "encrypt");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: encoder.encode(context) },
      aes,
      encoder.encode(JSON.stringify(payload)),
    ),
  );
  const epk = publicJwkFrom(await crypto.subtle.exportKey("jwk", ephemeral.publicKey));
  return { v: 1, epk, iv: toBase64Url(iv), ct: toBase64Url(ciphertext) };
}

export function cardEnvelopeFrom(value: unknown): CardEnvelope {
  const source = value as Record<string, unknown> | null;
  if (
    !source || typeof source !== "object" || Array.isArray(source) || source.v !== 1 ||
    typeof source.iv !== "string" || typeof source.ct !== "string" ||
    source.iv.length !== 16 || source.ct.length < 16 || source.ct.length > 8192 ||
    !/^[A-Za-z0-9_-]+$/u.test(source.iv) || !/^[A-Za-z0-9_-]+$/u.test(source.ct)
  ) {
    throw new Error("The card envelope is invalid.");
  }
  return { v: 1, epk: publicJwkFrom(source.epk), iv: source.iv, ct: source.ct };
}

/** Guest side: open an envelope with the guest private key (JWK). Throws on any mismatch. */
export async function openCardEnvelope(
  envelope: CardEnvelope,
  guestPrivateKey: JsonWebKey,
  context: string,
): Promise<unknown> {
  const crypto = webCrypto();
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    guestPrivateKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"],
  );
  const peer = await crypto.subtle.importKey(
    "jwk",
    { ...publicJwkFrom(envelope.epk), ext: true },
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const aes = await deriveAesKey(privateKey, peer, context, "decrypt");
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(envelope.iv), additionalData: encoder.encode(context) },
    aes,
    fromBase64Url(envelope.ct),
  );
  return JSON.parse(decoder.decode(plaintext));
}

/** The shape that travels inside an entry envelope. */
export function cardSecretFromPayload(value: unknown, today = new Date(), expiry: "future" | "any" = "future"): PaymentCardSecret {
  const source = value as Record<string, unknown> | null;
  if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("The card is invalid.");
  const result = validateCardForm(
    {
      number: String(source.number ?? ""),
      expiry: `${String(source.expMonth ?? "").padStart(2, "0")}/${String(source.expYear ?? "")}`,
      // A CVC inside an envelope is refused: it must never travel with the card.
      cvc: source.cvc === undefined || source.cvc === null ? "" : "refused",
      name: String(source.name ?? ""),
      billingAddress: (source.billingAddress as Partial<BillingAddress> | null | undefined) ?? null,
    },
    { today, expiry },
  );
  if (!result.ok) throw new Error("The card is invalid.");
  return result.card;
}

// ---------------------------------------------------------------------------
// Requests and approvals as the control plane exposes them.

export type CardRequestKind = "entry" | "payment" | "manage";
export type CardRequestStatus = "pending" | "approved" | "completed" | "cancelled" | "expired";

/** What the user is asked to approve. Merchant and amount are shown, never hidden. */
export type CardPaymentDetail = Readonly<{
  cardId: string;
  merchant: string;
  /** Lower-case host the fill is bound to, for example "shop.example.ch". */
  merchantHost: string;
  /** Minor units (cents). */
  amountMinor: number;
  currency: string;
}>;

export type CardRequest = Readonly<{
  id: string;
  kind: CardRequestKind;
  runId: string;
  status: CardRequestStatus;
  expiresAt: string;
  createdAt: string;
  payment: CardPaymentDetail | null;
  /** Prefill for the name field, from the account. Entry requests only. */
  suggestedName: string | null;
  /** The guest public key to seal to. Present only while pending. */
  guestKey: GuestCardPublicKey | null;
  /** For a payment request: the card the user is paying with. */
  card: PaymentCardMetadata | null;
}>;

/**
 * Hosts that anyone can register a page under. A card approved for one of these
 * would reach any tenant, so they are never a merchant host. Not the full
 * public-suffix list: the common shared-hosting and second-level suffixes, kept
 * short on purpose; a merchant on one of these approves its own host name.
 */
const sharedSuffixes = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "net.au", "org.au", "co.nz", "co.za", "co.jp", "co.in", "co.kr", "com.br", "com.mx",
  "com.ar", "com.tr", "com.cn", "com.hk", "com.sg", "com.tw", "com.pl", "com.ua", "com.es", "com.pt",
  "github.io", "gitlab.io", "vercel.app", "netlify.app", "pages.dev", "workers.dev", "web.app", "firebaseapp.com", "herokuapp.com",
  "azurewebsites.net", "cloudfront.net", "appspot.com", "blogspot.com", "myshopify.com", "wixsite.com", "weebly.com",
  "wordpress.com", "squarespace.com", "onrender.com", "fly.dev", "railway.app", "repl.co", "glitch.me", "ngrok.io", "ngrok-free.app",
  "s3.amazonaws.com", "amazonaws.com", "cloudflare.net", "trycloudflare.com", "framer.app", "bubbleapps.io", "webflow.io",
  "netlify.com", "gitbook.io", "notion.site", "carrd.co", "000webhostapp.com", "surge.sh", "now.sh", "deno.dev", "pythonanywhere.com",
  "ondigitalocean.app", "run.app", "cloudapp.net", "azurestaticapps.net", "elasticbeanstalk.com", "blob.core.windows.net", "r2.dev",
  "supabase.co", "godaddysites.com", "mystrikingly.com", "square.site", "wixstudio.io", "tumblr.com", "myftp.org", "duckdns.org",
  "no-ip.org", "dyndns.org",
]);
const secondLevelLabels = new Set(["co", "com", "org", "net", "gov", "edu", "ac", "or", "ne", "go"]);

/** Mirrors CARD_SHARED_SUFFIXES in the browser broker (ohlhaver/hermes-agent tools/isolated_browser_service.py). */
export function isSharedHostingSuffix(host: string): boolean {
  const name = host.toLowerCase();
  const labels = name.split(".");
  return sharedSuffixes.has(name) || (labels.length === 2 && secondLevelLabels.has(labels[0]!) && labels[1]!.length === 2);
}

export function merchantHostFrom(value: unknown): string {
  if (typeof value !== "string") throw new Error("The merchant host is invalid.");
  const text = value.trim().toLowerCase();
  const host = /^[a-z]+:\/\//u.test(text) ? new URL(text).hostname : text;
  if (!/^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,24}$/u.test(host) || isSharedHostingSuffix(host)) throw new Error("The merchant host is invalid.");
  return host;
}

/** True when `pageHost` is the approved host or one of its subdomains. Nothing else may receive the card. */
export function hostMayReceiveCard(pageHost: string, approvedHost: string): boolean {
  const page = pageHost.toLowerCase();
  const approved = approvedHost.toLowerCase();
  if (isSharedHostingSuffix(approved)) return false;
  return page === approved || page.endsWith(`.${approved}`);
}

/** The number of minor-unit digits of a currency (2 for CHF, 0 for JPY, 3 for KWD). */
export function currencyFractionDigits(currency: string, locale = "en"): number {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export function formatAmount(amountMinor: number, currency: string, locale = "en"): string {
  const digits = currencyFractionDigits(currency, locale);
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amountMinor / 10 ** digits);
  } catch {
    return `${(amountMinor / 10 ** digits).toFixed(digits)} ${currency}`;
  }
}
