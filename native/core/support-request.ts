export { supportAccessCopy, supportAccessOpenCount } from "./support-access-copy";
import { supportRequestCopy } from "./support-request-copy";
import type { AppLocale } from "./types";
export { supportRequestCopy } from "./support-request-copy";
import { HEY_SUPPORT_EMAIL, HEY_SUPPORT_MAILTO } from "./legal";

export const HEY_SUPPORT_FALLBACK_EMAIL = HEY_SUPPORT_EMAIL;
export const HEY_SUPPORT_FALLBACK_MAILTO = HEY_SUPPORT_MAILTO;
export const HEY_SUPPORT_PRODUCT_REALM = "heyhermes.v1" as const;
export const HEY_SUPPORT_CONTEXT_SCHEMA_VERSION = "heyhermes.support-context/v1" as const;
export const HEY_SUPPORT_REQUEST_SCHEMA_VERSION = "heyhermes.support-request/v1" as const;
export const HEY_SUPPORT_CASE_RECEIPT_SCHEMA_VERSION = "heyhermes.support-case-receipt/v1" as const;
export const HEY_SUPPORT_PROBLEM_MAX_LENGTH = 4_000;

export type SupportRequestFailureReason =
  | "offline"
  | "unavailable"
  | "rate_limited"
  | "session_expired"
  | "delivery_failed"
  | "delivery_pending"
  | "invalid_input"
  | "invalid_response";

export type SupportContextFailureReason = Exclude<
  SupportRequestFailureReason,
  "delivery_failed" | "delivery_pending" | "invalid_input"
>;

export type SupportReplyChannel =
  | Readonly<{ kind: "verified_product_email"; display: string }>
  | Readonly<{ kind: "reply_email_required" }>;

/** A consumer-safe projection. Raw account and workspace IDs never reach the form. */
export type SupportSignedInProjection = Readonly<{
  accountDisplay: string;
  replyChannel: SupportReplyChannel;
}>;

export type HeySupportContextResponse = Readonly<{
  schemaVersion: typeof HEY_SUPPORT_CONTEXT_SCHEMA_VERSION;
  productRealm: typeof HEY_SUPPORT_PRODUCT_REALM;
  status: "ready";
  projection: SupportSignedInProjection;
}>;

export type SupportContextResult =
  | Readonly<{ status: "ready"; projection: SupportSignedInProjection }>
  | Readonly<{ status: "failure"; reason: SupportContextFailureReason }>;

/** The only customer-authored values accepted by the first-party form. */
export type SupportRequestUserInput = Readonly<{
  problem: string;
  replyEmail?: string;
}>;

export type SupportRequestPlatform = "web" | "ios" | "android";

export type HeySupportRequestPayload = Readonly<{
  schemaVersion: typeof HEY_SUPPORT_REQUEST_SCHEMA_VERSION;
  problem: string;
  replyEmail?: string;
  client: Readonly<{
    appVersion: string;
    locale: string;
    platform: SupportRequestPlatform;
    timestamp: string;
  }>;
}>;

export type HeySupportCaseReceipt = Readonly<{
  schemaVersion: typeof HEY_SUPPORT_CASE_RECEIPT_SCHEMA_VERSION;
  productRealm: typeof HEY_SUPPORT_PRODUCT_REALM;
  status: "accepted" | "delivery_failed" | "delivery_pending";
  reference: string;
  receivedAt: string;
}>;

export type SupportSubmissionResult =
  | Readonly<{ status: "success"; reference: string }>
  | Readonly<{
      status: "failure";
      reason: SupportRequestFailureReason;
      reference: string | null;
    }>;

export type SupportRequestClient = Readonly<{
  loadSignedInProjection(): Promise<SupportContextResult>;
  submit(input: SupportRequestUserInput): Promise<SupportSubmissionResult>;
}>;

export type SupportRequestClientOptions = Readonly<{
  appVersion: string;
  baseUrl: string;
  createIdempotencyKey?: () => string;
  fetchImpl?: typeof fetch;
  locale: string;
  now?: () => Date;
  platform: SupportRequestPlatform;
  token: string;
}>;

export type AnonymousSupportRequestClientOptions = Omit<SupportRequestClientOptions, "token">;

export type SupportRequestInputError = Readonly<{
  field: "problem" | "replyEmail";
  reason:
    | "problem_required"
    | "problem_too_long"
    | "problem_sensitive"
    | "reply_email_required"
    | "reply_email_invalid";
}>;

export type BuildSupportRequestInputResult =
  | Readonly<{ ok: true; value: SupportRequestUserInput }>
  | Readonly<{ ok: false; error: SupportRequestInputError }>;

const supportContextFailureReasons = new Set<SupportContextFailureReason>([
  "offline",
  "unavailable",
  "rate_limited",
  "session_expired",
  "invalid_response",
]);
const supportFailureReasons = new Set<SupportRequestFailureReason>([
  ...supportContextFailureReasons,
  "delivery_failed",
  "delivery_pending",
  "invalid_input",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]) {
  const allowedKeys = new Set(allowed);
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

function normalizedDisplay(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const display = value.trim();
  if (!display || display.length > maxLength || /[\u0000-\u001f\u007f]/u.test(display)) return null;
  return display;
}

function normalizedReference(value: unknown) {
  const reference = normalizedDisplay(value, 64);
  return reference && /^HHS-[0-9]{8}-[A-Z0-9]{10}$/u.test(reference) ? reference : null;
}

function isIsoTimestamp(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
}

function isContextFailureReason(value: unknown): value is SupportContextFailureReason {
  return typeof value === "string" && supportContextFailureReasons.has(value as SupportContextFailureReason);
}

export function normalizeSupportSignedInProjection(value: unknown): SupportSignedInProjection | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["accountDisplay", "replyChannel"])) return null;

  const accountDisplay = normalizedDisplay(value.accountDisplay, 120);
  if (!accountDisplay || !/(?:[•*…]|\.{3}|ending\s+(?:in\s+)?)/iu.test(accountDisplay)) return null;

  const replyChannel = value.replyChannel;
  if (!isRecord(replyChannel) || typeof replyChannel.kind !== "string") return null;
  if (replyChannel.kind === "reply_email_required") {
    return hasOnlyKeys(replyChannel, ["kind"])
      ? { accountDisplay, replyChannel: { kind: "reply_email_required" } }
      : null;
  }
  if (replyChannel.kind === "verified_product_email") {
    if (!hasOnlyKeys(replyChannel, ["kind", "display"])) return null;
    const display = normalizedDisplay(replyChannel.display, 160);
    return display ? { accountDisplay, replyChannel: { kind: "verified_product_email", display } } : null;
  }
  return null;
}

export function normalizeSupportContextResult(value: unknown): SupportContextResult {
  if (!isRecord(value)) return { status: "failure", reason: "invalid_response" };
  if (value.status === "failure") {
    if (hasOnlyKeys(value, ["status", "reason"]) && isContextFailureReason(value.reason)) {
      return { status: "failure", reason: value.reason };
    }
    return { status: "failure", reason: "invalid_response" };
  }
  if (value.status === "ready" && hasOnlyKeys(value, ["status", "projection"])) {
    const projection = normalizeSupportSignedInProjection(value.projection);
    return projection ? { status: "ready", projection } : { status: "failure", reason: "invalid_response" };
  }
  if (
    value.schemaVersion !== HEY_SUPPORT_CONTEXT_SCHEMA_VERSION ||
    value.productRealm !== HEY_SUPPORT_PRODUCT_REALM ||
    value.status !== "ready" ||
    !hasOnlyKeys(value, ["schemaVersion", "productRealm", "status", "projection"])
  ) {
    return { status: "failure", reason: "invalid_response" };
  }
  const projection = normalizeSupportSignedInProjection(value.projection);
  return projection ? { status: "ready", projection } : { status: "failure", reason: "invalid_response" };
}

export function normalizeSupportSubmissionResult(value: unknown): SupportSubmissionResult {
  if (isRecord(value) && value.status === "success" && hasOnlyKeys(value, ["status", "reference"])) {
    const reference = normalizedReference(value.reference);
    return reference ? { status: "success", reference } : { status: "failure", reason: "invalid_response", reference: null };
  }
  if (
    isRecord(value) &&
    value.status === "failure" &&
    hasOnlyKeys(value, ["status", "reason", "reference"]) &&
    typeof value.reason === "string" &&
    supportFailureReasons.has(value.reason as SupportRequestFailureReason)
  ) {
    const reference = value.reference === null ? null : normalizedReference(value.reference);
    if (value.reference !== null && !reference) {
      return { status: "failure", reason: "invalid_response", reference: null };
    }
    if ((value.reason === "delivery_failed" || value.reason === "delivery_pending") && !reference) {
      return { status: "failure", reason: "invalid_response", reference: null };
    }
    return { status: "failure", reason: value.reason as SupportRequestFailureReason, reference };
  }
  if (
    !isRecord(value) ||
    value.schemaVersion !== HEY_SUPPORT_CASE_RECEIPT_SCHEMA_VERSION ||
    value.productRealm !== HEY_SUPPORT_PRODUCT_REALM ||
    !hasOnlyKeys(value, ["schemaVersion", "productRealm", "status", "reference", "receivedAt"])
  ) {
    return { status: "failure", reason: "invalid_response", reference: null };
  }
  const reference = normalizedReference(value.reference);
  if (!reference || !isIsoTimestamp(value.receivedAt)) {
    return { status: "failure", reason: "invalid_response", reference: null };
  }
  if (value.status === "accepted") return { status: "success", reference };
  if (value.status === "delivery_failed") return { status: "failure", reason: "delivery_failed", reference };
  if (value.status === "delivery_pending") return { status: "failure", reason: "delivery_pending", reference };
  return { status: "failure", reason: "invalid_response", reference: null };
}

function looksLikeReplyEmail(value: string) {
  return value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}

/** Blocks common credential shapes before customer text can enter the delivery path. */
export function supportProblemContainsLikelySecret(value: string) {
  return [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/u,
    /\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{16,})\b/u,
    /\b(?:password|passwd|secret|api[_ -]?key|access[_ -]?token|bearer)\s*[:=]\s*\S{4,}/iu,
  ].some((pattern) => pattern.test(value));
}

export function buildSupportRequestUserInput(input: {
  problem: string;
  replyEmail: string;
  projection: SupportSignedInProjection;
  allowAlternateReplyEmail?: boolean;
}): BuildSupportRequestInputResult {
  const problem = input.problem.trim();
  if (!problem) return { ok: false, error: { field: "problem", reason: "problem_required" } };
  if (problem.length > HEY_SUPPORT_PROBLEM_MAX_LENGTH) {
    return { ok: false, error: { field: "problem", reason: "problem_too_long" } };
  }
  if (supportProblemContainsLikelySecret(problem)) {
    return { ok: false, error: { field: "problem", reason: "problem_sensitive" } };
  }

  const replyEmail = input.replyEmail.trim().toLowerCase();
  if (input.projection.replyChannel.kind === "verified_product_email") {
    if (!replyEmail || input.allowAlternateReplyEmail !== true) return { ok: true, value: { problem } };
    if (!looksLikeReplyEmail(replyEmail)) {
      return { ok: false, error: { field: "replyEmail", reason: "reply_email_invalid" } };
    }
    return { ok: true, value: { problem, replyEmail } };
  }

  if (!replyEmail) return { ok: false, error: { field: "replyEmail", reason: "reply_email_required" } };
  if (!looksLikeReplyEmail(replyEmail)) {
    return { ok: false, error: { field: "replyEmail", reason: "reply_email_invalid" } };
  }
  return { ok: true, value: { problem, replyEmail } };
}

/** Signed-out support always needs an explicit, validated reply address. */
export function buildAnonymousSupportRequestUserInput(input: {
  problem: string;
  replyEmail: string;
}): BuildSupportRequestInputResult {
  return buildSupportRequestUserInput({
    problem: input.problem,
    replyEmail: input.replyEmail,
    projection: {
      accountDisplay: "Signed-out support",
      replyChannel: { kind: "reply_email_required" },
    },
  });
}

export function supportRequestFailureMessage(reason: SupportRequestFailureReason, locale: AppLocale = "en") {
  const copy = supportRequestCopy(locale);
  switch (reason) {
    case "offline":
      return copy.offline;
    case "rate_limited":
      return copy.rateLimited;
    case "session_expired":
      return copy.sessionExpired;
    case "delivery_failed":
      return copy.deliveryFailed;
    case "delivery_pending":
      return copy.deliveryPending;
    case "invalid_input":
      return copy.invalidInput;
    case "invalid_response":
      return copy.invalidResponse;
    default:
      return copy.unavailable;
  }
}

function clientAppearsOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

async function responseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function boundedClientValue(value: string, maxLength: number) {
  const normalized = value.trim().replace(/[\u0000-\u001f\u007f]/gu, "");
  return normalized ? normalized.slice(0, maxLength) : "unknown";
}

function defaultIdempotencyKey() {
  const bytes = new Uint8Array(16);
  if (!globalThis.crypto?.getRandomValues) throw new Error("Secure random support idempotency is unavailable.");
  globalThis.crypto.getRandomValues(bytes);
  return `hhsr_${Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * First-party transport. The server derives product/account/workspace from the
 * signed-in Hey session; the caller sends only customer text plus bounded app metadata.
 */
export function createSupportRequestClient(options: SupportRequestClientOptions): SupportRequestClient {
  const root = options.baseUrl.replace(/\/+$/u, "");
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());
  const createIdempotencyKey = options.createIdempotencyKey ?? defaultIdempotencyKey;
  let pendingSubmission: { fingerprint: string; idempotencyKey: string } | null = null;
  const headers = () => ({
    accept: "application/json",
    ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    "content-type": "application/json",
  });
  const credentials = options.token ? "omit" as const : "same-origin" as const;

  return Object.freeze({
    async loadSignedInProjection(): Promise<SupportContextResult> {
      if (clientAppearsOffline()) return { status: "failure", reason: "offline" };
      try {
        const response = await fetchImpl(`${root}/support/request-context`, {
          credentials,
          headers: headers(),
          method: "GET",
        });
        if (response.status === 401) return { status: "failure", reason: "session_expired" };
        if (!response.ok) return { status: "failure", reason: "unavailable" };
        return normalizeSupportContextResult(await responseJson(response));
      } catch {
        return { status: "failure", reason: clientAppearsOffline() ? "offline" : "unavailable" };
      }
    },

    async submit(input: SupportRequestUserInput): Promise<SupportSubmissionResult> {
      if (clientAppearsOffline()) return { status: "failure", reason: "offline", reference: null };
      const fingerprint = JSON.stringify([input.problem, input.replyEmail ?? null]);
      try {
        if (!pendingSubmission || pendingSubmission.fingerprint !== fingerprint) {
          pendingSubmission = { fingerprint, idempotencyKey: createIdempotencyKey() };
        }
      } catch {
        return { status: "failure", reason: "unavailable", reference: null };
      }
      const payload: HeySupportRequestPayload = {
        schemaVersion: HEY_SUPPORT_REQUEST_SCHEMA_VERSION,
        problem: input.problem,
        ...(input.replyEmail ? { replyEmail: input.replyEmail } : {}),
        client: {
          appVersion: boundedClientValue(options.appVersion, 80),
          locale: boundedClientValue(options.locale, 40),
          platform: options.platform,
          timestamp: now().toISOString(),
        },
      };
      try {
        const response = await fetchImpl(`${root}/support/requests`, {
          body: JSON.stringify(payload),
          credentials,
          headers: { ...headers(), "idempotency-key": pendingSubmission.idempotencyKey },
          method: "POST",
        });
        if (response.status === 401) return { status: "failure", reason: "session_expired", reference: null };
        if (response.status === 429) return { status: "failure", reason: "rate_limited", reference: null };
        if (response.status === 400 || response.status === 409) {
          return { status: "failure", reason: "invalid_input", reference: null };
        }
        const normalized = normalizeSupportSubmissionResult(await responseJson(response));
        if (normalized.status === "success") {
          pendingSubmission = null;
          return normalized;
        }
        if (normalized.reason !== "invalid_response") return normalized;
        return response.ok ? normalized : { status: "failure", reason: "unavailable", reference: null };
      } catch {
        return {
          status: "failure",
          reason: clientAppearsOffline() ? "offline" : "unavailable",
          reference: null,
        };
      }
    },
  });
}

/**
 * Public signed-out transport. It deliberately has no token input, sends no
 * cookies or Authorization header, and can only submit customer text to the
 * anonymous support boundary.
 */
export function createAnonymousSupportRequestClient(
  options: AnonymousSupportRequestClientOptions,
): SupportRequestClient {
  const root = options.baseUrl.replace(/\/+$/u, "");
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());
  const createIdempotencyKey = options.createIdempotencyKey ?? defaultIdempotencyKey;
  let pendingSubmission: { fingerprint: string; idempotencyKey: string } | null = null;

  return Object.freeze({
    async loadSignedInProjection(): Promise<SupportContextResult> {
      return { status: "failure", reason: "session_expired" };
    },

    async submit(input: SupportRequestUserInput): Promise<SupportSubmissionResult> {
      if (clientAppearsOffline()) return { status: "failure", reason: "offline", reference: null };
      const fingerprint = JSON.stringify([input.problem, input.replyEmail ?? null]);
      try {
        if (!pendingSubmission || pendingSubmission.fingerprint !== fingerprint) {
          pendingSubmission = { fingerprint, idempotencyKey: createIdempotencyKey() };
        }
      } catch {
        return { status: "failure", reason: "unavailable", reference: null };
      }
      const payload: HeySupportRequestPayload = {
        schemaVersion: HEY_SUPPORT_REQUEST_SCHEMA_VERSION,
        problem: input.problem,
        ...(input.replyEmail ? { replyEmail: input.replyEmail } : {}),
        client: {
          appVersion: boundedClientValue(options.appVersion, 80),
          locale: boundedClientValue(options.locale, 40),
          platform: options.platform,
          timestamp: now().toISOString(),
        },
      };
      try {
        const response = await fetchImpl(`${root}/support/anonymous-requests`, {
          body: JSON.stringify(payload),
          credentials: "omit",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "idempotency-key": pendingSubmission.idempotencyKey,
          },
          method: "POST",
        });
        if (response.status === 429) return { status: "failure", reason: "rate_limited", reference: null };
        if (response.status === 400 || response.status === 409) {
          return { status: "failure", reason: "invalid_input", reference: null };
        }
        const normalized = normalizeSupportSubmissionResult(await responseJson(response));
        if (normalized.status === "success") {
          pendingSubmission = null;
          return normalized;
        }
        if (normalized.reason !== "invalid_response") return normalized;
        return response.ok ? normalized : { status: "failure", reason: "unavailable", reference: null };
      } catch {
        return {
          status: "failure",
          reason: clientAppearsOffline() ? "offline" : "unavailable",
          reference: null,
        };
      }
    },
  });
}

export const UNAVAILABLE_SUPPORT_REQUEST_CLIENT: SupportRequestClient = Object.freeze({
  async loadSignedInProjection() {
    return { status: "failure", reason: "unavailable" };
  },
  async submit() {
    return { status: "failure", reason: "unavailable", reference: null };
  },
});

/**
 * What to tell someone whose problem description was refused. Both clients had
 * this word for word; a wording change that reached only one of them would have
 * been two different products saying two different things about one rule.
 */
export function supportRequestProblemErrorMessage(error: SupportRequestInputError, locale: AppLocale = "en") {
  const copy = supportRequestCopy(locale);
  if (error.reason === "problem_too_long") return copy.problemTooLong;
  if (error.reason === "problem_sensitive") return copy.problemSensitive;
  return copy.problemRequired;
}
