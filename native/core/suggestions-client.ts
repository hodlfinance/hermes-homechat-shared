import type {
  SharedSuggestionCatalog,
  SharedSuggestionScope,
  SharedSuggestionState,
  SharedSuggestionTarget,
} from "./suggestions";

export type HeySuggestionDestination =
  | { surface: "connections"; section: "email" | "messaging" }
  | { surface: "ai_access"; providerId: "chatgpt" | "claude" }
  | { surface: "capability"; capabilityId: "memory" | "pages_apps" | "tasks" }
  | { surface: "home_chat"; draftId: string };

export interface HeySuggestionView {
  active: boolean;
  catalogVersion: string;
  categoryId: string;
  detail: string;
  destination: HeySuggestionDestination;
  id: string;
  label: string;
  locale: string;
  priority: number;
  prompt: string;
  state: SharedSuggestionState;
  target: SharedSuggestionTarget;
}

export interface HeySuggestionsListResponse {
  catalog: SharedSuggestionCatalog;
  catalogVersion: string;
  productId: "hey";
  schemaVersion: "heyhermes.suggestions.list/v1";
  suggestions: HeySuggestionView[];
}

export type HeySuggestionHomeNudgeResult =
  | { kind: "selected"; reason: "selected"; suggestion: HeySuggestionView }
  | { kind: "suppressed"; reason: "active_run" | "higher_priority_notice" | "session_already_nudged" | "rolling_24h" }
  | { kind: "none_eligible"; reason: "no_active_entries" | "no_product_eligible_entries" | "all_entries_excluded" };

export interface HeySuggestionHomeNudgeResponse {
  schemaVersion: "heyhermes.suggestions.home-nudge/v1";
  result: HeySuggestionHomeNudgeResult;
}

export interface HeySuggestionTransitionResponse {
  schemaVersion: "heyhermes.suggestions.state-transition/v1";
  suggestion: HeySuggestionView;
}

export type HeySuggestionTransitionType = "started" | "dismissed" | "restored";
export const HEY_SUGGESTION_FILTERS = ["all", "new", "shown", "tried", "completed", "dismissed"] as const;
export type HeySuggestionFilter = (typeof HEY_SUGGESTION_FILTERS)[number];

export function heySuggestionMatchesFilter(suggestion: HeySuggestionView, filter: HeySuggestionFilter) {
  if (filter === "all") return true;
  if (filter === "dismissed") return suggestion.state.promotion === "dismissed";
  return suggestion.state.promotion === "eligible" && suggestion.state.progress === filter;
}

function assertScope(actual: SharedSuggestionScope, expected: SharedSuggestionScope) {
  if (
    actual.productId !== "hey" ||
    actual.productId !== expected.productId ||
    actual.accountId !== expected.accountId ||
    actual.workspaceId !== expected.workspaceId
  ) {
    throw new Error("Suggestion scope does not match the signed-in Hey workspace.");
  }
}

export function heySuggestionAction(suggestion: HeySuggestionView, expectedScope: SharedSuggestionScope) {
  assertScope(suggestion.state.scope, expectedScope);
  if (suggestion.state.suggestionId !== suggestion.id) {
    throw new Error("Suggestion state is not bound to its server ID.");
  }
  if (suggestion.target.kind === "editable_draft") {
    if (suggestion.destination.surface !== "home_chat" || suggestion.destination.draftId !== suggestion.target.draftId) {
      throw new Error("Suggestion draft target does not match its server destination.");
    }
    return {
      kind: "editable_draft" as const,
      suggestionId: suggestion.id,
      draft: suggestion.prompt,
    };
  }
  if (suggestion.destination.surface === "home_chat") {
    throw new Error("Suggestion setup target cannot resolve to a chat draft.");
  }
  return {
    kind: "navigate" as const,
    suggestionId: suggestion.id,
    destination: suggestion.destination,
  };
}
