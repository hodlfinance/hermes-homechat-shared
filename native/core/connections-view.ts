import type { ConnectionReachId, ConnectionReachItem, ConnectionReachView } from "./types";

export type ConnectionRowState = "not_set_up" | "set_up" | "reached";

export type ConnectionRowView = {
  id: ConnectionReachId;
  label: string;
  state: "not_set_up" | "set_up" | "reached";
  line: string;
  badge: "Not set up" | "Set up" | "Reached" | "Unavailable";
};

const providers: ReadonlyArray<{ id: ConnectionReachId; label: string }> = [
  { id: "gmail", label: "Gmail" },
  { id: "google_calendar", label: "Google Calendar" },
  { id: "google_drive", label: "Google Drive" },
  { id: "telegram", label: "Telegram" },
];

const missingConnectionPattern = /noch nicht eingerichtet|not (?:configured|set up)|bot token format|save (?:a |the )?bot token/i;

function stateFor(item: ConnectionReachItem): ConnectionRowState {
  if (item.reached && item.reachedAt && item.evidenceRef && Number.isFinite(Date.parse(item.reachedAt))) return "reached";
  return missingConnectionPattern.test(item.reason || "") ? "not_set_up" : "set_up";
}

function reachedLine(item: ConnectionReachItem, now: Date) {
  const reachedAt = new Date(item.reachedAt as string);
  const sameDay = reachedAt.getFullYear() === now.getFullYear()
    && reachedAt.getMonth() === now.getMonth()
    && reachedAt.getDate() === now.getDate();
  const time = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(reachedAt);
  const date = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }).format(reachedAt);
  const reached = `Reached ${sameDay ? `at ${time}` : `on ${date} at ${time}`}`;
  return item.lastRead ? `${reached}. Last read: ${item.lastRead}` : reached;
}

export function connectionRows(view: ConnectionReachView, now: Date): ConnectionRowView[] {
  const providerItems = providers.map(({ id }) => view.items.filter((candidate) => candidate.id === id));
  if (providerItems.some((items) => items.length !== 1)) return [];

  return providers.map(({ id, label }, index) => {
    const item = providerItems[index]?.[0] as ConnectionReachItem;
    const state = stateFor(item);
    if (state === "not_set_up") return { id, label, state, line: "Not set up", badge: "Not set up" };
    if (state === "reached") return { id, label, state, line: reachedLine(item, now), badge: "Reached" };
    if (/Maschine|machine/i.test(item.reason || "")) {
      return { id, label, state, line: item.reason as string, badge: "Unavailable" };
    }
    return { id, label, state, line: item.reason ? `Set up — ${item.reason}` : "Set up", badge: "Set up" };
  });
}
