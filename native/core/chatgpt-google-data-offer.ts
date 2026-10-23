/**
 * HPD-1498 / HPD-1521 (Justus, 2026-10-23): the switch "my ChatGPT may also see
 * Gmail, Calendar and Drive data" starts off (opt-in). It is offered once it
 * matters: the own ChatGPT account is connected and at least one of Gmail,
 * Calendar or Drive is connected, in either order. A short prompt recommends
 * turning it on; the customer decides. A stored choice (on or off) always wins,
 * and "Not now" hides the prompt until a Google service that was not connected
 * at that moment is connected.
 *
 * Shared by the web and the app, so both offer it at the same moment.
 */
export const chatGptGoogleServices = ["gmail", "calendar", "drive"] as const;
export type ChatGptGoogleService = (typeof chatGptGoogleServices)[number];

export type ChatGptGoogleDataConsentView = {
  allowed: boolean;
  changedAt: string | null;
  /** The Google services connected when the customer last chose "Not now". */
  promptDismissedFor?: readonly string[] | null;
} | null | undefined;

// Plugin catalog ids for the three Google services.
const catalogIds: Record<string, ChatGptGoogleService> = {
  gmail: "gmail",
  calendar: "calendar",
  google_calendar: "calendar",
  google_drive: "drive",
};

/**
 * The Google services the customer has connected, from what the screen already
 * holds: the guided-setup Gmail row and, once loaded, the plugin catalog.
 * Only "added" counts; a started or broken setup is not a connection.
 */
export function connectedGoogleServicesFrom(input: {
  guidedSetup?: { readonly connections?: ReadonlyArray<{ readonly id: string; readonly status: string }> } | null;
  pluginCatalog?: { readonly items?: ReadonlyArray<{ readonly id: string; readonly status: string }> } | null;
}): ChatGptGoogleService[] {
  const found = new Set<ChatGptGoogleService>();
  for (const connection of input.guidedSetup?.connections ?? []) {
    if (connection.id === "gmail" && connection.status === "added") found.add("gmail");
  }
  for (const item of input.pluginCatalog?.items ?? []) {
    const service = catalogIds[item.id];
    if (service && item.status === "added") found.add(service);
  }
  return chatGptGoogleServices.filter((service) => found.has(service));
}

/** Whether the prompt is shown now. Unreadable consent shows nothing. */
export function chatGptGoogleDataPromptVisible(input: {
  chatGptOffered: boolean;
  chatGptConnected: boolean;
  consent: ChatGptGoogleDataConsentView;
  connectedServices: readonly ChatGptGoogleService[];
}): boolean {
  if (!input.chatGptOffered || !input.chatGptConnected || !input.consent) return false;
  if (input.consent.changedAt) return false;
  const dismissedFor = new Set(input.consent.promptDismissedFor ?? []);
  return input.connectedServices.some((service) => !dismissedFor.has(service));
}
