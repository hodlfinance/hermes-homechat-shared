export const SHARED_SUGGESTIONS_CATALOG_SCHEMA = "hermes.suggestions.catalog/v1" as const;
export const SHARED_SUGGESTIONS_STATE_SCHEMA = "hermes.suggestions.state/v1" as const;
export const SHARED_SUGGESTIONS_ROLLING_WINDOW_MS = 24 * 60 * 60 * 1_000;
export const SHARED_SUGGESTIONS_SAME_ID_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1_000;

export type SharedSuggestionProgress = "new" | "shown" | "tried" | "completed";
export type SharedSuggestionPromotion = "eligible" | "dismissed";

export type SharedSuggestionScope = {
  accountId: string;
  productId: string;
  workspaceId: string;
};

export type SharedSuggestionTarget =
  | { connectionId: string; kind: "connection" }
  | { kind: "ai_access"; providerId: string }
  | { capabilityId: string; kind: "capability" }
  | { draftId: string; kind: "editable_draft" };

export type SharedSuggestionCatalogEntry = {
  active: boolean;
  categoryId: string;
  id: string;
  priority: number;
  target: SharedSuggestionTarget;
};

export type SharedSuggestionCatalog = {
  catalogVersion: string;
  entries: SharedSuggestionCatalogEntry[];
  productId: string;
  schemaVersion: typeof SHARED_SUGGESTIONS_CATALOG_SCHEMA;
};

export type SharedSuggestionState = {
  completedAt: string | null;
  lastAutomaticPlacementAt: string | null;
  lastDismissedAt: string | null;
  progress: SharedSuggestionProgress;
  promotion: SharedSuggestionPromotion;
  schemaVersion: typeof SHARED_SUGGESTIONS_STATE_SCHEMA;
  scope: SharedSuggestionScope;
  startedAt: string | null;
  suggestionId: string;
};

export type SharedSuggestionTransition =
  | { at: string; type: "top_shown" }
  | { at: string; type: "started" }
  | { at: string; type: "completed" }
  | { at: string; type: "dismissed" }
  | { at: string; type: "restored" };

export type SharedSuggestionEligibilityFact = {
  eligible: boolean;
  relevance: number;
  suggestionId: string;
};

export type SharedSuggestionSelectionContext = {
  activeRun: boolean;
  eligibility: readonly SharedSuggestionEligibilityFact[];
  higherPriorityNotice: boolean;
  now: string;
  sessionNudgeAlreadyPlaced: boolean;
};

export type SharedSuggestionSuppressionReason =
  | "active_run"
  | "higher_priority_notice"
  | "session_already_nudged"
  | "rolling_24h";

export type SharedSuggestionNoneEligibleReason =
  | "no_active_entries"
  | "no_product_eligible_entries"
  | "all_entries_excluded";

export type SharedSuggestionSelectionResult =
  | {
      entry: SharedSuggestionCatalogEntry;
      kind: "selected";
      nextState: SharedSuggestionState;
      reason: "selected";
    }
  | {
      kind: "suppressed";
      reason: SharedSuggestionSuppressionReason;
    }
  | {
      kind: "none_eligible";
      reason: SharedSuggestionNoneEligibleReason;
    };

export type SharedSuggestionsContractErrorCode =
  | "duplicate_suggestion_id"
  | "invalid_number"
  | "invalid_schema_version"
  | "invalid_shape"
  | "invalid_stable_id"
  | "invalid_timestamp"
  | "invalid_transition"
  | "scope_mismatch"
  | "unknown_suggestion_id";

export class SharedSuggestionsContractError extends Error {
  constructor(
    public readonly code: SharedSuggestionsContractErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SharedSuggestionsContractError";
  }
}

const STABLE_ID = /^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/;
const PROGRESS = new Set<SharedSuggestionProgress>(["new", "shown", "tried", "completed"]);
const PROMOTION = new Set<SharedSuggestionPromotion>(["eligible", "dismissed"]);

function contractError(code: SharedSuggestionsContractErrorCode, message: string): never {
  throw new SharedSuggestionsContractError(code, message);
}

function objectValue(input: unknown, name: string): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    contractError("invalid_shape", `${name} must be an object`);
  }
  return input as Record<string, unknown>;
}

function requiredString(input: unknown, name: string, maxLength = 256): string {
  if (typeof input !== "string" || input.length === 0 || input.length > maxLength) {
    contractError("invalid_shape", `${name} must be a non-empty string of at most ${maxLength} characters`);
  }
  return input;
}

function stableId(input: unknown, name: string): string {
  const value = requiredString(input, name, 128);
  if (!STABLE_ID.test(value)) contractError("invalid_stable_id", `${name} is not a stable ID`);
  return value;
}

function timestamp(input: unknown, name: string, nullable = false): string | null {
  if (input === null && nullable) return null;
  const value = requiredString(input, name);
  if (!Number.isFinite(Date.parse(value))) contractError("invalid_timestamp", `${name} is not an ISO timestamp`);
  return value;
}

function booleanValue(input: unknown, name: string): boolean {
  if (typeof input !== "boolean") contractError("invalid_shape", `${name} must be a boolean`);
  return input;
}

function integerValue(input: unknown, name: string): number {
  if (typeof input !== "number" || !Number.isSafeInteger(input)) {
    contractError("invalid_number", `${name} must be a safe integer`);
  }
  return input;
}

function finiteNumber(input: unknown, name: string): number {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    contractError("invalid_number", `${name} must be finite`);
  }
  return input;
}

export function parseSharedSuggestionScope(input: unknown): SharedSuggestionScope {
  const value = objectValue(input, "scope");
  return {
    accountId: requiredString(value.accountId, "scope.accountId"),
    productId: stableId(value.productId, "scope.productId"),
    workspaceId: requiredString(value.workspaceId, "scope.workspaceId"),
  };
}

function parseTarget(input: unknown): SharedSuggestionTarget {
  const value = objectValue(input, "entry.target");
  switch (value.kind) {
    case "connection":
      return { connectionId: stableId(value.connectionId, "target.connectionId"), kind: "connection" };
    case "ai_access":
      return { kind: "ai_access", providerId: stableId(value.providerId, "target.providerId") };
    case "capability":
      return { capabilityId: stableId(value.capabilityId, "target.capabilityId"), kind: "capability" };
    case "editable_draft":
      return { draftId: stableId(value.draftId, "target.draftId"), kind: "editable_draft" };
    default:
      return contractError("invalid_shape", "entry.target.kind is unsupported");
  }
}

export function parseSharedSuggestionCatalog(input: unknown): SharedSuggestionCatalog {
  const value = objectValue(input, "catalog");
  if (value.schemaVersion !== SHARED_SUGGESTIONS_CATALOG_SCHEMA) {
    contractError("invalid_schema_version", "catalog.schemaVersion is unsupported");
  }
  if (!Array.isArray(value.entries)) contractError("invalid_shape", "catalog.entries must be an array");
  const ids = new Set<string>();
  const entries = value.entries.map((inputEntry, index): SharedSuggestionCatalogEntry => {
    const entry = objectValue(inputEntry, `catalog.entries[${index}]`);
    const id = stableId(entry.id, `catalog.entries[${index}].id`);
    if (ids.has(id)) contractError("duplicate_suggestion_id", `catalog contains duplicate ID ${id}`);
    ids.add(id);
    return {
      active: booleanValue(entry.active, `catalog.entries[${index}].active`),
      categoryId: stableId(entry.categoryId, `catalog.entries[${index}].categoryId`),
      id,
      priority: integerValue(entry.priority, `catalog.entries[${index}].priority`),
      target: parseTarget(entry.target),
    };
  });
  return {
    catalogVersion: stableId(value.catalogVersion, "catalog.catalogVersion"),
    entries,
    productId: stableId(value.productId, "catalog.productId"),
    schemaVersion: SHARED_SUGGESTIONS_CATALOG_SCHEMA,
  };
}

export function parseSharedSuggestionState(input: unknown): SharedSuggestionState {
  const value = objectValue(input, "state");
  if (value.schemaVersion !== SHARED_SUGGESTIONS_STATE_SCHEMA) {
    contractError("invalid_schema_version", "state.schemaVersion is unsupported");
  }
  if (!PROGRESS.has(value.progress as SharedSuggestionProgress)) {
    contractError("invalid_shape", "state.progress is unsupported");
  }
  if (!PROMOTION.has(value.promotion as SharedSuggestionPromotion)) {
    contractError("invalid_shape", "state.promotion is unsupported");
  }
  const state: SharedSuggestionState = {
    completedAt: timestamp(value.completedAt, "state.completedAt", true),
    lastAutomaticPlacementAt: timestamp(value.lastAutomaticPlacementAt, "state.lastAutomaticPlacementAt", true),
    lastDismissedAt: timestamp(value.lastDismissedAt, "state.lastDismissedAt", true),
    progress: value.progress as SharedSuggestionProgress,
    promotion: value.promotion as SharedSuggestionPromotion,
    schemaVersion: SHARED_SUGGESTIONS_STATE_SCHEMA,
    scope: parseSharedSuggestionScope(value.scope),
    startedAt: timestamp(value.startedAt, "state.startedAt", true),
    suggestionId: stableId(value.suggestionId, "state.suggestionId"),
  };
  if (state.progress === "shown" && !state.lastAutomaticPlacementAt) {
    contractError("invalid_shape", "shown state requires lastAutomaticPlacementAt");
  }
  if (state.progress === "new" && (state.lastAutomaticPlacementAt || state.startedAt || state.completedAt)) {
    contractError("invalid_shape", "new state cannot contain placement, start, or completion timestamps");
  }
  if (state.progress === "shown" && (state.startedAt || state.completedAt)) {
    contractError("invalid_shape", "shown state cannot contain start or completion timestamps");
  }
  if (state.progress === "tried" && !state.startedAt) {
    contractError("invalid_shape", "tried state requires startedAt");
  }
  if (state.progress === "tried" && state.completedAt) {
    contractError("invalid_shape", "tried state cannot contain completedAt");
  }
  if (state.progress === "completed" && !state.completedAt) {
    contractError("invalid_shape", "completed state requires completedAt");
  }
  return state;
}

export function sharedSuggestionScopesMatch(left: SharedSuggestionScope, right: SharedSuggestionScope): boolean {
  return left.productId === right.productId
    && left.accountId === right.accountId
    && left.workspaceId === right.workspaceId;
}

function requireScopeMatch(expected: SharedSuggestionScope, actual: SharedSuggestionScope, label: string): void {
  if (!sharedSuggestionScopesMatch(expected, actual)) {
    contractError("scope_mismatch", `${label} is outside the exact product/account/workspace scope`);
  }
}

export function createSharedSuggestionState(
  scopeInput: SharedSuggestionScope,
  suggestionIdInput: string,
): SharedSuggestionState {
  const scope = parseSharedSuggestionScope(scopeInput);
  return {
    completedAt: null,
    lastAutomaticPlacementAt: null,
    lastDismissedAt: null,
    progress: "new",
    promotion: "eligible",
    schemaVersion: SHARED_SUGGESTIONS_STATE_SCHEMA,
    scope,
    startedAt: null,
    suggestionId: stableId(suggestionIdInput, "suggestionId"),
  };
}

export function transitionSharedSuggestionState(
  stateInput: SharedSuggestionState,
  transition: SharedSuggestionTransition,
): SharedSuggestionState {
  const state = parseSharedSuggestionState(stateInput);
  const at = timestamp(transition.at, "transition.at")!;
  switch (transition.type) {
    case "top_shown":
      if (state.promotion === "dismissed" || state.progress === "completed") {
        contractError("invalid_transition", "dismissed or completed suggestions cannot be automatically shown");
      }
      return {
        ...state,
        lastAutomaticPlacementAt: at,
        progress: state.progress === "new" ? "shown" : state.progress,
      };
    case "started":
      if (state.progress === "completed") {
        contractError("invalid_transition", "completed suggestions cannot return to tried");
      }
      return { ...state, progress: "tried", startedAt: at };
    case "completed":
      return { ...state, completedAt: at, progress: "completed" };
    case "dismissed":
      return { ...state, lastDismissedAt: at, promotion: "dismissed" };
    case "restored":
      return { ...state, promotion: "eligible" };
  }
}

function milliseconds(value: string): number {
  return Date.parse(timestamp(value, "timestamp")!);
}

function parseEligibility(
  facts: readonly SharedSuggestionEligibilityFact[],
  catalogIds: ReadonlySet<string>,
): Map<string, SharedSuggestionEligibilityFact> {
  if (!Array.isArray(facts)) contractError("invalid_shape", "context.eligibility must be an array");
  const parsed = new Map<string, SharedSuggestionEligibilityFact>();
  for (const [index, input] of facts.entries()) {
    const value = objectValue(input, `context.eligibility[${index}]`);
    const suggestionId = stableId(value.suggestionId, `context.eligibility[${index}].suggestionId`);
    if (!catalogIds.has(suggestionId)) {
      contractError("unknown_suggestion_id", `eligibility references unknown suggestion ${suggestionId}`);
    }
    if (parsed.has(suggestionId)) {
      contractError("duplicate_suggestion_id", `eligibility contains duplicate ID ${suggestionId}`);
    }
    parsed.set(suggestionId, {
      eligible: booleanValue(value.eligible, `context.eligibility[${index}].eligible`),
      relevance: finiteNumber(value.relevance, `context.eligibility[${index}].relevance`),
      suggestionId,
    });
  }
  return parsed;
}

export function selectSharedSuggestion(input: {
  catalog: SharedSuggestionCatalog;
  context: SharedSuggestionSelectionContext;
  scope: SharedSuggestionScope;
  states: readonly SharedSuggestionState[];
}): SharedSuggestionSelectionResult {
  const scope = parseSharedSuggestionScope(input.scope);
  const catalog = parseSharedSuggestionCatalog(input.catalog);
  if (catalog.productId !== scope.productId) {
    contractError("scope_mismatch", "catalog is outside the exact product scope");
  }
  if (!input.context || typeof input.context !== "object") {
    contractError("invalid_shape", "context must be an object");
  }
  const now = milliseconds(input.context.now);
  const activeRun = booleanValue(input.context.activeRun, "context.activeRun");
  const higherPriorityNotice = booleanValue(input.context.higherPriorityNotice, "context.higherPriorityNotice");
  const sessionNudgeAlreadyPlaced = booleanValue(
    input.context.sessionNudgeAlreadyPlaced,
    "context.sessionNudgeAlreadyPlaced",
  );
  const activeEntries = catalog.entries.filter((entry) => entry.active);
  if (activeEntries.length === 0) return { kind: "none_eligible", reason: "no_active_entries" };

  const catalogIds = new Set(catalog.entries.map((entry) => entry.id));
  const eligibility = parseEligibility(input.context.eligibility, catalogIds);
  const states = new Map<string, SharedSuggestionState>();
  if (!Array.isArray(input.states)) contractError("invalid_shape", "states must be an array");
  for (const inputState of input.states) {
    const state = parseSharedSuggestionState(inputState);
    requireScopeMatch(scope, state.scope, `state ${state.suggestionId}`);
    if (!catalogIds.has(state.suggestionId)) {
      contractError("unknown_suggestion_id", `state references unknown suggestion ${state.suggestionId}`);
    }
    if (states.has(state.suggestionId)) {
      contractError("duplicate_suggestion_id", `states contain duplicate ID ${state.suggestionId}`);
    }
    states.set(state.suggestionId, state);
  }

  if (activeRun) return { kind: "suppressed", reason: "active_run" };
  if (higherPriorityNotice) return { kind: "suppressed", reason: "higher_priority_notice" };
  if (sessionNudgeAlreadyPlaced) return { kind: "suppressed", reason: "session_already_nudged" };

  const latestPlacement = [...states.values()]
    .map((state) => state.lastAutomaticPlacementAt ? milliseconds(state.lastAutomaticPlacementAt) : Number.NEGATIVE_INFINITY)
    .reduce((latest, placedAt) => Math.max(latest, placedAt), Number.NEGATIVE_INFINITY);
  if (now - latestPlacement < SHARED_SUGGESTIONS_ROLLING_WINDOW_MS) {
    return { kind: "suppressed", reason: "rolling_24h" };
  }

  const productEligible = activeEntries.filter((entry) => eligibility.get(entry.id)?.eligible === true);
  if (productEligible.length === 0) {
    return { kind: "none_eligible", reason: "no_product_eligible_entries" };
  }

  const candidates = productEligible.filter((entry) => {
    const state = states.get(entry.id);
    if (!state) return true;
    if (state.promotion === "dismissed" || state.progress === "completed") return false;
    if (!state.lastAutomaticPlacementAt) return true;
    return now - milliseconds(state.lastAutomaticPlacementAt) >= SHARED_SUGGESTIONS_SAME_ID_COOLDOWN_MS;
  });
  if (candidates.length === 0) return { kind: "none_eligible", reason: "all_entries_excluded" };

  candidates.sort((left, right) => {
    const relevance = eligibility.get(right.id)!.relevance - eligibility.get(left.id)!.relevance;
    if (relevance !== 0) return relevance;
    if (left.priority !== right.priority) return right.priority - left.priority;
    const leftPlaced = states.get(left.id)?.lastAutomaticPlacementAt;
    const rightPlaced = states.get(right.id)?.lastAutomaticPlacementAt;
    const recency = (leftPlaced ? milliseconds(leftPlaced) : Number.NEGATIVE_INFINITY)
      - (rightPlaced ? milliseconds(rightPlaced) : Number.NEGATIVE_INFINITY);
    if (recency !== 0) return recency;
    return left.id.localeCompare(right.id);
  });
  const entry = candidates[0]!;
  const state = states.get(entry.id) ?? createSharedSuggestionState(scope, entry.id);
  return {
    entry,
    kind: "selected",
    nextState: transitionSharedSuggestionState(state, { at: input.context.now, type: "top_shown" }),
    reason: "selected",
  };
}
