import type { NotificationRecord } from "../core/types";

// HPD-735: the Firecracker lapse rule's two in-app notices -- the day-30
// export link ("Dein Export liegt bereit", valid seven days) and the notice
// after the day-37 deletion ("Dein früherer Arbeitsbereich wurde am …
// gelöscht"). For a Fin/hodl account, which has no deliverable mail address,
// the in-app notice is the only channel, so the surface shows it from the
// snapshot the plane already sends. Dismissing it is kept on the device: the
// native route allowlist has no PATCH /notifications.

export type MobileLapseNotice = {
  id: string;
  title: string;
  body: string;
  /** The export link; null for the deletion notice or anything that is not https. */
  actionUrl: string | null;
};

const LAPSE_SOURCES = new Set(["hpd-735-firecracker-lapse-export", "hpd-735-firecracker-lapse"]);

export const lapseNoticeDismissedStorageKey = "hey-hermes.lapse-notice.dismissed.v1";

function httpsOnly(value: string | null): string | null {
  // A string check, not URL: React Native's URL throws on `protocol` (HPD-808).
  return typeof value === "string" && /^https:\/\/[^\s]+$/.test(value) ? value : null;
}

export function mobileLapseNotice(
  notifications: readonly NotificationRecord[] | null | undefined,
  now: Date,
  dismissedIds: readonly string[],
): MobileLapseNotice | null {
  const candidates = (notifications ?? []).filter((item) => {
    if (item.channel !== "in_app" || item.kind !== "account_lifecycle") return false;
    if (item.status !== "unread" || item.dismissedAt) return false;
    if (!LAPSE_SOURCES.has(String(item.metadata?.source ?? ""))) return false;
    if (dismissedIds.includes(item.id)) return false;
    const expiresAt = Date.parse(String(item.metadata?.expiresAt ?? ""));
    return !Number.isFinite(expiresAt) || expiresAt > now.getTime();
  });
  const newest = candidates.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))[0];
  return newest
    ? { id: newest.id, title: newest.title, body: newest.body, actionUrl: httpsOnly(newest.actionUrl) }
    : null;
}
