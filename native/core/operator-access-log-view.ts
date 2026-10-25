import type { AppLocale } from "./types";

/**
 * HPD-1737 PR C: the customer's screen "Access to your server". Shared by the
 * web app and the native surface; the native copy in
 * hermes-homechat-shared/native/core/operator-access-log-view.ts is
 * byte-identical (packages/core/test/operator-access-log-view.test.ts).
 *
 * The device recomputes the hash chain from the answer of
 * GET /workspace/access-log with the same canonical JSON and SHA-256 as
 * apps/api/src/operator-access-log.ts, keeps the last head it saw per
 * workspace, and warns when a later answer does not extend it. "Publicly
 * anchored" is shown only from the anchor fields the server returns, after the
 * Merkle path in them recomputes to their root. Checking the Rekor entry itself
 * is left to verify.mjs. Contract: docs/hpd-1737-operator-access-log.md.
 *
 * Pure code only (no node:crypto, no Web Crypto): it runs the same in a
 * browser, in Hermes on iOS and Android, and in node --test.
 */

export const ACCESS_LOG_SCHEMA = "heyhermes.operator-access-log/v1";
export const ACCESS_LOG_GENESIS_HASH = "0".repeat(64);
export const ACCESS_LOG_VERIFY_URL = "https://heyhermes.app/access-log/verify.mjs";
/** The window the status line speaks about. */
export const ACCESS_LOG_STATUS_DAYS = 30;

export type AccessLogActorKind = "human_operator" | "automated_maintenance" | "support_grant" | "host_session";

export type AccessLogAnchor =
  | "pending"
  | {
      anchorId: string;
      rekorLogIndex: number | null;
      rekorUuid: string | null;
      rekorUrl: string | null;
      integratedTime: number | null;
      merkleRoot: string;
      merklePath: Array<{ side: "left" | "right"; hash: string }>;
      leafIndex: number;
      headSeq: number;
      headHash: string;
      payload: { schemaVersion?: string; merkleRoot?: string; leafCount?: number; anchoredAt?: string } | null;
      publicKeySha256: string | null;
      /** #2181: anchored more than 15 minutes after recordedAt. */
      late?: boolean;
    };

export interface AccessLogEntry {
  workspaceId: string;
  seq: number;
  prevHash: string;
  entryHash: string;
  entryId: string;
  occurredAt: string;
  recordedAt: string;
  actorKind: AccessLogActorKind;
  actor: string;
  action: string;
  reason: string | null;
  nodeId: string;
  guestId: string | null;
  delivered: "live" | "spooled";
  anchor: AccessLogAnchor;
}

export interface AccessLogHostSessionGroup {
  actor: string;
  hour: string;
  count: number;
  firstSeq: number;
  lastSeq: number;
}

export interface AccessLogHead {
  seq: number;
  entryHash: string;
}

export interface AccessLogResponse {
  schemaVersion: string;
  workspaceId: string;
  head: AccessLogHead | null;
  anchoring: "configured" | "pending_no_key";
  publicKeyUrl: string;
  verifyScriptUrl: string;
  nextBefore: number | null;
  entries: AccessLogEntry[];
  hostSessionGroups: AccessLogHostSessionGroup[];
  /** #2181: sha256 hex of the anchor key's DER SPKI; absent on older Planes (then the anchors' publicKeySha256). */
  anchorKeySha256?: string | null;
}

export type AccessLogClient = {
  workspaceAccessLog(query?: { limit?: number; before?: number }): Promise<AccessLogResponse>;
};

/** Where the device keeps the last head it saw (secure storage on the phone, localStorage on the web). */
export type AccessLogHeadStore = {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
};

// ---------------------------------------------------------------------------
// The feature switch. Same idea as the website's heyAccessLogLive(): off until
// the Control Plane serves GET /workspace/access-log. Web reads
// NEXT_PUBLIC_HEY_ACCESS_LOG_LIVE (the website's switch), the apps read
// EXPO_PUBLIC_HEY_ACCESS_LOG_LIVE; "1", "true" or "yes" turn it on, and
// ACCESS_LOG_LIVE_DEFAULT turns it on for every build.

export const ACCESS_LOG_LIVE_DEFAULT = false;

export function accessLogLive(value: string | undefined | null, fallback: boolean = ACCESS_LOG_LIVE_DEFAULT): boolean {
  return fallback || /^(1|true|yes)$/i.test(String(value ?? "").trim());
}

// ---------------------------------------------------------------------------
// Canonical JSON and SHA-256, identical to apps/api/src/operator-access-log.ts.

export function accessLogCanonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => accessLogCanonicalJson(item === undefined ? null : item)).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).filter((key) => record[key] !== undefined).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${keys.map((key) => `${JSON.stringify(key)}:${accessLogCanonicalJson(record[key])}`).join(",")}}`;
  }
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("canonicalJson: non-finite number");
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  throw new Error(`canonicalJson: unsupported value of type ${typeof value}`);
}

function utf8Bytes(text: string): number[] {
  const bytes: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    let code = text.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length) {
      const next = text.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        index += 1;
      }
    }
    if (code >= 0xd800 && code <= 0xdfff) code = 0xfffd; // lone surrogate, as Buffer.from(text, "utf8") does
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
  }
  return bytes;
}

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
  0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
  0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/** SHA-256 of raw bytes, as lowercase hex. */
export function accessLogSha256Bytes(input: readonly number[]): string {
  const bytes = input.slice();
  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const high = Math.floor(bitLength / 0x100000000);
  const low = bitLength >>> 0;
  bytes.push((high >>> 24) & 255, (high >>> 16) & 255, (high >>> 8) & 255, high & 255);
  bytes.push((low >>> 24) & 255, (low >>> 16) & 255, (low >>> 8) & 255, low & 255);
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Array<number>(64);
  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let t = 0; t < 16; t += 1) {
      const i = offset + t * 4;
      w[t] = ((bytes[i]! << 24) | (bytes[i + 1]! << 16) | (bytes[i + 2]! << 8) | bytes[i + 3]!) >>> 0;
    }
    for (let t = 16; t < 64; t += 1) {
      const a = w[t - 15]!;
      const b = w[t - 2]!;
      const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
      const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
      w[t] = (w[t - 16]! + s0 + w[t - 7]! + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h as [number, number, number, number, number, number, number, number];
    for (let t = 0; t < 64; t += 1) {
      const s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + s1 + ch + K[t]! + w[t]!) >>> 0;
      const s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + maj) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0]! + a) >>> 0;
    h[1] = (h[1]! + b) >>> 0;
    h[2] = (h[2]! + c) >>> 0;
    h[3] = (h[3]! + d) >>> 0;
    h[4] = (h[4]! + e) >>> 0;
    h[5] = (h[5]! + f) >>> 0;
    h[6] = (h[6]! + g) >>> 0;
    h[7] = (h[7]! + hh) >>> 0;
  }
  return h.map((word) => word.toString(16).padStart(8, "0")).join("");
}

/** SHA-256 of a string's UTF-8 bytes, as lowercase hex. */
export function accessLogSha256(text: string): string {
  return accessLogSha256Bytes(utf8Bytes(text));
}

function hexBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let index = 0; index < hex.length; index += 2) bytes.push(parseInt(hex.slice(index, index + 2), 16));
  return bytes;
}

export function accessLogEntryHash(entry: Omit<AccessLogEntry, "entryHash" | "anchor">): string {
  return accessLogSha256(
    accessLogCanonicalJson({
      workspaceId: entry.workspaceId,
      seq: entry.seq,
      prevHash: entry.prevHash,
      entryId: entry.entryId,
      occurredAt: entry.occurredAt,
      recordedAt: entry.recordedAt,
      actorKind: entry.actorKind,
      actor: entry.actor,
      action: entry.action,
      reason: entry.reason,
      nodeId: entry.nodeId,
      guestId: entry.guestId,
      delivered: entry.delivered,
    }),
  );
}

/** RFC 6962 style: leaf sha256(0x00 || canonicalJson(head)), node sha256(0x01 || left || right). */
export function accessLogMerkleRootFromPath(
  head: { workspaceId: string; seq: number; entryHash: string },
  path: ReadonlyArray<{ side: "left" | "right"; hash: string }>,
): string {
  let hash = accessLogSha256Bytes([0, ...utf8Bytes(accessLogCanonicalJson({ workspaceId: head.workspaceId, seq: head.seq, entryHash: head.entryHash }))]);
  for (const step of path) {
    hash = step.side === "left"
      ? accessLogSha256Bytes([1, ...hexBytes(step.hash), ...hexBytes(hash)])
      : accessLogSha256Bytes([1, ...hexBytes(hash), ...hexBytes(step.hash)]);
  }
  return hash;
}

// ---------------------------------------------------------------------------
// The check on the device.

export type AccessLogFailure =
  | "wrong_workspace"
  | "entry_hash"
  | "chain_link"
  | "gap"
  | "genesis"
  | "head_mismatch"
  | "anchor_mismatch"
  | "rolled_back"
  | "rewritten"
  | "key_changed";

export type AccessLogCheck =
  | { state: "verified"; anchored: boolean; head: AccessLogHead | null; reachedKnownHead: boolean; keySha256: string | null }
  | { state: "failed"; reason: AccessLogFailure; seq: number | null };

const HEX64 = /^[0-9a-f]{64}$/;

export function accessLogHeadStorageKey(workspaceId: string): string {
  return `heyhermes.access-log.head.v1.${workspaceId.replace(/[^A-Za-z0-9._-]/g, "_")}`;
}

/** What the device keeps per workspace: the last chain head and the anchor key fingerprint first seen. */
export interface AccessLogDeviceRecord {
  head: AccessLogHead | null;
  keySha256: string | null;
}

export function parseAccessLogRecord(stored: string | null | undefined): AccessLogDeviceRecord {
  const none = { head: null, keySha256: null };
  if (!stored) return none;
  try {
    const value = JSON.parse(stored) as { seq?: unknown; entryHash?: unknown; keySha256?: unknown };
    const head = Number.isInteger(value.seq) && (value.seq as number) > 0 && typeof value.entryHash === "string" && HEX64.test(value.entryHash)
      ? { seq: value.seq as number, entryHash: value.entryHash }
      : null;
    const keySha256 = typeof value.keySha256 === "string" && HEX64.test(value.keySha256) ? value.keySha256 : null;
    return { head, keySha256 };
  } catch {
    // An unreadable record is treated as none; the next good answer replaces it.
    return none;
  }
}

export function serializeAccessLogRecord(record: AccessLogDeviceRecord): string {
  return JSON.stringify({ ...(record.head ?? {}), ...(record.keySha256 ? { keySha256: record.keySha256 } : {}) });
}

/** The anchor key fingerprint of an answer: the Plane's field, else the newest anchor's own. */
export function accessLogKeySha256(log: { anchorKeySha256?: string | null; entries: readonly AccessLogEntry[] }): string | null {
  const direct = typeof log.anchorKeySha256 === "string" ? log.anchorKeySha256.toLowerCase() : null;
  if (direct && HEX64.test(direct)) return direct;
  for (const entry of [...log.entries].sort((a, b) => b.seq - a.seq)) {
    if (entry.anchor !== "pending" && typeof entry.anchor.publicKeySha256 === "string" && HEX64.test(entry.anchor.publicKeySha256.toLowerCase())) {
      return entry.anchor.publicKeySha256.toLowerCase();
    }
  }
  return null;
}

export function accessLogEntryLate(entry: AccessLogEntry): boolean {
  return entry.anchor !== "pending" && entry.anchor.late === true;
}

/**
 * `entries` is the newest-first run of one workspace as loaded (the first page
 * and any further pages); `knownHead` is what this device saw before.
 */
export function verifyAccessLog(input: {
  workspaceId: string;
  head: AccessLogHead | null;
  entries: readonly AccessLogEntry[];
  knownHead: AccessLogHead | null;
  /** The anchor key fingerprint this device stored on first use, and the one in this answer. */
  knownKeySha256?: string | null;
  keySha256?: string | null;
}): AccessLogCheck {
  const { workspaceId, head, knownHead } = input;
  const keySha256 = input.keySha256 ?? null;
  if (input.knownKeySha256 && keySha256 && input.knownKeySha256 !== keySha256) return { state: "failed", reason: "key_changed", seq: null };
  const ascending = [...input.entries].sort((a, b) => a.seq - b.seq);
  if (!head) {
    if (ascending.length) return { state: "failed", reason: "head_mismatch", seq: ascending[ascending.length - 1]!.seq };
    if (knownHead) return { state: "failed", reason: "rolled_back", seq: knownHead.seq };
    return { state: "verified", anchored: false, head: null, reachedKnownHead: true, keySha256 };
  }
  const newest = ascending[ascending.length - 1];
  if (!newest || newest.seq !== head.seq || newest.entryHash !== head.entryHash) return { state: "failed", reason: "head_mismatch", seq: head.seq };
  const bySeq = new Map<number, string>();
  let previous: AccessLogEntry | null = null;
  for (const entry of ascending) {
    if (entry.workspaceId !== workspaceId) return { state: "failed", reason: "wrong_workspace", seq: entry.seq };
    if (accessLogEntryHash(entry) !== entry.entryHash) return { state: "failed", reason: "entry_hash", seq: entry.seq };
    if (previous) {
      if (entry.seq !== previous.seq + 1) return { state: "failed", reason: "gap", seq: entry.seq };
      if (entry.prevHash !== previous.entryHash) return { state: "failed", reason: "chain_link", seq: entry.seq };
    } else if (entry.seq === 1 && entry.prevHash !== ACCESS_LOG_GENESIS_HASH) {
      return { state: "failed", reason: "genesis", seq: 1 };
    }
    bySeq.set(entry.seq, entry.entryHash);
    previous = entry;
  }
  const oldest = ascending[0]!;
  let reachedKnownHead = true;
  if (knownHead) {
    if (knownHead.seq > head.seq) return { state: "failed", reason: "rolled_back", seq: knownHead.seq };
    const seen = bySeq.get(knownHead.seq);
    if (seen !== undefined) {
      if (seen !== knownHead.entryHash) return { state: "failed", reason: "rewritten", seq: knownHead.seq };
    } else if (knownHead.seq === oldest.seq - 1) {
      if (oldest.prevHash !== knownHead.entryHash) return { state: "failed", reason: "rewritten", seq: knownHead.seq };
    } else {
      reachedKnownHead = false;
    }
  }
  for (const entry of ascending) {
    const anchor = entry.anchor;
    if (anchor === "pending") continue;
    const anchoredHash = bySeq.get(anchor.headSeq);
    if (anchor.headSeq < entry.seq || (anchoredHash !== undefined && anchoredHash !== anchor.headHash)) {
      return { state: "failed", reason: "anchor_mismatch", seq: entry.seq };
    }
    const root = accessLogMerkleRootFromPath({ workspaceId, seq: anchor.headSeq, entryHash: anchor.headHash }, anchor.merklePath ?? []);
    if (root !== anchor.merkleRoot || (anchor.payload?.merkleRoot !== undefined && anchor.payload.merkleRoot !== anchor.merkleRoot)) {
      return { state: "failed", reason: "anchor_mismatch", seq: entry.seq };
    }
  }
  return { state: "verified", anchored: newest.anchor !== "pending", head, reachedKnownHead, keySha256 };
}

// ---------------------------------------------------------------------------
// Loading: the first page, then older pages until the status window and the
// known head are covered (bounded), merged newest first.

export interface LoadedAccessLog {
  workspaceId: string;
  head: AccessLogHead | null;
  anchoring: AccessLogResponse["anchoring"];
  verifyScriptUrl: string;
  anchorKeySha256: string | null;
  entries: AccessLogEntry[];
  hostSessionGroups: AccessLogHostSessionGroup[];
}

export async function loadAccessLog(
  client: AccessLogClient,
  input: { knownHead: AccessLogHead | null; now: number; maxPages?: number },
): Promise<LoadedAccessLog> {
  const first = await client.workspaceAccessLog({ limit: 200 });
  const entries = [...first.entries];
  const groups = [...(first.hostSessionGroups ?? [])];
  const windowStart = input.now - ACCESS_LOG_STATUS_DAYS * 86_400_000;
  let before = first.nextBefore;
  for (let page = 1; before && page < (input.maxPages ?? 20); page += 1) {
    const oldest = entries[entries.length - 1];
    const coversWindow = !oldest || Date.parse(oldest.occurredAt) < windowStart;
    const coversKnownHead = !input.knownHead || (oldest !== undefined && oldest.seq <= input.knownHead.seq + 1);
    if (coversWindow && coversKnownHead) break;
    const next = await client.workspaceAccessLog({ limit: 500, before });
    if (next.workspaceId !== first.workspaceId) break;
    entries.push(...next.entries.filter((entry) => entry.seq < before!));
    groups.push(...(next.hostSessionGroups ?? []));
    before = next.nextBefore;
  }
  return {
    workspaceId: first.workspaceId,
    head: first.head,
    anchoring: first.anchoring,
    verifyScriptUrl: first.verifyScriptUrl || ACCESS_LOG_VERIFY_URL,
    anchorKeySha256: first.anchorKeySha256 ?? null,
    entries: entries.sort((a, b) => b.seq - a.seq),
    hostSessionGroups: mergeHostSessionGroups(groups),
  };
}

function mergeHostSessionGroups(groups: readonly AccessLogHostSessionGroup[]): AccessLogHostSessionGroup[] {
  const merged = new Map<string, AccessLogHostSessionGroup>();
  for (const group of groups) {
    const key = `${group.actor}\u0000${group.hour}`;
    const known = merged.get(key);
    if (known) merged.set(key, { ...known, count: known.count + group.count, firstSeq: Math.min(known.firstSeq, group.firstSeq), lastSeq: Math.max(known.lastSeq, group.lastSeq) });
    else merged.set(key, { ...group });
  }
  return [...merged.values()].sort((a, b) => b.lastSeq - a.lastSeq);
}

/**
 * Loads, checks, and keeps the new head only when the check passed. A failed
 * check never overwrites the head the device saw before.
 */
export async function loadAndCheckAccessLog(
  client: AccessLogClient,
  store: AccessLogHeadStore | null,
  workspaceId: string,
  now: number,
): Promise<{ log: LoadedAccessLog; check: AccessLogCheck }> {
  const key = accessLogHeadStorageKey(workspaceId);
  let known: AccessLogDeviceRecord = { head: null, keySha256: null };
  try {
    known = parseAccessLogRecord(store ? await store.read(key) : null);
  } catch {
    known = { head: null, keySha256: null };
  }
  const log = await loadAccessLog(client, { knownHead: known.head, now });
  const check: AccessLogCheck = log.workspaceId === workspaceId
    ? verifyAccessLog({ workspaceId, head: log.head, entries: log.entries, knownHead: known.head, knownKeySha256: known.keySha256, keySha256: accessLogKeySha256(log) })
    : { state: "failed", reason: "wrong_workspace", seq: null };
  // The key fingerprint is kept from its first use; a changed key is a failed check and is never stored.
  if (check.state === "verified" && (check.head || check.keySha256) && store) {
    try {
      await store.write(key, serializeAccessLogRecord({ head: check.head ?? known.head, keySha256: known.keySha256 ?? check.keySha256 }));
    } catch {
      // Storage unavailable: the check still ran; the next visit compares against nothing.
    }
  }
  return { log, check };
}

// ---------------------------------------------------------------------------
// The screen model.

export type AccessLogCheckLine = { tone: "ok" | "pending" | "warning"; text: string };

export interface AccessLogPersonRow {
  key: string;
  when: string;
  who: string;
  what: string;
  why: string | null;
  seq: number;
  late: boolean;
}

export interface AccessLogHostGroupRow {
  key: string;
  when: string;
  text: string;
  why: string | null;
}

export interface AccessLogMaintenanceRow {
  key: string;
  when: string;
  what: string;
  late: boolean;
}

export interface AccessLogView {
  status: string;
  check: AccessLogCheckLine;
  people: AccessLogPersonRow[];
  hostGroups: AccessLogHostGroupRow[];
  maintenance: { count: number; summary: string; rows: AccessLogMaintenanceRow[] } | null;
}

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

function formatWhen(iso: string, locale: AppLocale): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return iso;
  try {
    return new Date(time).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return new Date(time).toISOString().slice(0, 16).replace("T", " ");
  }
}

export function accessLogActionText(action: string, locale: AppLocale): string {
  const copy = accessLogCopy(locale);
  const base = action.split(":")[0] ?? action;
  return (copy.actions as Record<string, string>)[base] ?? copy.actionOther;
}

export function accessLogView(log: LoadedAccessLog, check: AccessLogCheck, locale: AppLocale, now: number): AccessLogView {
  const copy = accessLogCopy(locale);
  const windowStart = now - ACCESS_LOG_STATUS_DAYS * 86_400_000;
  const accessCount = log.entries.filter((entry) => entry.actorKind !== "automated_maintenance" && Date.parse(entry.occurredAt) >= windowStart).length;
  const status = accessCount === 0 ? copy.statusNone : accessCount === 1 ? copy.statusOne : fill(copy.statusMany, { count: accessCount });
  const checkLine: AccessLogCheckLine = check.state === "failed"
    ? { tone: "warning", text: check.reason === "key_changed" ? copy.checkKeyChanged : copy.checkFailed }
    : !check.reachedKnownHead
      ? { tone: "pending", text: copy.checkPartial }
      : !check.head
        ? { tone: "ok", text: copy.checkEmpty }
        : check.anchored
          ? { tone: "ok", text: copy.checkOk }
          : { tone: "pending", text: copy.checkPending };
  const people = log.entries
    .filter((entry) => entry.actorKind === "human_operator" || entry.actorKind === "support_grant")
    .map((entry) => ({
      key: `entry:${entry.seq}`,
      when: formatWhen(entry.occurredAt, locale),
      who: entry.actorKind === "support_grant" ? copy.whoSupport : fill(copy.whoOperator, { actor: entry.actor }),
      what: accessLogActionText(entry.action, locale),
      why: entry.reason,
      seq: entry.seq,
      late: accessLogEntryLate(entry),
    }));
  const bySeq = new Map(log.entries.map((entry) => [entry.seq, entry]));
  const hostGroups = log.hostSessionGroups.map((group) => ({
    key: `host:${group.actor}:${group.hour}`,
    when: formatWhen(group.hour, locale),
    text: fill(group.count === 1 ? copy.hostGroupOne : copy.hostGroupMany, { count: group.count, actor: group.actor }),
    why: bySeq.get(group.lastSeq)?.reason ?? null,
  }));
  const automated = log.entries.filter((entry) => entry.actorKind === "automated_maintenance");
  return {
    status,
    check: checkLine,
    people,
    hostGroups,
    maintenance: automated.length
      ? {
          count: automated.length,
          summary: fill(automated.length === 1 ? copy.maintenanceOne : copy.maintenanceMany, { count: automated.length }),
          rows: automated.map((entry) => ({ key: `entry:${entry.seq}`, when: formatWhen(entry.occurredAt, locale), what: accessLogActionText(entry.action, locale), late: accessLogEntryLate(entry) })),
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Copy. Company: HODL Media. Product: always "Hey Hermes". German uses "Du".

type AccessLogActions = {
  "fcadm.guest-agent-program": string;
  "fcadm.guest-logs": string;
  "fcadm.guest-secret-scan": string;
  "fcadm.guest-scan-remove": string;
  "fcadm.guest-backup": string;
  "fcadm.guest-export": string;
  "fcadm.guest-export-full": string;
  "fcadm.guest-test-state-export": string;
  "fcadm.guest-restore": string;
  "ssh.session-open": string;
  "support.grant-diagnostics": string;
};

export type AccessLogCopy = {
  title: string;
  entryLabel: string;
  entryHint: string;
  close: string;
  loading: string;
  loadFailed: string;
  retry: string;
  statusNone: string;
  statusOne: string;
  statusMany: string;
  checkOk: string;
  checkPending: string;
  checkEmpty: string;
  checkPartial: string;
  checkFailed: string;
  checkKeyChanged: string;
  recordedLate: string;
  peopleTitle: string;
  peopleNone: string;
  whoOperator: string;
  whoSupport: string;
  whoLabel: string;
  whatLabel: string;
  whyLabel: string;
  hostTitle: string;
  hostGroupOne: string;
  hostGroupMany: string;
  maintenanceOne: string;
  maintenanceMany: string;
  showDetails: string;
  hideDetails: string;
  actions: AccessLogActions;
  actionOther: string;
  verifyTitle: string;
  verifyBody: string;
  verifyLink: string;
  supportTitle: string;
  supportBody: string;
  supportLink: string;
};

const en: AccessLogCopy = {
  title: "Access to your server",
  entryLabel: "Access to your server",
  entryHint: "Every time HODL Media touched your server",
  close: "Close",
  loading: "Loading the record…",
  loadFailed: "The record could not be loaded. Please try again later.",
  retry: "Try again",
  statusNone: "No access by HODL Media in the last 30 days",
  statusOne: "1 access by HODL Media in the last 30 days — see below",
  statusMany: "{count} accesses by HODL Media in the last 30 days — see below",
  checkOk: "Checked: the record is complete and publicly anchored",
  checkPending: "Checked: the record is complete. It is being publicly anchored.",
  checkEmpty: "Checked: the record is complete",
  checkPartial: "Checked: the newest part of the record is complete. Older parts could not be loaded right now.",
  checkFailed: "Warning: this record could not be confirmed. It does not match its checksums or what this device saw before. Please contact support.",
  checkKeyChanged: "Warning: the key that signs this record has changed since this device first saw it. Please contact support before you trust this record.",
  recordedLate: "Recorded late",
  peopleTitle: "People and support",
  peopleNone: "No one from HODL Media accessed your server.",
  whoOperator: "HODL Media team member ({actor})",
  whoSupport: "Support, with your permission",
  whoLabel: "Who",
  whatLabel: "What",
  whyLabel: "Why",
  hostTitle: "Administrator logins on the machine that runs your server",
  hostGroupOne: "1 login by {actor}",
  hostGroupMany: "{count} logins by {actor}",
  maintenanceOne: "Automatic maintenance: 1 time",
  maintenanceMany: "Automatic maintenance: {count} times",
  showDetails: "Show",
  hideDetails: "Hide",
  actions: {
    "fcadm.guest-agent-program": "Ran a maintenance program on your server",
    "fcadm.guest-logs": "Read your server's technical log",
    "fcadm.guest-secret-scan": "Checked your server's files for leftover staff keys",
    "fcadm.guest-scan-remove": "Removed one file from your server",
    "fcadm.guest-backup": "Made an encrypted backup of your server",
    "fcadm.guest-export": "Opened your private storage to copy your files",
    "fcadm.guest-export-full": "Copied your whole server",
    "fcadm.guest-test-state-export": "Opened the storage of a test server",
    "fcadm.guest-restore": "Restored your server from a backup",
    "ssh.session-open": "Signed in as administrator",
    "support.grant-diagnostics": "Ran the health check you allowed",
  },
  actionOther: "Other access",
  verifyTitle: "Check it yourself",
  verifyBody: "Every entry is linked to the one before it by a checksum, so no entry can be changed or removed without it showing. A fingerprint of the record is regularly published in Sigstore's public transparency log, where no one — HODL Media included — can change it afterwards. This app checks the checksums each time you open this screen. With the free program verify.mjs and Node.js you can check the record and its public fingerprint on your own computer.",
  verifyLink: "Get verify.mjs",
  supportTitle: "Support access",
  supportBody: "Support can look at your server only with a time-limited code you create.",
  supportLink: "Give support access",
};

const de: AccessLogCopy = {
  title: "Zugriffe auf Deinen Server",
  entryLabel: "Zugriffe auf Deinen Server",
  entryHint: "Jedes Mal, wenn HODL Media Deinen Server berührt hat",
  close: "Schließen",
  loading: "Protokoll wird geladen…",
  loadFailed: "Das Protokoll konnte nicht geladen werden. Bitte versuche es später noch einmal.",
  retry: "Erneut versuchen",
  statusNone: "Kein Zugriff durch HODL Media in den letzten 30 Tagen",
  statusOne: "1 Zugriff durch HODL Media in den letzten 30 Tagen – siehe unten",
  statusMany: "{count} Zugriffe durch HODL Media in den letzten 30 Tagen – siehe unten",
  checkOk: "Geprüft: Das Protokoll ist vollständig und öffentlich verankert",
  checkPending: "Geprüft: Das Protokoll ist vollständig. Es wird gerade öffentlich verankert.",
  checkEmpty: "Geprüft: Das Protokoll ist vollständig",
  checkPartial: "Geprüft: Der neueste Teil des Protokolls ist vollständig. Ältere Teile ließen sich gerade nicht laden.",
  checkFailed: "Achtung: Dieses Protokoll ließ sich nicht bestätigen. Es passt nicht zu seinen Prüfsummen oder zu dem, was dieses Gerät vorher gesehen hat. Bitte wende Dich an den Support.",
  checkKeyChanged: "Achtung: Der Schlüssel, der dieses Protokoll signiert, hat sich geändert, seit dieses Gerät es zum ersten Mal gesehen hat. Bitte wende Dich an den Support, bevor Du diesem Protokoll vertraust.",
  recordedLate: "Verspätet erfasst",
  peopleTitle: "Personen und Support",
  peopleNone: "Niemand von HODL Media hat auf Deinen Server zugegriffen.",
  whoOperator: "Mitarbeiter von HODL Media ({actor})",
  whoSupport: "Support, mit Deiner Freigabe",
  whoLabel: "Wer",
  whatLabel: "Was",
  whyLabel: "Warum",
  hostTitle: "Administrator-Anmeldungen auf dem Rechner, auf dem Dein Server läuft",
  hostGroupOne: "1 Anmeldung von {actor}",
  hostGroupMany: "{count} Anmeldungen von {actor}",
  maintenanceOne: "Automatische Wartung: 1-mal",
  maintenanceMany: "Automatische Wartung: {count}-mal",
  showDetails: "Anzeigen",
  hideDetails: "Ausblenden",
  actions: {
    "fcadm.guest-agent-program": "Ein Wartungsprogramm auf Deinem Server ausgeführt",
    "fcadm.guest-logs": "Das technische Protokoll Deines Servers gelesen",
    "fcadm.guest-secret-scan": "Die Dateien Deines Servers auf zurückgebliebene Mitarbeiterschlüssel geprüft",
    "fcadm.guest-scan-remove": "Eine Datei von Deinem Server entfernt",
    "fcadm.guest-backup": "Eine verschlüsselte Sicherung Deines Servers erstellt",
    "fcadm.guest-export": "Deinen privaten Speicher geöffnet, um Deine Dateien zu kopieren",
    "fcadm.guest-export-full": "Deinen ganzen Server kopiert",
    "fcadm.guest-test-state-export": "Den Speicher eines Testservers geöffnet",
    "fcadm.guest-restore": "Deinen Server aus einer Sicherung wiederhergestellt",
    "ssh.session-open": "Als Administrator angemeldet",
    "support.grant-diagnostics": "Die von Dir erlaubte Zustandsprüfung ausgeführt",
  },
  actionOther: "Anderer Zugriff",
  verifyTitle: "Selbst prüfen",
  verifyBody: "Jeder Eintrag ist über eine Prüfsumme mit dem vorherigen verbunden. Kein Eintrag lässt sich deshalb ändern oder entfernen, ohne dass es auffällt. Ein Fingerabdruck des Protokolls wird regelmäßig im öffentlichen Transparenzprotokoll von Sigstore veröffentlicht, wo ihn niemand – auch HODL Media nicht – nachträglich ändern kann. Diese App prüft die Prüfsummen jedes Mal, wenn Du diese Seite öffnest. Mit dem kostenlosen Programm verify.mjs und Node.js kannst Du das Protokoll und seinen öffentlichen Fingerabdruck auf Deinem eigenen Computer prüfen.",
  verifyLink: "verify.mjs herunterladen",
  supportTitle: "Supportzugriff",
  supportBody: "Der Support kann Deinen Server nur mit einem zeitlich begrenzten Code ansehen, den Du erstellst.",
  supportLink: "Supportzugriff geben",
};

const fr: AccessLogCopy = {
  title: "Accès à votre serveur",
  entryLabel: "Accès à votre serveur",
  entryHint: "Chaque fois que HODL Media est intervenu sur votre serveur",
  close: "Fermer",
  loading: "Chargement du registre…",
  loadFailed: "Le registre n’a pas pu être chargé. Veuillez réessayer plus tard.",
  retry: "Réessayer",
  statusNone: "Aucun accès par HODL Media au cours des 30 derniers jours",
  statusOne: "1 accès par HODL Media au cours des 30 derniers jours — voir ci-dessous",
  statusMany: "{count} accès par HODL Media au cours des 30 derniers jours — voir ci-dessous",
  checkOk: "Vérifié : le registre est complet et ancré publiquement",
  checkPending: "Vérifié : le registre est complet. Son ancrage public est en cours.",
  checkEmpty: "Vérifié : le registre est complet",
  checkPartial: "Vérifié : la partie la plus récente du registre est complète. Les parties plus anciennes n’ont pas pu être chargées pour le moment.",
  checkFailed: "Attention : ce registre n’a pas pu être confirmé. Il ne correspond pas à ses sommes de contrôle ou à ce que cet appareil a vu auparavant. Veuillez contacter le support.",
  checkKeyChanged: "Attention : la clé qui signe ce registre a changé depuis que cet appareil l’a vu pour la première fois. Contactez le support avant de vous fier à ce registre.",
  recordedLate: "Enregistré en retard",
  peopleTitle: "Personnes et support",
  peopleNone: "Personne de HODL Media n’a accédé à votre serveur.",
  whoOperator: "Membre de l’équipe HODL Media ({actor})",
  whoSupport: "Le support, avec votre autorisation",
  whoLabel: "Qui",
  whatLabel: "Quoi",
  whyLabel: "Pourquoi",
  hostTitle: "Connexions administrateur sur la machine qui exécute votre serveur",
  hostGroupOne: "1 connexion par {actor}",
  hostGroupMany: "{count} connexions par {actor}",
  maintenanceOne: "Maintenance automatique : 1 fois",
  maintenanceMany: "Maintenance automatique : {count} fois",
  showDetails: "Afficher",
  hideDetails: "Masquer",
  actions: {
    "fcadm.guest-agent-program": "A exécuté un programme de maintenance sur votre serveur",
    "fcadm.guest-logs": "A lu le journal technique de votre serveur",
    "fcadm.guest-secret-scan": "A vérifié les fichiers de votre serveur pour des clés d’équipe oubliées",
    "fcadm.guest-scan-remove": "A supprimé un fichier de votre serveur",
    "fcadm.guest-backup": "A créé une sauvegarde chiffrée de votre serveur",
    "fcadm.guest-export": "A ouvert votre stockage privé pour copier vos fichiers",
    "fcadm.guest-export-full": "A copié l’intégralité de votre serveur",
    "fcadm.guest-test-state-export": "A ouvert le stockage d’un serveur de test",
    "fcadm.guest-restore": "A restauré votre serveur à partir d’une sauvegarde",
    "ssh.session-open": "S’est connecté en tant qu’administrateur",
    "support.grant-diagnostics": "A effectué la vérification d’état que vous avez autorisée",
  },
  actionOther: "Autre accès",
  verifyTitle: "Vérifiez vous-même",
  verifyBody: "Chaque entrée est reliée à la précédente par une somme de contrôle : aucune entrée ne peut être modifiée ou supprimée sans que cela se voie. Une empreinte du registre est publiée régulièrement dans le journal de transparence public de Sigstore, où personne — pas même HODL Media — ne peut la modifier ensuite. Cette app vérifie les sommes de contrôle à chaque ouverture de cet écran. Avec le programme gratuit verify.mjs et Node.js, vous pouvez vérifier le registre et son empreinte publique sur votre propre ordinateur.",
  verifyLink: "Obtenir verify.mjs",
  supportTitle: "Accès du support",
  supportBody: "Le support ne peut consulter votre serveur qu’avec un code temporaire que vous créez.",
  supportLink: "Donner un accès au support",
};

const es: AccessLogCopy = {
  title: "Accesos a tu servidor",
  entryLabel: "Accesos a tu servidor",
  entryHint: "Cada vez que HODL Media intervino en tu servidor",
  close: "Cerrar",
  loading: "Cargando el registro…",
  loadFailed: "No se pudo cargar el registro. Inténtalo de nuevo más tarde.",
  retry: "Reintentar",
  statusNone: "Ningún acceso de HODL Media en los últimos 30 días",
  statusOne: "1 acceso de HODL Media en los últimos 30 días — ver abajo",
  statusMany: "{count} accesos de HODL Media en los últimos 30 días — ver abajo",
  checkOk: "Comprobado: el registro está completo y anclado públicamente",
  checkPending: "Comprobado: el registro está completo. Se está anclando públicamente.",
  checkEmpty: "Comprobado: el registro está completo",
  checkPartial: "Comprobado: la parte más reciente del registro está completa. Las partes anteriores no se pudieron cargar ahora.",
  checkFailed: "Atención: no se pudo confirmar este registro. No coincide con sus sumas de verificación o con lo que este dispositivo vio antes. Contacta con soporte.",
  checkKeyChanged: "Atención: la clave que firma este registro ha cambiado desde que este dispositivo lo vio por primera vez. Contacta con soporte antes de fiarte de este registro.",
  recordedLate: "Registrado con retraso",
  peopleTitle: "Personas y soporte",
  peopleNone: "Nadie de HODL Media accedió a tu servidor.",
  whoOperator: "Miembro del equipo de HODL Media ({actor})",
  whoSupport: "Soporte, con tu permiso",
  whoLabel: "Quién",
  whatLabel: "Qué",
  whyLabel: "Por qué",
  hostTitle: "Inicios de sesión de administrador en la máquina donde se ejecuta tu servidor",
  hostGroupOne: "1 inicio de sesión de {actor}",
  hostGroupMany: "{count} inicios de sesión de {actor}",
  maintenanceOne: "Mantenimiento automático: 1 vez",
  maintenanceMany: "Mantenimiento automático: {count} veces",
  showDetails: "Mostrar",
  hideDetails: "Ocultar",
  actions: {
    "fcadm.guest-agent-program": "Ejecutó un programa de mantenimiento en tu servidor",
    "fcadm.guest-logs": "Leyó el registro técnico de tu servidor",
    "fcadm.guest-secret-scan": "Revisó los archivos de tu servidor en busca de claves del equipo olvidadas",
    "fcadm.guest-scan-remove": "Eliminó un archivo de tu servidor",
    "fcadm.guest-backup": "Hizo una copia de seguridad cifrada de tu servidor",
    "fcadm.guest-export": "Abrió tu almacenamiento privado para copiar tus archivos",
    "fcadm.guest-export-full": "Copió tu servidor completo",
    "fcadm.guest-test-state-export": "Abrió el almacenamiento de un servidor de prueba",
    "fcadm.guest-restore": "Restauró tu servidor desde una copia de seguridad",
    "ssh.session-open": "Inició sesión como administrador",
    "support.grant-diagnostics": "Realizó la comprobación de estado que permitiste",
  },
  actionOther: "Otro acceso",
  verifyTitle: "Compruébalo tú mismo",
  verifyBody: "Cada entrada está unida a la anterior mediante una suma de verificación, así que ninguna entrada puede cambiarse o eliminarse sin que se note. Una huella del registro se publica con regularidad en el registro público de transparencia de Sigstore, donde nadie —tampoco HODL Media— puede cambiarla después. Esta app comprueba las sumas de verificación cada vez que abres esta pantalla. Con el programa gratuito verify.mjs y Node.js puedes comprobar el registro y su huella pública en tu propio ordenador.",
  verifyLink: "Obtener verify.mjs",
  supportTitle: "Acceso de soporte",
  supportBody: "Soporte solo puede ver tu servidor con un código temporal que tú creas.",
  supportLink: "Dar acceso a soporte",
};

const it: AccessLogCopy = {
  title: "Accessi al tuo server",
  entryLabel: "Accessi al tuo server",
  entryHint: "Ogni volta che HODL Media è intervenuta sul tuo server",
  close: "Chiudi",
  loading: "Caricamento del registro…",
  loadFailed: "Non è stato possibile caricare il registro. Riprova più tardi.",
  retry: "Riprova",
  statusNone: "Nessun accesso da parte di HODL Media negli ultimi 30 giorni",
  statusOne: "1 accesso da parte di HODL Media negli ultimi 30 giorni — vedi sotto",
  statusMany: "{count} accessi da parte di HODL Media negli ultimi 30 giorni — vedi sotto",
  checkOk: "Verificato: il registro è completo e ancorato pubblicamente",
  checkPending: "Verificato: il registro è completo. L’ancoraggio pubblico è in corso.",
  checkEmpty: "Verificato: il registro è completo",
  checkPartial: "Verificato: la parte più recente del registro è completa. Le parti più vecchie non si sono potute caricare ora.",
  checkFailed: "Attenzione: non è stato possibile confermare questo registro. Non corrisponde alle sue somme di controllo o a ciò che questo dispositivo ha visto prima. Contatta l’assistenza.",
  checkKeyChanged: "Attenzione: la chiave che firma questo registro è cambiata da quando questo dispositivo lo ha visto la prima volta. Contatta l’assistenza prima di fidarti di questo registro.",
  recordedLate: "Registrato in ritardo",
  peopleTitle: "Persone e assistenza",
  peopleNone: "Nessuno di HODL Media ha avuto accesso al tuo server.",
  whoOperator: "Membro del team HODL Media ({actor})",
  whoSupport: "Assistenza, con il tuo permesso",
  whoLabel: "Chi",
  whatLabel: "Cosa",
  whyLabel: "Perché",
  hostTitle: "Accessi da amministratore sulla macchina che esegue il tuo server",
  hostGroupOne: "1 accesso di {actor}",
  hostGroupMany: "{count} accessi di {actor}",
  maintenanceOne: "Manutenzione automatica: 1 volta",
  maintenanceMany: "Manutenzione automatica: {count} volte",
  showDetails: "Mostra",
  hideDetails: "Nascondi",
  actions: {
    "fcadm.guest-agent-program": "Ha eseguito un programma di manutenzione sul tuo server",
    "fcadm.guest-logs": "Ha letto il registro tecnico del tuo server",
    "fcadm.guest-secret-scan": "Ha controllato i file del tuo server alla ricerca di chiavi del team rimaste",
    "fcadm.guest-scan-remove": "Ha rimosso un file dal tuo server",
    "fcadm.guest-backup": "Ha creato un backup cifrato del tuo server",
    "fcadm.guest-export": "Ha aperto il tuo spazio privato per copiare i tuoi file",
    "fcadm.guest-export-full": "Ha copiato l’intero server",
    "fcadm.guest-test-state-export": "Ha aperto lo spazio di un server di prova",
    "fcadm.guest-restore": "Ha ripristinato il tuo server da un backup",
    "ssh.session-open": "Ha effettuato l’accesso come amministratore",
    "support.grant-diagnostics": "Ha eseguito il controllo di stato che hai consentito",
  },
  actionOther: "Altro accesso",
  verifyTitle: "Verifica tu stesso",
  verifyBody: "Ogni voce è collegata alla precedente da una somma di controllo, quindi nessuna voce può essere modificata o rimossa senza che si veda. Un’impronta del registro viene pubblicata regolarmente nel registro pubblico di trasparenza di Sigstore, dove nessuno — nemmeno HODL Media — può modificarla in seguito. Questa app verifica le somme di controllo ogni volta che apri questa schermata. Con il programma gratuito verify.mjs e Node.js puoi verificare il registro e la sua impronta pubblica sul tuo computer.",
  verifyLink: "Scarica verify.mjs",
  supportTitle: "Accesso dell’assistenza",
  supportBody: "L’assistenza può vedere il tuo server solo con un codice a tempo che crei tu.",
  supportLink: "Concedi accesso all’assistenza",
};

const ptBR: AccessLogCopy = {
  title: "Acessos ao seu servidor",
  entryLabel: "Acessos ao seu servidor",
  entryHint: "Cada vez que a HODL Media mexeu no seu servidor",
  close: "Fechar",
  loading: "Carregando o registro…",
  loadFailed: "Não foi possível carregar o registro. Tente novamente mais tarde.",
  retry: "Tentar novamente",
  statusNone: "Nenhum acesso da HODL Media nos últimos 30 dias",
  statusOne: "1 acesso da HODL Media nos últimos 30 dias — veja abaixo",
  statusMany: "{count} acessos da HODL Media nos últimos 30 dias — veja abaixo",
  checkOk: "Verificado: o registro está completo e ancorado publicamente",
  checkPending: "Verificado: o registro está completo. Ele está sendo ancorado publicamente.",
  checkEmpty: "Verificado: o registro está completo",
  checkPartial: "Verificado: a parte mais recente do registro está completa. As partes mais antigas não puderam ser carregadas agora.",
  checkFailed: "Atenção: não foi possível confirmar este registro. Ele não corresponde às suas somas de verificação ou ao que este dispositivo viu antes. Entre em contato com o suporte.",
  checkKeyChanged: "Atenção: a chave que assina este registro mudou desde que este dispositivo o viu pela primeira vez. Entre em contato com o suporte antes de confiar neste registro.",
  recordedLate: "Registrado com atraso",
  peopleTitle: "Pessoas e suporte",
  peopleNone: "Ninguém da HODL Media acessou o seu servidor.",
  whoOperator: "Membro da equipe HODL Media ({actor})",
  whoSupport: "Suporte, com a sua permissão",
  whoLabel: "Quem",
  whatLabel: "O quê",
  whyLabel: "Por quê",
  hostTitle: "Logins de administrador na máquina que executa o seu servidor",
  hostGroupOne: "1 login de {actor}",
  hostGroupMany: "{count} logins de {actor}",
  maintenanceOne: "Manutenção automática: 1 vez",
  maintenanceMany: "Manutenção automática: {count} vezes",
  showDetails: "Mostrar",
  hideDetails: "Ocultar",
  actions: {
    "fcadm.guest-agent-program": "Executou um programa de manutenção no seu servidor",
    "fcadm.guest-logs": "Leu o registro técnico do seu servidor",
    "fcadm.guest-secret-scan": "Verificou os arquivos do seu servidor em busca de chaves da equipe esquecidas",
    "fcadm.guest-scan-remove": "Removeu um arquivo do seu servidor",
    "fcadm.guest-backup": "Fez um backup criptografado do seu servidor",
    "fcadm.guest-export": "Abriu o seu armazenamento privado para copiar seus arquivos",
    "fcadm.guest-export-full": "Copiou o seu servidor inteiro",
    "fcadm.guest-test-state-export": "Abriu o armazenamento de um servidor de teste",
    "fcadm.guest-restore": "Restaurou o seu servidor a partir de um backup",
    "ssh.session-open": "Entrou como administrador",
    "support.grant-diagnostics": "Executou a verificação de estado que você permitiu",
  },
  actionOther: "Outro acesso",
  verifyTitle: "Verifique você mesmo",
  verifyBody: "Cada entrada está ligada à anterior por uma soma de verificação, então nenhuma entrada pode ser alterada ou removida sem que isso apareça. Uma impressão digital do registro é publicada regularmente no registro público de transparência da Sigstore, onde ninguém — nem a HODL Media — pode alterá-la depois. Este app confere as somas de verificação sempre que você abre esta tela. Com o programa gratuito verify.mjs e o Node.js, você pode verificar o registro e sua impressão digital pública no seu próprio computador.",
  verifyLink: "Baixar verify.mjs",
  supportTitle: "Acesso do suporte",
  supportBody: "O suporte só pode ver o seu servidor com um código temporário criado por você.",
  supportLink: "Dar acesso ao suporte",
};

const ja: AccessLogCopy = {
  title: "サーバーへのアクセス",
  entryLabel: "サーバーへのアクセス",
  entryHint: "HODL Mediaがあなたのサーバーに触れたすべての記録",
  close: "閉じる",
  loading: "記録を読み込んでいます…",
  loadFailed: "記録を読み込めませんでした。しばらくしてからもう一度お試しください。",
  retry: "再試行",
  statusNone: "過去30日間、HODL Mediaによるアクセスはありません",
  statusOne: "過去30日間にHODL Mediaによるアクセスが1件あります — 下記をご覧ください",
  statusMany: "過去30日間にHODL Mediaによるアクセスが{count}件あります — 下記をご覧ください",
  checkOk: "確認済み：記録は完全で、公開の場に固定されています",
  checkPending: "確認済み：記録は完全です。現在、公開の場への固定を行っています。",
  checkEmpty: "確認済み：記録は完全です",
  checkPartial: "確認済み：記録の最新部分は完全です。古い部分は現在読み込めませんでした。",
  checkFailed: "警告：この記録を確認できませんでした。チェックサム、またはこの端末が以前に見た内容と一致しません。サポートにご連絡ください。",
  checkKeyChanged: "警告：この記録に署名する鍵が、この端末で最初に確認したときから変わっています。この記録を信頼する前にサポートにご連絡ください。",
  recordedLate: "遅れて記録",
  peopleTitle: "担当者とサポート",
  peopleNone: "HODL Mediaの担当者によるサーバーへのアクセスはありません。",
  whoOperator: "HODL Mediaのスタッフ（{actor}）",
  whoSupport: "サポート（あなたの許可あり）",
  whoLabel: "誰が",
  whatLabel: "何を",
  whyLabel: "理由",
  hostTitle: "サーバーを動かしているマシンへの管理者ログイン",
  hostGroupOne: "{actor}によるログイン 1回",
  hostGroupMany: "{actor}によるログイン {count}回",
  maintenanceOne: "自動メンテナンス：1回",
  maintenanceMany: "自動メンテナンス：{count}回",
  showDetails: "表示",
  hideDetails: "閉じる",
  actions: {
    "fcadm.guest-agent-program": "サーバーでメンテナンス用プログラムを実行しました",
    "fcadm.guest-logs": "サーバーの技術ログを読みました",
    "fcadm.guest-secret-scan": "スタッフ用の鍵が残っていないかサーバーのファイルを確認しました",
    "fcadm.guest-scan-remove": "サーバーからファイルを1つ削除しました",
    "fcadm.guest-backup": "サーバーの暗号化バックアップを作成しました",
    "fcadm.guest-export": "ファイルをコピーするためにプライベートストレージを開きました",
    "fcadm.guest-export-full": "サーバー全体をコピーしました",
    "fcadm.guest-test-state-export": "テスト用サーバーのストレージを開きました",
    "fcadm.guest-restore": "バックアップからサーバーを復元しました",
    "ssh.session-open": "管理者としてログインしました",
    "support.grant-diagnostics": "あなたが許可した状態チェックを実行しました",
  },
  actionOther: "その他のアクセス",
  verifyTitle: "自分で確認する",
  verifyBody: "各記録はチェックサムで直前の記録とつながっているため、変更や削除をすれば必ず分かります。記録の指紋は定期的にSigstoreの公開透明性ログに公開され、HODL Mediaを含め誰も後から変更できません。このアプリは、この画面を開くたびにチェックサムを確認します。無料のプログラムverify.mjsとNode.jsを使えば、記録とその公開された指紋をご自身のコンピューターで確認できます。",
  verifyLink: "verify.mjsを入手",
  supportTitle: "サポートアクセス",
  supportBody: "サポートがサーバーを確認できるのは、あなたが作成した期限付きコードがある場合だけです。",
  supportLink: "サポートにアクセスを許可",
};

const ko: AccessLogCopy = {
  title: "서버 접근 기록",
  entryLabel: "서버 접근 기록",
  entryHint: "HODL Media가 서버에 접근한 모든 기록",
  close: "닫기",
  loading: "기록을 불러오는 중…",
  loadFailed: "기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  retry: "다시 시도",
  statusNone: "최근 30일 동안 HODL Media의 접근이 없습니다",
  statusOne: "최근 30일 동안 HODL Media의 접근 1건 — 아래를 확인하세요",
  statusMany: "최근 30일 동안 HODL Media의 접근 {count}건 — 아래를 확인하세요",
  checkOk: "확인됨: 기록이 완전하며 공개적으로 고정되어 있습니다",
  checkPending: "확인됨: 기록이 완전합니다. 공개 고정이 진행 중입니다.",
  checkEmpty: "확인됨: 기록이 완전합니다",
  checkPartial: "확인됨: 기록의 최신 부분은 완전합니다. 이전 부분은 지금 불러올 수 없었습니다.",
  checkFailed: "주의: 이 기록을 확인할 수 없습니다. 체크섬 또는 이 기기가 이전에 본 내용과 일치하지 않습니다. 지원팀에 문의해 주세요.",
  checkKeyChanged: "주의: 이 기록에 서명하는 키가 이 기기에서 처음 확인한 이후 바뀌었습니다. 이 기록을 믿기 전에 지원팀에 문의해 주세요.",
  recordedLate: "늦게 기록됨",
  peopleTitle: "직원 및 지원팀",
  peopleNone: "HODL Media 직원이 서버에 접근한 적이 없습니다.",
  whoOperator: "HODL Media 직원 ({actor})",
  whoSupport: "지원팀 (사용자 허가)",
  whoLabel: "누가",
  whatLabel: "무엇을",
  whyLabel: "이유",
  hostTitle: "서버를 실행하는 장비의 관리자 로그인",
  hostGroupOne: "{actor}의 로그인 1회",
  hostGroupMany: "{actor}의 로그인 {count}회",
  maintenanceOne: "자동 유지보수: 1회",
  maintenanceMany: "자동 유지보수: {count}회",
  showDetails: "보기",
  hideDetails: "숨기기",
  actions: {
    "fcadm.guest-agent-program": "서버에서 유지보수 프로그램을 실행했습니다",
    "fcadm.guest-logs": "서버의 기술 로그를 읽었습니다",
    "fcadm.guest-secret-scan": "남아 있는 직원 키가 있는지 서버 파일을 확인했습니다",
    "fcadm.guest-scan-remove": "서버에서 파일 하나를 삭제했습니다",
    "fcadm.guest-backup": "서버의 암호화된 백업을 만들었습니다",
    "fcadm.guest-export": "파일을 복사하기 위해 개인 저장공간을 열었습니다",
    "fcadm.guest-export-full": "서버 전체를 복사했습니다",
    "fcadm.guest-test-state-export": "테스트 서버의 저장공간을 열었습니다",
    "fcadm.guest-restore": "백업에서 서버를 복원했습니다",
    "ssh.session-open": "관리자로 로그인했습니다",
    "support.grant-diagnostics": "사용자가 허용한 상태 점검을 실행했습니다",
  },
  actionOther: "기타 접근",
  verifyTitle: "직접 확인하기",
  verifyBody: "각 기록은 체크섬으로 이전 기록과 연결되어 있어, 기록을 바꾸거나 지우면 반드시 드러납니다. 기록의 지문은 Sigstore의 공개 투명성 로그에 정기적으로 게시되며, HODL Media를 포함해 누구도 나중에 바꿀 수 없습니다. 이 앱은 이 화면을 열 때마다 체크섬을 확인합니다. 무료 프로그램 verify.mjs와 Node.js로 기록과 공개된 지문을 직접 컴퓨터에서 확인할 수 있습니다.",
  verifyLink: "verify.mjs 받기",
  supportTitle: "지원팀 접근",
  supportBody: "지원팀은 사용자가 만든 시간 제한 코드가 있을 때만 서버를 볼 수 있습니다.",
  supportLink: "지원팀 접근 허용",
};

const catalog: Record<AppLocale, AccessLogCopy> = { en, de, fr, es, it, "pt-BR": ptBR, ja, ko };

export function accessLogCopy(locale: AppLocale): AccessLogCopy {
  return catalog[locale] ?? en;
}
