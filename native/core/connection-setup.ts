export const connectionSetupOrigins = [
  "connections_row",
  "connection_detail",
  "connections_search",
] as const;

export type ConnectionSetupOrigin = (typeof connectionSetupOrigins)[number];

export type ConnectionSetupProviderId =
  | "gmail"
  | "google_workspace"
  | "telegram"
  | "whatsapp"
  | "slack"
  | "discord";

export interface PluginConnectionSetupMetadata {
  providerId: ConnectionSetupProviderId;
  recipeId: string;
  recipeVersion: number;
}

export interface ConnectionSetupIntent extends PluginConnectionSetupMetadata {
  type: "connection_setup";
  catalogItemId: string;
  origin: ConnectionSetupOrigin;
  conversationSessionId: string;
}

const connectionSetupMetadata = {
  gmail: { providerId: "gmail", recipeId: "gmail_builtin_oauth", recipeVersion: 1 },
  telegram: { providerId: "telegram", recipeId: "telegram_workspace_bot", recipeVersion: 1 },
  calendar: { providerId: "google_workspace", recipeId: "google_calendar", recipeVersion: 1 },
  google_drive: { providerId: "google_workspace", recipeId: "google_drive", recipeVersion: 1 },
  whatsapp: { providerId: "whatsapp", recipeId: "whatsapp_cloud", recipeVersion: 1 },
  slack: { providerId: "slack", recipeId: "slack_guided", recipeVersion: 1 },
  discord: { providerId: "discord", recipeId: "discord_guided", recipeVersion: 1 },
} as const satisfies Record<string, PluginConnectionSetupMetadata>;

export function connectionSetupMetadataForCatalogItem(catalogItemId: string): PluginConnectionSetupMetadata | null {
  return connectionSetupMetadata[catalogItemId as keyof typeof connectionSetupMetadata] ?? null;
}

export function connectionSetupRunRequest(input: {
  catalogItemId: string;
  conversationSessionId: string;
  metadata: PluginConnectionSetupMetadata | null | undefined;
  message: string;
  name: string;
  origin: ConnectionSetupOrigin;
}): {
  message: string;
  conversationSessionId: string;
  connectionSetupIntent: ConnectionSetupIntent;
} | null {
  const catalogItemId = input.catalogItemId.trim();
  const conversationSessionId = input.conversationSessionId.trim();
  const message = input.message.trim();
  const name = input.name.trim();
  const metadata = input.metadata;
  if (
    !catalogItemId || !conversationSessionId || !message || message.length > 2_000 || !name || !metadata ||
    !metadata.providerId || !metadata.recipeId.trim() ||
    !Number.isSafeInteger(metadata.recipeVersion) || metadata.recipeVersion < 1
  ) return null;
  return {
    message,
    conversationSessionId,
    connectionSetupIntent: {
      type: "connection_setup",
      catalogItemId,
      providerId: metadata.providerId,
      recipeId: metadata.recipeId,
      recipeVersion: metadata.recipeVersion,
      origin: input.origin,
      conversationSessionId,
    },
  };
}

/**
 * A connection setup request is a question asked in a moment: may I connect
 * this for you?
 *
 * Measured on ws_NR_n6sWuGl8V on 2026-08-23: one Telegram request created at
 * 2026-08-22T03:27:29.830Z was still "requested" 38 hours later, with
 * updated_at unchanged. Nothing in the plane ever ends a request nobody
 * answered, so every surface that lists open requests kept offering it — in
 * whatever conversation the customer happened to be looking at.
 *
 * A day is the outer edge of "in a moment". After that the question is stale,
 * and asking again is more honest than leaving it standing.
 *
 * The clock runs from when the question was last put, not from when it was
 * first put: creating a request for a provider that already has an open one
 * reuses that row and only moves updated_at, so created_at would retire a
 * question Hermes had just asked again.
 */
export const connectionSetupRequestLifetimeMs = 24 * 60 * 60 * 1000;

export function connectionSetupRequestExpired(input: {
  askedAt: string;
  now: Date;
  status: string;
}): boolean {
  if (input.status !== "requested") return false;
  const asked = Date.parse(input.askedAt);
  if (!Number.isFinite(asked)) return false;
  return input.now.getTime() - asked >= connectionSetupRequestLifetimeMs;
}

/** The instant at which a request created earlier than this has gone stale. */
export function connectionSetupRequestStaleBefore(now: Date): string {
  return new Date(now.getTime() - connectionSetupRequestLifetimeMs).toISOString();
}
