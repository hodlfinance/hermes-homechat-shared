export type SecureSecretEntryReference = string;

export type SecureSecretEntryStatus = "active" | "deleted";

export type SecureSecretEntryRequestStatus =
  | "pending"
  | "completed"
  | "cancelled"
  | "expired";

export type SecureSecretEntryMetadata = Readonly<{
  referenceId: SecureSecretEntryReference;
  label: string;
  purpose: string;
  allowedToolIds: string[];
  status: SecureSecretEntryStatus;
  createdAt: string;
  updatedAt: string;
}>;

export type SecureSecretEntryRequest = Readonly<{
  id: string;
  runId: string;
  label: string;
  purpose: string;
  allowedToolIds: string[];
  status: SecureSecretEntryRequestStatus;
  expiresAt: string;
  createdAt: string;
}>;

export type SecureSecretEntryPendingRequest = Readonly<SecureSecretEntryRequest & {
  conversationSessionId: string;
  status: "pending";
}>;

const secretBearingFields = new Set([
  "value",
  "plaintext",
  "ciphertext",
  "iv",
  "authtag",
  "secrethint",
]);

const metadataKeys = new Set([
  "referenceId",
  "label",
  "purpose",
  "allowedToolIds",
  "status",
  "createdAt",
  "updatedAt",
]);

const requestKeys = new Set([
  "id",
  "runId",
  "label",
  "purpose",
  "allowedToolIds",
  "status",
  "expiresAt",
  "createdAt",
]);

const pendingRequestKeys = new Set([...requestKeys, "conversationSessionId"]);

function recordFrom(value: unknown, contract: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${contract} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function rejectSecretBearingFields(value: Record<string, unknown>) {
  for (const key of Object.keys(value)) {
    if (secretBearingFields.has(key.toLowerCase())) {
      throw new Error(`Secure secret contract contains forbidden secret-bearing field: ${key}.`);
    }
  }
}

function requireOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, contract: string) {
  const unknownKey = Object.keys(value).find((key) => !allowed.has(key));
  if (unknownKey) throw new Error(`${contract} contains unknown field: ${unknownKey}.`);
}

function boundedText(value: unknown, field: string, maxLength: number) {
  if (typeof value !== "string") throw new Error(`${field} must be a string.`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength || /[\u0000-\u001f\u007f]/u.test(normalized)) {
    throw new Error(`${field} must be non-empty, bounded text.`);
  }
  return normalized;
}

function exactId(value: unknown, field: string, pattern: RegExp) {
  if (typeof value !== "string" || !pattern.test(value)) throw new Error(`${field} is invalid.`);
  return value;
}

function isoTimestamp(value: unknown, field: string) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${field} must be an ISO timestamp.`);
  }
  return value;
}

function allowedToolIdsFrom(value: unknown) {
  if (!Array.isArray(value) || value.length > 16) {
    throw new Error("allowedToolIds must be a bounded list.");
  }
  const ids = value.map((item) => exactId(
    item,
    "allowedToolIds entry",
    /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u,
  ));
  if (ids.some((id) => id.length > 128)) throw new Error("allowedToolIds entry is too long.");
  if (new Set(ids).size !== ids.length) throw new Error("allowedToolIds must be unique.");
  return ids;
}

export function secureSecretEntryMetadataFrom(value: unknown): SecureSecretEntryMetadata {
  const record = recordFrom(value, "Secure secret metadata");
  rejectSecretBearingFields(record);
  requireOnlyKeys(record, metadataKeys, "Secure secret metadata");

  const status = record.status;
  if (status !== "active" && status !== "deleted") throw new Error("Secure secret metadata status is invalid.");

  const createdAt = isoTimestamp(record.createdAt, "createdAt");
  const updatedAt = isoTimestamp(record.updatedAt, "updatedAt");
  if (Date.parse(updatedAt) < Date.parse(createdAt)) throw new Error("updatedAt must not precede createdAt.");

  return {
    referenceId: exactId(record.referenceId, "referenceId", /^ssref_[A-Za-z0-9_-]{14,96}$/u),
    label: boundedText(record.label, "label", 120),
    purpose: boundedText(record.purpose, "purpose", 500),
    allowedToolIds: allowedToolIdsFrom(record.allowedToolIds),
    status,
    createdAt,
    updatedAt,
  };
}

export function secureSecretEntryRequestFrom(value: unknown): SecureSecretEntryRequest {
  const record = recordFrom(value, "Secure secret entry request");
  rejectSecretBearingFields(record);
  requireOnlyKeys(record, requestKeys, "Secure secret entry request");

  const status = record.status;
  if (status !== "pending" && status !== "completed" && status !== "cancelled" && status !== "expired") {
    throw new Error("Secure secret entry request status is invalid.");
  }

  const createdAt = isoTimestamp(record.createdAt, "createdAt");
  const expiresAt = isoTimestamp(record.expiresAt, "expiresAt");
  if (Date.parse(expiresAt) <= Date.parse(createdAt)) throw new Error("expiresAt must follow createdAt.");

  return {
    id: exactId(record.id, "id", /^ssreq_[A-Za-z0-9_-]{14,96}$/u),
    runId: exactId(record.runId, "runId", /^run_[A-Za-z0-9_-]{10,128}$/u),
    label: boundedText(record.label, "label", 120),
    purpose: boundedText(record.purpose, "purpose", 500),
    allowedToolIds: allowedToolIdsFrom(record.allowedToolIds),
    status,
    expiresAt,
    createdAt,
  };
}

export function secureSecretEntryPendingRequestFrom(value: unknown): SecureSecretEntryPendingRequest {
  const record = recordFrom(value, "Pending secure secret entry request");
  rejectSecretBearingFields(record);
  requireOnlyKeys(record, pendingRequestKeys, "Pending secure secret entry request");
  const request = secureSecretEntryRequestFrom(Object.fromEntries(
    Object.entries(record).filter(([key]) => key !== "conversationSessionId"),
  ));
  if (request.status !== "pending") throw new Error("Pending secure secret entry request must be pending.");
  return {
    ...request,
    conversationSessionId: boundedText(record.conversationSessionId, "conversationSessionId", 256),
    status: "pending",
  };
}
