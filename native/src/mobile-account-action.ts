import {
  createMobileLocalActionState,
  mobileLocalActionCanStart,
  mobileLocalActionFailed,
  mobileLocalActionPressed,
  mobileLocalActionStarted,
  mobileLocalActionSucceeded,
  type MobileLocalActionOperation,
  type MobileLocalActionRow,
  type MobileLocalActionState,
} from "./mobile-local-action";

export type MobileAccountActionIntent =
  | Readonly<{ kind: "invite_account" }>
  | Readonly<{ accountId: string; kind: "reset_account_access" | "disable_account_access" }>
  | Readonly<{ kind: "create_support_pass" }>
  | Readonly<{ grantId: string; kind: "revoke_support_pass" }>;

export type MobileAccountActionState = Readonly<{
  actionKeys: readonly string[];
  actionsByKey: Readonly<Record<string, MobileAccountActionIntent>>;
  localActions: MobileLocalActionState<MobileAccountActionIntent>;
}>;

export type MobileAccountActionOperation = Readonly<{
  intent: MobileAccountActionIntent;
  localOperation: MobileLocalActionOperation;
}>;

export type MobileAccountActionStart = Readonly<{
  operation: MobileAccountActionOperation | null;
  state: MobileAccountActionState;
}>;

function requiredId(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} must be non-empty.`);
  return encodeURIComponent(normalized);
}

function actionKey(intent: MobileAccountActionIntent): string {
  switch (intent.kind) {
    case "invite_account":
      return "account:invite";
    case "reset_account_access":
      return `account:reset:${requiredId(intent.accountId, "Account ID")}`;
    case "disable_account_access":
      return `account:disable:${requiredId(intent.accountId, "Account ID")}`;
    case "create_support_pass":
      return "support-pass:create";
    case "revoke_support_pass":
      return `support-pass:revoke:${requiredId(intent.grantId, "Support Pass ID")}`;
  }
}

function normalizeActions(actions: readonly MobileAccountActionIntent[]) {
  const stableActions = Object.freeze([...actions]);
  const actionKeys = Object.freeze(stableActions.map(actionKey));
  if (new Set(actionKeys).size !== actionKeys.length) {
    throw new Error("Mobile Account action keys must be unique.");
  }

  const actionsByKey = Object.freeze(Object.fromEntries(
    actionKeys.map((key, index) => [key, stableActions[index] as MobileAccountActionIntent]),
  ));
  return Object.freeze({ actionKeys, actionsByKey });
}

function replaceLocalActions(
  state: MobileAccountActionState,
  localActions: MobileLocalActionState<MobileAccountActionIntent>,
): MobileAccountActionState {
  if (localActions === state.localActions) return state;
  return Object.freeze({ ...state, localActions });
}

export function createMobileAccountActionState(
  actions: readonly MobileAccountActionIntent[],
): MobileAccountActionState {
  const normalized = normalizeActions(actions);
  return Object.freeze({
    ...normalized,
    localActions: createMobileLocalActionState(normalized.actionsByKey),
  });
}

export function reconcileMobileAccountActionState(
  state: MobileAccountActionState,
  actions: readonly MobileAccountActionIntent[],
): MobileAccountActionState {
  const normalized = normalizeActions(actions);
  const rows = Object.fromEntries(normalized.actionKeys.map((key) => {
    const existing = state.localActions.rows[key];
    if (existing) return [key, existing];

    const intent = normalized.actionsByKey[key] as MobileAccountActionIntent;
    return [key, Object.freeze({
      error: null,
      operationId: null,
      phase: "idle" as const,
      rollbackValue: intent,
      value: intent,
    })];
  })) as Record<string, MobileLocalActionRow<MobileAccountActionIntent>>;

  return Object.freeze({
    ...normalized,
    localActions: Object.freeze({
      nextOperationId: state.localActions.nextOperationId,
      rows: Object.freeze(rows),
    }),
  });
}

export function mobileAccountActionRow(
  state: MobileAccountActionState,
  intent: MobileAccountActionIntent,
): MobileLocalActionRow<MobileAccountActionIntent> | undefined {
  return state.localActions.rows[actionKey(intent)];
}

export function mobileAccountActionCanStart(
  state: MobileAccountActionState,
  intent: MobileAccountActionIntent,
): boolean {
  return mobileLocalActionCanStart(state.localActions, actionKey(intent));
}

export function mobileAccountActionPressed(
  state: MobileAccountActionState,
  intent: MobileAccountActionIntent,
): MobileAccountActionState {
  return replaceLocalActions(
    state,
    mobileLocalActionPressed(state.localActions, actionKey(intent)),
  );
}

export function mobileAccountActionStarted(
  state: MobileAccountActionState,
  intent: MobileAccountActionIntent,
): MobileAccountActionStart {
  const key = actionKey(intent);
  const registeredIntent = state.actionsByKey[key];
  if (!registeredIntent) return Object.freeze({ operation: null, state });

  const started = mobileLocalActionStarted(state.localActions, key, registeredIntent);
  if (!started.operation) return Object.freeze({ operation: null, state });

  return Object.freeze({
    operation: Object.freeze({ intent: registeredIntent, localOperation: started.operation }),
    state: replaceLocalActions(state, started.state),
  });
}

export function mobileAccountActionSucceeded(
  state: MobileAccountActionState,
  operation: MobileAccountActionOperation,
): MobileAccountActionState {
  return replaceLocalActions(
    state,
    mobileLocalActionSucceeded(state.localActions, operation.localOperation),
  );
}

export function mobileAccountActionFailed(
  state: MobileAccountActionState,
  operation: MobileAccountActionOperation,
  error: string,
): MobileAccountActionState {
  return replaceLocalActions(
    state,
    mobileLocalActionFailed(state.localActions, operation.localOperation, error),
  );
}
