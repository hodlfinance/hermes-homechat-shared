import type { AppLocale } from "./types";

/**
 * HPD-1097 (Hey Hermes spec "Browser-Übernahme auf dem iPhone wie bei Grok",
 * 3.1): when Hermes' answer carries its browser takeover link, the app shows
 * a "Computer" card instead of a text link. The link text is the task on the
 * card; the card's button follows the browser session.
 */
export type BrowserTakeoverCardPart =
  | { kind: "text"; text: string }
  | { kind: "card"; task: string; href: string; sessionId: string };

export type BrowserTakeoverCardState = "open" | "done" | "ended";

const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const takeoverPath = `/api/workspace/preview/4321/browser/(${uuid})`;
const fencePattern = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Splits assistant Markdown into text and "Computer" cards. Only an exact
 * takeover link becomes a card: a Markdown link (destination optionally in
 * angle brackets), relative or on the product's own origin. Fenced code stays
 * text. Anything else (foreign origin, query, fragment, extra path) is left
 * exactly as it was.
 */
export function browserTakeoverCardParts(markdown: string, apiBase: string): BrowserTakeoverCardPart[] {
  const origin = apiBase.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
  const prefix = /^https:\/\/[^/?#]+$/i.test(origin) ? `(?:${escapeRegExp(origin)})?` : "";
  const link = new RegExp(`\\[([^\\]\\n]+)\\]\\(<?(${prefix}${takeoverPath})>?\\)`, "g");
  const parts: BrowserTakeoverCardPart[] = [];
  const pushText = (text: string) => {
    if (!text) return;
    const last = parts.at(-1);
    if (last?.kind === "text") last.text += text;
    else parts.push({ kind: "text", text });
  };
  for (const chunk of markdown.split(fencePattern)) {
    if (chunk.startsWith("```") || chunk.startsWith("~~~")) { pushText(chunk); continue; }
    let cursor = 0;
    for (const match of chunk.matchAll(link)) {
      pushText(chunk.slice(cursor, match.index));
      parts.push({ kind: "card", task: (match[1] ?? "").trim(), href: match[2] ?? "", sessionId: match[3] ?? "" });
      cursor = (match.index ?? 0) + match[0].length;
    }
    pushText(chunk.slice(cursor));
  }
  return parts.map((part): BrowserTakeoverCardPart => part.kind === "text" ? { kind: "text", text: part.text.replace(/[ \t]+$/gm, "") } : part)
    .filter((part) => part.kind === "card" || part.text.trim());
}

/** Card state from one status read: gone or expired ends it; a hand-back makes it done. */
export function browserTakeoverCardState(status: number, body: unknown): BrowserTakeoverCardState {
  if (status === 404 || status === 410) return "ended";
  const data = body !== null && typeof body === "object" ? body as Record<string, unknown> : {};
  if (status >= 200 && status < 300 && data.handedBack === true && data.controlOwner === "agent") return "done";
  return "open";
}

export function browserTakeoverCardCopy(locale: AppLocale) {
  return locale === "de" ? {
    title: "Computer",
    notice: "Wenn du dich anmeldest, tust du das im Browser auf Hermes' Computer. Die Anmeldung bleibt dort gespeichert. Dein Anbieter schickt dir eventuell eine Warnung über ein neues Gerät.",
    open: "Computer öffnen",
    done: "✓ Erledigt",
    ended: "Beendet",
  } : {
    title: "Computer",
    notice: "If you sign in, you do it in the browser on Hermes' computer. The sign-in stays saved there. Your provider may send you a warning about a new device.",
    open: "Open computer",
    done: "✓ Done",
    ended: "Ended",
  };
}
