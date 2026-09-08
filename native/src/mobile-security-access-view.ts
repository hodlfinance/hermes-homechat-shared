import type { BackupJob, CloudInfrastructureEvent, SecurityAccessOverview, SupportGrant } from "../core/index";
import type { MobileSecurityStateWords } from "./appI18n";

/**
 * HPD-411: the web is the template here, not the app.
 *
 * `apps/web/app/app/page.tsx` draws the Security & Access panel as three
 * groups of label/value pairs. The phone shows the same pairs, derived here so
 * a test can hold every field against the browser instead of against a
 * screenshot. Nothing is dropped because the screen is narrow.
 *
 * No secret value passes through this module. Keys and access appear as state
 * — a fingerprint, a status word, a shortened hash — never as the value
 * itself, exactly as the browser shows them.
 */

export type MobileSecurityFieldRow = Readonly<{
  key: string;
  label: string;
  value: string;
}>;

export type MobileSecurityTone = "teal" | "amber" | "coral";

export type MobileSecurityStatus = Readonly<{
  tone: MobileSecurityTone;
  label: string;
  anchorPending: boolean;
}>;

export type MobileSecurityAccessCopy = Readonly<{
  handover: string;
  customerControlledSince: string;
  pending: string;
  adminKey: string;
  customerKey: string;
  keyNotRegistered: string;
  standingAccess: string;
  noneDetected: string;
  lastBaselineCheck: string;
  notChecked: string;
  anchorPending: string;
  exceptionalEvents: string;
  unmatchedEvents: string;
  latestEvent: string;
  noEvents: string;
  latestEventHash: string;
  noReceipt: string;
  latestSealedBatch: string;
  notSealed: string;
  wormRetentionUntil: string;
  externalAnchor: string;
  notAnchored: string;
  externalAnchorFallback: string;
  activeGrants: string;
  none: string;
  grantCodeHint: string;
  grantExpires: string;
  grantScopes: string;
  grantLastUsed: string;
  grantRevoked: string;
}> & MobileSecurityStateWords;

export type MobileBackupJobCopy = Readonly<{
  exportKind: Readonly<Record<BackupJob["kind"], string>>;
  exportStatus: Readonly<Record<BackupJob["status"], string>>;
  exportRequested: string;
  exportCompleted: string;
}>;

export type MobileDateFormatter = (value: string) => string;

export type MobileSecurityAction = "admin_key" | "handover" | "receipt" | "anchor" | "revoke";

/**
 * The outcome of one security action, kept beside the row that started it.
 * The app answers where the customer pressed rather than in one notice at the
 * top of a long screen.
 */
export type MobileSecurityOutcome = Readonly<{
  action: MobileSecurityAction;
  grantId?: string;
  tone: "info" | "error";
  text: string;
}>;

export function mobileSecurityRowOutcome(
  outcome: MobileSecurityOutcome | null,
  action: MobileSecurityAction,
  grantId?: string,
): { status?: string; error?: string } {
  if (!outcome || outcome.action !== action) return {};
  if (grantId !== undefined && outcome.grantId !== grantId) return {};
  return outcome.tone === "error" ? { error: outcome.text } : { status: outcome.text };
}

/**
 * Free-form server text only — an infrastructure event type is not a closed
 * set, so it keeps the server's own words with the underscores opened up.
 * HPD-416: every closed set on this screen is translated instead, through
 * `MobileSecurityStateWords`.
 */
export function mobileSecurityLabelFor(value: string) {
  return value.replaceAll("_", " ");
}

/** The same shortening the browser uses, so both surfaces show one hash. */
export function mobileSecurityShortHash(value: string) {
  return value.length > 16 ? `${value.slice(0, 12)}...${value.slice(-6)}` : value;
}

export function defaultMobileSecurityAccessOverview(): SecurityAccessOverview {
  return {
    adminAccess: {
      handoverStatus: "not_started",
      customerControlledSince: null,
      standingAccessStatus: "unknown",
      customerPublicKeyFingerprint: null,
      customerPublicKeyLabel: null,
      lastBaselineAttestedAt: null,
    },
    support: { activeGrants: [], pastGrants: [] },
    infrastructure: { status: "green", exceptionalEvents: [], unmatchedEvents: [] },
    auditProof: {
      latestEventId: null,
      latestEventHash: null,
      latestBatchId: null,
      latestBatchStatus: null,
      latestBatchRoot: null,
      latestBatchSealedAt: null,
      latestBatchRetentionUntil: null,
      latestAnchor: null,
      latestAnchorProvider: null,
      latestAnchorUrl: null,
    },
  };
}

export function mobileSecurityStatus(
  security: SecurityAccessOverview,
  copy: MobileSecurityAccessCopy,
): MobileSecurityStatus {
  const anchorPending = security.auditProof.latestBatchStatus === "sealed" && !security.auditProof.latestAnchor;
  const tone: MobileSecurityTone = security.infrastructure.status === "red"
    ? "coral"
    : security.infrastructure.status === "yellow" || anchorPending
      ? "amber"
      : "teal";
  return {
    tone,
    anchorPending,
    label: anchorPending ? copy.anchorPending : copy.infrastructureStatuses[security.infrastructure.status],
  };
}


export function mobileAdminAccessRows(
  security: SecurityAccessOverview,
  copy: MobileSecurityAccessCopy,
  formatDate: MobileDateFormatter,
): MobileSecurityFieldRow[] {
  const admin = security.adminAccess;
  return [
    { key: "handover", label: copy.handover, value: copy.handoverStatuses[admin.handoverStatus] },
    {
      key: "customer_controlled_since",
      label: copy.customerControlledSince,
      value: admin.customerControlledSince ? formatDate(admin.customerControlledSince) : copy.pending,
    },
    {
      key: "admin_key",
      label: copy.adminKey,
      value: admin.customerPublicKeyFingerprint
        ? `${admin.customerPublicKeyLabel || copy.customerKey} · ${admin.customerPublicKeyFingerprint}`
        : copy.keyNotRegistered,
    },
    {
      key: "standing_access",
      label: copy.standingAccess,
      value: admin.standingAccessStatus === "none_detected"
        ? copy.noneDetected
        : copy.standingAccessStatuses[admin.standingAccessStatus],
    },
    {
      key: "last_baseline_check",
      label: copy.lastBaselineCheck,
      value: admin.lastBaselineAttestedAt ? formatDate(admin.lastBaselineAttestedAt) : copy.notChecked,
    },
  ];
}

export function mobileInfrastructureRows(
  security: SecurityAccessOverview,
  copy: MobileSecurityAccessCopy,
  formatDate: MobileDateFormatter,
): MobileSecurityFieldRow[] {
  const proof = security.auditProof;
  const latest = [...security.infrastructure.exceptionalEvents, ...security.infrastructure.unmatchedEvents][0];
  return [
    {
      key: "exceptional_events",
      label: copy.exceptionalEvents,
      value: String(security.infrastructure.exceptionalEvents.length),
    },
    {
      key: "unmatched_events",
      label: copy.unmatchedEvents,
      value: String(security.infrastructure.unmatchedEvents.length),
    },
    {
      key: "latest_event",
      label: copy.latestEvent,
      value: latest
        ? `${mobileSecurityLabelFor(latest.eventType)} · ${formatDate(latest.createdAt)}`
        : copy.noEvents,
    },
    {
      key: "latest_event_hash",
      label: copy.latestEventHash,
      value: proof.latestEventHash ? mobileSecurityShortHash(proof.latestEventHash) : copy.noReceipt,
    },
    {
      key: "latest_sealed_batch",
      label: copy.latestSealedBatch,
      value: proof.latestBatchRoot
        ? `${mobileSecurityShortHash(proof.latestBatchRoot)} · ${copy.auditBatchStatuses[proof.latestBatchStatus || "sealed"]}`
        : copy.notSealed,
    },
    {
      key: "worm_retention_until",
      label: copy.wormRetentionUntil,
      value: proof.latestBatchRetentionUntil ? formatDate(proof.latestBatchRetentionUntil) : copy.notSealed,
    },
    {
      key: "external_anchor",
      label: copy.externalAnchor,
      value: proof.latestAnchor
        ? `${proof.latestAnchorProvider || copy.externalAnchorFallback} · ${proof.latestAnchor}`
        : copy.notAnchored,
    },
  ];
}

export function mobileActiveGrantsRow(
  security: SecurityAccessOverview,
  copy: MobileSecurityAccessCopy,
): MobileSecurityFieldRow {
  const count = security.support.activeGrants.length;
  return { key: "active_grants", label: copy.activeGrants, value: count ? String(count) : copy.none };
}

/** The browser lists the newest six across active and past grants. */
export function mobileSupportGrants(security: SecurityAccessOverview): SupportGrant[] {
  return [...security.support.activeGrants, ...security.support.pastGrants].slice(0, 6);
}

export function mobileSupportGrantDetail(
  grant: SupportGrant,
  copy: MobileSecurityAccessCopy,
  formatDate: MobileDateFormatter,
) {
  const parts = [
    copy.supportGrantStatuses[grant.status],
    `${copy.grantCodeHint}: ${grant.tokenHint}`,
    `${copy.grantExpires}: ${formatDate(grant.expiresAt)}`,
    `${copy.grantScopes}: ${grant.scopes.join(", ")}`,
  ];
  if (grant.lastUsedAt) parts.push(`${copy.grantLastUsed}: ${formatDate(grant.lastUsedAt)}`);
  if (grant.revokedAt) parts.push(`${copy.grantRevoked}: ${formatDate(grant.revokedAt)}`);
  return parts.join(" · ");
}

export type MobileBackupJobRow = Readonly<{
  id: string;
  label: string;
  detail: string;
  status: string;
  tone: MobileSecurityTone;
  downloadable: boolean;
}>;

/** The browser shows the five newest export and archive jobs. */
export function mobileBackupJobRows(
  jobs: readonly BackupJob[],
  copy: MobileBackupJobCopy,
  formatDate: MobileDateFormatter,
): MobileBackupJobRow[] {
  return jobs.slice(0, 5).map((job) => ({
    id: job.id,
    label: copy.exportKind[job.kind],
    detail: `${copy.exportRequested} ${formatDate(job.createdAt)}${
      job.completedAt ? ` · ${copy.exportCompleted} ${formatDate(job.completedAt)}` : ""
    }`,
    status: copy.exportStatus[job.status],
    tone: job.status === "failed" ? "coral" : job.status === "completed" ? "teal" : "amber",
    downloadable: job.status === "completed" && Boolean(job.archivePath),
  }));
}

/**
 * HPD-434, settled by Justus on 2026-08-23 after Build 58.
 *
 * The old panel put six operator fields in front of the customer — handover,
 * customer-controlled since, admin key, SSH/root login, baseline check — five
 * of them empty and one "unknown". His words: "wer soll verstehen was diese
 * Dinge bedeuten und wen sollen diese leeren Infos helfen?"
 *
 * What he asked for instead is one sentence he can act on and one list he can
 * read: who reached his server, when, and whether a person did it or a machine.
 * Both halves come from data that already exists.
 */
export type MobileServerAccessKind = "granted_by_you" | "automatic" | "manual";

export type MobileServerAccessEntry = Readonly<{
  actor: string | null;
  at: string;
  endedAt: string | null;
  id: string;
  kind: MobileServerAccessKind;
  /** True only for a grant the customer can still take back. */
  revocable: boolean;
  scopes: readonly string[];
  subject: string;
  /** Whether the access was ever used. Null when the record cannot say. */
  used: boolean | null;
}>;

/**
 * A support grant is the customer letting somebody in. `lastUsedAt` is the
 * honest part: a grant that was never used says so, which is the difference
 * between "I allowed it" and "it happened".
 */
function serverAccessFromGrant(grant: SupportGrant): MobileServerAccessEntry {
  return Object.freeze({
    actor: null,
    at: grant.createdAt,
    endedAt: grant.revokedAt ?? grant.expiresAt ?? null,
    id: grant.id,
    kind: "granted_by_you" as const,
    revocable: grant.status === "active",
    scopes: Object.freeze([...grant.scopes]),
    subject: grant.reason,
    used: grant.lastUsedAt !== null && grant.lastUsedAt !== undefined,
  });
}

/**
 * An infrastructure event is the other half: something that touched the server
 * without the customer being asked. `source` is what separates a person from a
 * machine — a console or a hand-made change is manual, the rest is automatic.
 */
function serverAccessFromEvent(event: CloudInfrastructureEvent): MobileServerAccessEntry {
  const byHand = event.source === "manual" || event.source === "hcloud_console";
  return Object.freeze({
    actor: event.actorId ?? event.actorType ?? null,
    at: event.startedAt,
    endedAt: event.completedAt,
    id: event.id,
    kind: byHand ? ("manual" as const) : ("automatic" as const),
    revocable: false,
    scopes: Object.freeze([]),
    subject: event.eventType,
    used: null,
  });
}

/** Every touch of this customer's server, newest first. */
export function mobileServerAccessEntries(security: SecurityAccessOverview): MobileServerAccessEntry[] {
  const entries = [
    ...security.support.activeGrants.map(serverAccessFromGrant),
    ...security.support.pastGrants.map(serverAccessFromGrant),
    ...security.infrastructure.exceptionalEvents.map(serverAccessFromEvent),
    ...security.infrastructure.unmatchedEvents.map(serverAccessFromEvent),
  ];
  entries.sort((left, right) => right.at.localeCompare(left.at) || left.id.localeCompare(right.id));
  return entries;
}

export type MobileServerAccessCopy = Readonly<{
  grantedByYou: string;
  automatic: string;
  manual: string;
  neverUsed: string;
  used: string;
  ended: string;
}>;

/** One line under each access: who, what it covered, whether it was used. */
export function mobileServerAccessDetail(
  entry: MobileServerAccessEntry,
  copy: MobileServerAccessCopy,
  formatDate: MobileDateFormatter,
): string {
  const parts: string[] = [
    entry.kind === "granted_by_you"
      ? copy.grantedByYou
      : entry.kind === "manual"
        ? copy.manual
        : copy.automatic,
    formatDate(entry.at),
  ];
  if (entry.actor) parts.push(entry.actor);
  if (entry.scopes.length) parts.push(entry.scopes.join(", "));
  if (entry.used === false) parts.push(copy.neverUsed);
  else if (entry.used === true) parts.push(copy.used);
  if (entry.endedAt) parts.push(`${copy.ended} ${formatDate(entry.endedAt)}`);
  return parts.join(" · ");
}
