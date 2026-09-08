import {
  createMobileLocalActionState,
  mobileLocalActionCanStart,
  mobileLocalActionFailed,
  mobileLocalActionStarted,
  mobileLocalActionSucceeded,
  type MobileLocalActionOperation,
  type MobileLocalActionRow,
  type MobileLocalActionState,
} from "./mobile-local-action";

const CARD_ACTION_KEY = "guided-setup:card";

export type MobileGuidedSetupDecision = "idle" | "not_now" | "open";

export type MobileGuidedSetupPresentation = Readonly<{
  decision: MobileGuidedSetupDecision;
  visible: boolean;
}>;

export type MobileGuidedSetupActionState = Readonly<{
  itemIds: readonly string[];
  localActions: MobileLocalActionState<MobileGuidedSetupPresentation>;
}>;

export type MobileGuidedSetupIntent =
  | Readonly<{ itemId: string; kind: "item_not_now" | "item_open" }>
  | Readonly<{ kind: "card_not_now" }>;

export type MobileGuidedSetupOperation = Readonly<{
  intent: MobileGuidedSetupIntent;
  localOperation: MobileLocalActionOperation;
}>;

export type MobileGuidedSetupActionStart = Readonly<{
  operation: MobileGuidedSetupOperation | null;
  state: MobileGuidedSetupActionState;
}>;

function itemActionKey(itemId: string) {
  return `guided-setup:item:${itemId}`;
}

function presentation(decision: MobileGuidedSetupDecision, visible: boolean): MobileGuidedSetupPresentation {
  return Object.freeze({ decision, visible });
}

function replaceLocalActions(
  state: MobileGuidedSetupActionState,
  localActions: MobileLocalActionState<MobileGuidedSetupPresentation>,
): MobileGuidedSetupActionState {
  if (localActions === state.localActions) return state;
  return Object.freeze({ itemIds: state.itemIds, localActions });
}

export function createMobileGuidedSetupActionState(itemIds: readonly string[]): MobileGuidedSetupActionState {
  if (itemIds.some((itemId) => itemId.trim().length === 0)) {
    throw new Error("Guided setup item IDs must be non-empty.");
  }
  if (new Set(itemIds).size !== itemIds.length) {
    throw new Error("Guided setup item IDs must be unique.");
  }

  const stableItemIds = Object.freeze([...itemIds]);
  const initialValues = Object.fromEntries([
    [CARD_ACTION_KEY, presentation("idle", true)],
    ...stableItemIds.map((itemId) => [itemActionKey(itemId), presentation("idle", true)] as const),
  ]);

  return Object.freeze({
    itemIds: stableItemIds,
    localActions: createMobileLocalActionState(initialValues),
  });
}

export function mobileGuidedSetupCardRow(
  state: MobileGuidedSetupActionState,
): MobileLocalActionRow<MobileGuidedSetupPresentation> | undefined {
  return state.localActions.rows[CARD_ACTION_KEY];
}

export function mobileGuidedSetupItemRow(
  state: MobileGuidedSetupActionState,
  itemId: string,
): MobileLocalActionRow<MobileGuidedSetupPresentation> | undefined {
  return state.localActions.rows[itemActionKey(itemId)];
}

export function mobileGuidedSetupVisibleItemIds(state: MobileGuidedSetupActionState): readonly string[] {
  if (mobileGuidedSetupCardRow(state)?.value.visible !== true) return Object.freeze([]);
  return Object.freeze(state.itemIds.filter((itemId) => mobileGuidedSetupItemRow(state, itemId)?.value.visible === true));
}

export function mobileGuidedSetupCanAct(state: MobileGuidedSetupActionState, itemId: string): boolean {
  const card = mobileGuidedSetupCardRow(state);
  const item = mobileGuidedSetupItemRow(state, itemId);
  return card?.value.visible === true
    && item?.value.visible === true
    && mobileLocalActionCanStart(state.localActions, itemActionKey(itemId));
}

function startAction(
  state: MobileGuidedSetupActionState,
  key: string,
  optimisticPresentation: MobileGuidedSetupPresentation,
  intent: MobileGuidedSetupIntent,
): MobileGuidedSetupActionStart {
  const started = mobileLocalActionStarted(state.localActions, key, optimisticPresentation);
  if (started.operation === null) return Object.freeze({ operation: null, state });

  return Object.freeze({
    operation: Object.freeze({ intent, localOperation: started.operation }),
    state: replaceLocalActions(state, started.state),
  });
}

export function mobileGuidedSetupItemOpen(
  state: MobileGuidedSetupActionState,
  itemId: string,
): MobileGuidedSetupActionStart {
  if (!mobileGuidedSetupCanAct(state, itemId)) return Object.freeze({ operation: null, state });
  return startAction(
    state,
    itemActionKey(itemId),
    presentation("open", true),
    Object.freeze({ itemId, kind: "item_open" }),
  );
}

export function mobileGuidedSetupItemNotNow(
  state: MobileGuidedSetupActionState,
  itemId: string,
): MobileGuidedSetupActionStart {
  if (!mobileGuidedSetupCanAct(state, itemId)) return Object.freeze({ operation: null, state });
  return startAction(
    state,
    itemActionKey(itemId),
    presentation("not_now", false),
    Object.freeze({ itemId, kind: "item_not_now" }),
  );
}

export function mobileGuidedSetupCardNotNow(
  state: MobileGuidedSetupActionState,
): MobileGuidedSetupActionStart {
  const card = mobileGuidedSetupCardRow(state);
  if (card?.value.visible !== true || !mobileLocalActionCanStart(state.localActions, CARD_ACTION_KEY)) {
    return Object.freeze({ operation: null, state });
  }
  return startAction(
    state,
    CARD_ACTION_KEY,
    presentation("not_now", false),
    Object.freeze({ kind: "card_not_now" }),
  );
}

export function mobileGuidedSetupActionSucceeded(
  state: MobileGuidedSetupActionState,
  operation: MobileGuidedSetupOperation,
): MobileGuidedSetupActionState {
  return replaceLocalActions(
    state,
    mobileLocalActionSucceeded(state.localActions, operation.localOperation),
  );
}

export function mobileGuidedSetupActionFailed(
  state: MobileGuidedSetupActionState,
  operation: MobileGuidedSetupOperation,
  error: string,
): MobileGuidedSetupActionState {
  return replaceLocalActions(
    state,
    mobileLocalActionFailed(state.localActions, operation.localOperation, error),
  );
}
