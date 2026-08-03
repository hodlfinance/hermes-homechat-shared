import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SHARED_SUGGESTIONS_CATALOG_SCHEMA,
  SHARED_SUGGESTIONS_STATE_SCHEMA,
  SharedSuggestionsContractError,
  createSharedSuggestionState,
  parseSharedSuggestionCatalog,
  selectSharedSuggestion,
  transitionSharedSuggestionState,
  type SharedSuggestionCatalog,
  type SharedSuggestionScope,
  type SharedSuggestionState,
} from "../src/index.ts";

const now = "2026-08-03T12:00:00.000Z";
const scope: SharedSuggestionScope = {
  accountId: "acct_immutable_A",
  productId: "hey",
  workspaceId: "workspace_A",
};

const catalog: SharedSuggestionCatalog = {
  catalogVersion: "2026-08-03.1",
  entries: [
    {
      active: true,
      categoryId: "connection",
      id: "connect-gmail",
      priority: 20,
      target: { connectionId: "gmail", kind: "connection" },
    },
    {
      active: true,
      categoryId: "automation",
      id: "daily-brief",
      priority: 10,
      target: { draftId: "daily-brief", kind: "editable_draft" },
    },
    {
      active: true,
      categoryId: "ai-access",
      id: "connect-claude",
      priority: 10,
      target: { kind: "ai_access", providerId: "claude" },
    },
    {
      active: true,
      categoryId: "capability",
      id: "review-memory",
      priority: 10,
      target: { capabilityId: "memory", kind: "capability" },
    },
  ],
  productId: "hey",
  schemaVersion: SHARED_SUGGESTIONS_CATALOG_SCHEMA,
};

function eligibility() {
  return catalog.entries.map((entry) => ({
    eligible: true,
    relevance: entry.id === "daily-brief" ? 100 : 50,
    suggestionId: entry.id,
  }));
}

function stateAt(
  suggestionId: string,
  progress: SharedSuggestionState["progress"],
  promotion: SharedSuggestionState["promotion"],
  placedAt: string | null,
): SharedSuggestionState {
  return {
    completedAt: progress === "completed" ? "2026-07-01T00:00:00.000Z" : null,
    lastAutomaticPlacementAt: placedAt,
    lastDismissedAt: promotion === "dismissed" ? "2026-07-02T00:00:00.000Z" : null,
    progress,
    promotion,
    schemaVersion: SHARED_SUGGESTIONS_STATE_SCHEMA,
    scope,
    startedAt: progress === "tried" ? "2026-07-01T00:00:00.000Z" : null,
    suggestionId,
  };
}

function errorCode(action: () => unknown): string {
  try {
    action();
  } catch (error) {
    assert.ok(error instanceof SharedSuggestionsContractError);
    return error.code;
  }
  throw new Error("expected contract error");
}

test("validates stable catalog IDs and all mechanical target kinds", () => {
  assert.deepEqual(parseSharedSuggestionCatalog(catalog), catalog);
  assert.equal(errorCode(() => parseSharedSuggestionCatalog({
    ...catalog,
    entries: [...catalog.entries, { ...catalog.entries[0], id: "unsupported-target", target: { kind: "unknown" } }],
  })), "invalid_shape");
  assert.equal(errorCode(() => parseSharedSuggestionCatalog({
    ...catalog,
    entries: [...catalog.entries, { ...catalog.entries[0] }],
  })), "duplicate_suggestion_id");
  assert.equal(errorCode(() => parseSharedSuggestionCatalog({
    ...catalog,
    entries: [{ ...catalog.entries[0], id: "Copy changed!" }],
  })), "invalid_stable_id");
});

test("keeps progress and promotion independent with direct manual start", () => {
  const initial = createSharedSuggestionState(scope, "daily-brief");
  const tried = transitionSharedSuggestionState(initial, { at: now, type: "started" });
  assert.equal(tried.progress, "tried");
  assert.equal(tried.lastAutomaticPlacementAt, null);
  const dismissed = transitionSharedSuggestionState(tried, { at: now, type: "dismissed" });
  assert.equal(dismissed.progress, "tried");
  assert.equal(dismissed.promotion, "dismissed");
  const restored = transitionSharedSuggestionState(dismissed, { at: now, type: "restored" });
  assert.equal(restored.progress, "tried");
  assert.equal(restored.promotion, "eligible");
  const completed = transitionSharedSuggestionState(restored, { at: now, type: "completed" });
  assert.equal(completed.progress, "completed");
  assert.equal(errorCode(() => transitionSharedSuggestionState(completed, { at: now, type: "top_shown" })), "invalid_transition");
});

test("selects deterministically independent of catalog and fact order", () => {
  const input = {
    catalog,
    context: {
      activeRun: false,
      eligibility: eligibility(),
      higherPriorityNotice: false,
      now,
      sessionNudgeAlreadyPlaced: false,
    },
    scope,
    states: [] as SharedSuggestionState[],
  };
  const first = selectSharedSuggestion(input);
  const reordered = selectSharedSuggestion({
    ...input,
    catalog: { ...catalog, entries: [...catalog.entries].reverse() },
    context: { ...input.context, eligibility: [...input.context.eligibility].reverse() },
  });
  assert.equal(first.kind, "selected");
  assert.equal(reordered.kind, "selected");
  if (first.kind === "selected" && reordered.kind === "selected") {
    assert.equal(first.entry.id, "daily-brief");
    assert.equal(reordered.entry.id, first.entry.id);
    assert.equal(first.nextState.progress, "shown");
    assert.equal(first.nextState.lastAutomaticPlacementAt, now);
  }
});

test("enforces session and rolling 24-hour suppression", () => {
  const base = {
    catalog,
    context: {
      activeRun: false,
      eligibility: eligibility(),
      higherPriorityNotice: false,
      now,
      sessionNudgeAlreadyPlaced: true,
    },
    scope,
    states: [] as SharedSuggestionState[],
  };
  assert.deepEqual(selectSharedSuggestion(base), { kind: "suppressed", reason: "session_already_nudged" });
  assert.deepEqual(selectSharedSuggestion({
    ...base,
    context: { ...base.context, sessionNudgeAlreadyPlaced: false },
    states: [stateAt("connect-gmail", "shown", "eligible", "2026-08-02T13:00:00.000Z")],
  }), { kind: "suppressed", reason: "rolling_24h" });
});

test("enforces 14-day same-ID cooldown and re-allows tried entries at the boundary", () => {
  const placedAt = "2026-07-20T12:00:00.000Z";
  const result = selectSharedSuggestion({
    catalog,
    context: {
      activeRun: false,
      eligibility: eligibility().map((fact) => ({ ...fact, eligible: fact.suggestionId === "daily-brief" })),
      higherPriorityNotice: false,
      now,
      sessionNudgeAlreadyPlaced: false,
    },
    scope,
    states: [stateAt("daily-brief", "tried", "eligible", placedAt)],
  });
  assert.equal(result.kind, "selected");
  if (result.kind === "selected") assert.equal(result.entry.id, "daily-brief");

  const beforeBoundary = selectSharedSuggestion({
    catalog,
    context: {
      activeRun: false,
      eligibility: eligibility().map((fact) => ({ ...fact, eligible: fact.suggestionId === "daily-brief" })),
      higherPriorityNotice: false,
      now: "2026-08-03T11:59:59.999Z",
      sessionNudgeAlreadyPlaced: false,
    },
    scope,
    states: [stateAt("daily-brief", "tried", "eligible", placedAt)],
  });
  assert.deepEqual(beforeBoundary, { kind: "none_eligible", reason: "all_entries_excluded" });
});

test("never automatically returns completed or dismissed entries", () => {
  const result = selectSharedSuggestion({
    catalog,
    context: {
      activeRun: false,
      eligibility: eligibility().map((fact) => ({ ...fact, eligible: ["daily-brief", "connect-gmail"].includes(fact.suggestionId) })),
      higherPriorityNotice: false,
      now,
      sessionNudgeAlreadyPlaced: false,
    },
    scope,
    states: [
      stateAt("daily-brief", "completed", "eligible", "2026-07-01T00:00:00.000Z"),
      stateAt("connect-gmail", "tried", "dismissed", "2026-07-01T00:00:00.000Z"),
    ],
  });
  assert.deepEqual(result, { kind: "none_eligible", reason: "all_entries_excluded" });
});

test("fails closed across product, account, and workspace boundaries", () => {
  const base = {
    catalog,
    context: {
      activeRun: false,
      eligibility: eligibility(),
      higherPriorityNotice: false,
      now,
      sessionNudgeAlreadyPlaced: false,
    },
    scope,
    states: [stateAt("daily-brief", "tried", "eligible", "2026-07-01T00:00:00.000Z")],
  };
  assert.equal(errorCode(() => selectSharedSuggestion({
    ...base,
    scope: { ...scope, productId: "fin" },
  })), "scope_mismatch");
  assert.equal(errorCode(() => selectSharedSuggestion({
    ...base,
    states: [{ ...base.states[0], scope: { ...scope, accountId: "acct_immutable_B" } }],
  })), "scope_mismatch");
  assert.equal(errorCode(() => selectSharedSuggestion({
    ...base,
    states: [{ ...base.states[0], scope: { ...scope, workspaceId: "workspace_B" } }],
  })), "scope_mismatch");
});

test("suppresses active work and higher-priority notices before selection", () => {
  const base = {
    catalog,
    context: {
      activeRun: true,
      eligibility: eligibility(),
      higherPriorityNotice: false,
      now,
      sessionNudgeAlreadyPlaced: false,
    },
    scope,
    states: [] as SharedSuggestionState[],
  };
  assert.deepEqual(selectSharedSuggestion(base), { kind: "suppressed", reason: "active_run" });
  assert.deepEqual(selectSharedSuggestion({
    ...base,
    context: { ...base.context, activeRun: false, higherPriorityNotice: true },
  }), { kind: "suppressed", reason: "higher_priority_notice" });
});
