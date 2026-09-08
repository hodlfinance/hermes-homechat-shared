export const GUIDED_SETUP_SCHEMA_VERSION = "heyhermes.guided-setup/v3" as const;

export const guidedSetupConnectionOrder = ["gmail", "ai_access", "telegram"] as const;
export const guidedSetupPluginStatuses = [
  "available",
  "authorization_required",
  "setup_incomplete",
  "added",
  "attention",
] as const;
export const guidedSetupAiAccessStatuses = [
  "unknown",
  "available",
  "configured",
  "attention",
  "unavailable",
] as const;

export type GuidedSetupConnectionId = (typeof guidedSetupConnectionOrder)[number];
export type GuidedSetupPluginConnectionId = Exclude<GuidedSetupConnectionId, "ai_access">;
export type GuidedSetupPluginStatus = (typeof guidedSetupPluginStatuses)[number];
export type GuidedSetupAiAccessStatus = (typeof guidedSetupAiAccessStatuses)[number];
export type GuidedSetupConnectionStatus = GuidedSetupPluginStatus | GuidedSetupAiAccessStatus;
export type GuidedSetupConnectionChoice = "undecided" | "declined" | "selected";
export type GuidedSetupRecommendedConnectionState = "available" | "snoozed" | "dismissed" | "connected";

interface GuidedSetupConnectionInputBase {
  /** A user choice is navigation intent only. It is never connection evidence. */
  readonly choice: GuidedSetupConnectionChoice;
}

export interface GuidedSetupPluginConnectionInput extends GuidedSetupConnectionInputBase {
  readonly id: GuidedSetupPluginConnectionId;
  /** Exact caller-owned HPD-291 Plugins status; this contract never derives or promotes it. */
  readonly status: GuidedSetupPluginStatus;
}

export interface GuidedSetupAiAccessInput extends GuidedSetupConnectionInputBase {
  readonly id: "ai_access";
  /** Caller-owned AI Access truth; this contract never infers it from a selected route. */
  readonly status: GuidedSetupAiAccessStatus;
}

export type GuidedSetupConnectionInput = GuidedSetupPluginConnectionInput | GuidedSetupAiAccessInput;

export interface GuidedSetupPluginConnection extends GuidedSetupPluginConnectionInput {
  readonly optional: true;
  readonly target: Readonly<{
    surface: "plugins";
    itemId: GuidedSetupPluginConnectionId;
  }>;
}

export interface GuidedSetupAiAccessConnection extends GuidedSetupAiAccessInput {
  readonly optional: true;
  readonly target: Readonly<{
    surface: "ai_access";
  }>;
}

export type GuidedSetupConnection = GuidedSetupPluginConnection | GuidedSetupAiAccessConnection;

export interface GuidedSetupRecommendedConnection {
  readonly id: "gmail";
  readonly status: GuidedSetupPluginStatus;
  readonly state: GuidedSetupRecommendedConnectionState;
  readonly showCard: boolean;
  readonly showMenuEntry: boolean;
  readonly snoozedUntil: string | null;
}

export interface GuidedSetupState {
  readonly schemaVersion: typeof GUIDED_SETUP_SCHEMA_VERSION;
  /** Explicitly dismisses the optional guidance without changing any connection or AI route. */
  readonly skipped: boolean;
  readonly placement: Readonly<{
    homeChat: "top_after_first_conversation";
  }>;
  /**
   * The proactive Home Chat recommendation is Gmail-only. Its visibility is
   * separate from the full manual Connections catalog and from navigation
   * intent recorded by the earlier multi-item guidance.
   */
  readonly recommendedConnection: GuidedSetupRecommendedConnection;
  readonly connections: readonly GuidedSetupConnection[];
}

const connectionIds = new Set<string>(guidedSetupConnectionOrder);
const pluginStatuses = new Set<GuidedSetupPluginStatus>(guidedSetupPluginStatuses);
const aiAccessStatuses = new Set<GuidedSetupAiAccessStatus>(guidedSetupAiAccessStatuses);
const connectionChoices = new Set<GuidedSetupConnectionChoice>(["undecided", "declined", "selected"]);

export class GuidedSetupContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuidedSetupContractError";
  }
}

function validateStatus(connection: GuidedSetupConnectionInput) {
  if (connection.id === "ai_access") {
    if (!aiAccessStatuses.has(connection.status)) {
      throw new GuidedSetupContractError("Guided setup AI Access status is unsupported.");
    }
    return;
  }
  if (!pluginStatuses.has(connection.status)) {
    throw new GuidedSetupContractError(`Guided setup Plugins status is unsupported for ${connection.id}.`);
  }
}

function connectionWithTarget(connection: GuidedSetupConnectionInput): GuidedSetupConnection {
  if (connection.id === "ai_access") {
    return Object.freeze({
      id: connection.id,
      status: connection.status,
      choice: connection.choice,
      optional: true as const,
      target: Object.freeze({ surface: "ai_access" as const }),
    });
  }
  return Object.freeze({
    id: connection.id,
    status: connection.status,
    choice: connection.choice,
    optional: true as const,
    target: Object.freeze({ surface: "plugins" as const, itemId: connection.id }),
  });
}

function validTimestamp(value: string, field: string) {
  if (!value.trim() || !Number.isFinite(Date.parse(value))) {
    throw new GuidedSetupContractError(`${field} must be an ISO timestamp.`);
  }
  return value;
}

function gmailRecommendation(input: {
  gmail: GuidedSetupPluginConnectionInput;
  preference?: Readonly<{
    dismissed: boolean;
    now: string;
    snoozedUntil: string | null;
  }>;
}): GuidedSetupRecommendedConnection {
  const connected = input.gmail.status === "added";
  const preference = input.preference;
  if (preference && typeof preference.dismissed !== "boolean") {
    throw new GuidedSetupContractError("Gmail recommendation dismissal must be a boolean.");
  }
  const now = preference ? validTimestamp(preference.now, "Gmail recommendation now") : null;
  const snoozedUntil = preference?.snoozedUntil === null || preference?.snoozedUntil === undefined
    ? null
    : validTimestamp(preference.snoozedUntil, "Gmail recommendation snooze");
  const snoozed = Boolean(now && snoozedUntil && Date.parse(snoozedUntil) > Date.parse(now));
  const state: GuidedSetupRecommendedConnectionState = connected
    ? "connected"
    : preference?.dismissed
      ? "dismissed"
      : snoozed
        ? "snoozed"
        : "available";

  return Object.freeze({
    id: "gmail" as const,
    status: input.gmail.status,
    state,
    showCard: state === "available",
    // Snooze and No thanks hide only the proactive card. The explicit menu
    // route remains until the provider truth says Gmail is actually connected.
    showMenuEntry: state !== "connected",
    snoozedUntil: snoozed ? snoozedUntil : null,
  });
}

/**
 * Builds the immutable optional guidance shown at the top of Home Chat after
 * the real first conversation. Gmail and Telegram hand off to their stable
 * Plugins items; AI Access remains its direct product surface. Suggestions is
 * deliberately not a consumer after the HPD-289 navigation simplification.
 *
 * Callers supply all status truth and user choices. This function only
 * validates, orders, targets, and freezes that data. It cannot connect a
 * provider, promote a status, create a task, call a network, or mutate state.
 */
export function createGuidedSetupState(input: {
  readonly skipped: boolean;
  readonly connections: readonly GuidedSetupConnectionInput[];
  readonly gmailRecommendation?: Readonly<{
    dismissed: boolean;
    now: string;
    snoozedUntil: string | null;
  }>;
}): GuidedSetupState {
  if (!input || typeof input !== "object") {
    throw new GuidedSetupContractError("Guided setup input must be an object.");
  }
  if (typeof input.skipped !== "boolean") {
    throw new GuidedSetupContractError("Guided setup skipped state must be a boolean.");
  }
  if (!Array.isArray(input.connections)) {
    throw new GuidedSetupContractError("Guided setup connections must be an array.");
  }

  const supplied = new Map<GuidedSetupConnectionId, GuidedSetupConnectionInput>();
  for (const connection of input.connections) {
    if (!connection || typeof connection !== "object" || !connectionIds.has(connection.id)) {
      throw new GuidedSetupContractError(
        `Guided setup connection is unsupported: ${String(connection && typeof connection === "object" ? connection.id : connection)}.`,
      );
    }
    if (supplied.has(connection.id)) {
      throw new GuidedSetupContractError(`Guided setup connection is duplicated: ${connection.id}.`);
    }
    if (!connectionChoices.has(connection.choice)) {
      throw new GuidedSetupContractError(`Guided setup choice is unsupported for ${connection.id}.`);
    }
    validateStatus(connection);
    supplied.set(connection.id, connection);
  }

  const connections = guidedSetupConnectionOrder.map((id) => {
    const connection = supplied.get(id);
    if (!connection) throw new GuidedSetupContractError(`Guided setup connection is missing: ${id}.`);
    return connectionWithTarget(connection);
  });
  const gmail = supplied.get("gmail");
  if (!gmail || gmail.id !== "gmail") {
    throw new GuidedSetupContractError("Guided setup Gmail connection is missing.");
  }

  return Object.freeze({
    schemaVersion: GUIDED_SETUP_SCHEMA_VERSION,
    skipped: input.skipped,
    placement: Object.freeze({ homeChat: "top_after_first_conversation" as const }),
    recommendedConnection: gmailRecommendation({ gmail, preference: input.gmailRecommendation }),
    connections: Object.freeze(connections),
  });
}
