import type { AppLocale } from "../core/index";

/**
 * HPD-1466: a host that lists the chat threads itself (HODL Bots) shows no
 * left menu. Everything the menu offered moves into the "..." of the Home
 * chat's one header row, in the menu's own order.
 */
export type MobileHostHeaderMenuItem =
  | "pages"
  | "newPage"
  | "suggestions"
  | "tasks"
  | "automations"
  | "connections"
  | "ai_access"
  | "account"
  | "support"
  | "privacy"
  | "dashboard"
  | "sign_out";

export function mobileHostHeaderMenuItems(input: { suggestions: boolean; tasks: boolean; signOut: boolean }): MobileHostHeaderMenuItem[] {
  const items: MobileHostHeaderMenuItem[] = ["pages", "newPage"];
  if (input.suggestions) items.push("suggestions");
  if (input.tasks) items.push("tasks");
  items.push("automations", "connections", "ai_access", "account", "support", "privacy", "dashboard");
  if (input.signOut) items.push("sign_out");
  return items;
}

/**
 * The one title of the header row: the thread's name in the chat (Hermes for
 * the Home chat or while no thread is known yet), the page's name elsewhere.
 */
/**
 * HPD-1468: the thread the host opened the chat for (HODL Bots: the row the
 * user tapped). Until the chat has actually switched to it, the header row
 * shows this thread's figure and name instead of whatever thread the surface
 * restored first, so the previous thread never flashes in the header.
 */
export type MobileHostHeaderThread = { conversationId: string | null; home: boolean; title: string };

export function mobileHostHeaderThreadKey(thread: MobileHostHeaderThread): string {
  return thread.home ? "home" : `thread:${thread.conversationId ?? ""}`;
}

/** True once the chat shows the thread the host asked for. */
export function mobileHostHeaderThreadOpened(
  requested: MobileHostHeaderThread,
  active: { id: string; role?: string | null } | null | undefined,
): boolean {
  if (!active) return false;
  return requested.home ? active.role === "home" : active.id === requested.conversationId;
}

export function mobileHostHeaderTitle(input: {
  tab: string;
  session: { role?: string | null; title?: string | null } | null | undefined;
  productName: string;
  screenTitle: string;
}): string {
  if (input.tab !== "chat") return input.screenTitle;
  const session = input.session;
  if (!session || session.role === "home") return input.productName;
  return session.title?.trim() || input.productName;
}

const moreOptions: Record<AppLocale, string> = {
  en: "More options",
  de: "Weitere Optionen",
  fr: "Plus d'options",
  es: "Más opciones",
  it: "Altre opzioni",
  "pt-BR": "Mais opções",
  ja: "その他のオプション",
  ko: "추가 옵션",
};

/** The accessible name of the "..." button in the Home chat's header row. */
export function mobileHostHeaderMoreLabel(locale: AppLocale) {
  return moreOptions[locale] ?? moreOptions.en;
}
