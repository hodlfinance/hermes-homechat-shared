export type MobileLocalActionPhase = "idle" | "pressed" | "pending" | "success" | "error";

export type MobileLocalActionOperation = Readonly<{
  id: number;
  key: string;
}>;

export type MobileLocalActionRow<T> = Readonly<{
  error: string | null;
  operationId: number | null;
  phase: MobileLocalActionPhase;
  rollbackValue: T;
  value: T;
}>;

export type MobileLocalActionState<T> = Readonly<{
  nextOperationId: number;
  rows: Readonly<Record<string, MobileLocalActionRow<T>>>;
}>;

export type MobileLocalActionStart<T> = Readonly<{
  operation: MobileLocalActionOperation | null;
  state: MobileLocalActionState<T>;
}>;

function freezeRow<T>(row: MobileLocalActionRow<T>): MobileLocalActionRow<T> {
  return Object.freeze(row);
}

function replaceRow<T>(
  state: MobileLocalActionState<T>,
  key: string,
  row: MobileLocalActionRow<T>,
  nextOperationId = state.nextOperationId,
): MobileLocalActionState<T> {
  return Object.freeze({
    nextOperationId,
    rows: Object.freeze({ ...state.rows, [key]: freezeRow(row) }),
  });
}

export function createMobileLocalActionState<T>(values: Readonly<Record<string, T>>): MobileLocalActionState<T> {
  const rows = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      freezeRow({
        error: null,
        operationId: null,
        phase: "idle",
        rollbackValue: value,
        value,
      }),
    ]),
  ) as Record<string, MobileLocalActionRow<T>>;

  return Object.freeze({ nextOperationId: 1, rows: Object.freeze(rows) });
}

export function mobileLocalActionCanStart<T>(state: MobileLocalActionState<T>, key: string): boolean {
  const row = state.rows[key];
  return row !== undefined && row.operationId === null;
}

export function mobileLocalActionPressed<T>(
  state: MobileLocalActionState<T>,
  key: string,
): MobileLocalActionState<T> {
  const row = state.rows[key];
  if (row === undefined || row.operationId !== null) return state;

  return replaceRow(state, key, {
    ...row,
    error: null,
    phase: "pressed",
  });
}

export function mobileLocalActionStarted<T>(
  state: MobileLocalActionState<T>,
  key: string,
  optimisticValue: T,
): MobileLocalActionStart<T> {
  const row = state.rows[key];
  if (row === undefined || row.operationId !== null) {
    return Object.freeze({ operation: null, state });
  }

  const operation = Object.freeze({ id: state.nextOperationId, key });
  return Object.freeze({
    operation,
    state: replaceRow(
      state,
      key,
      {
        error: null,
        operationId: operation.id,
        phase: "pending",
        rollbackValue: row.value,
        value: optimisticValue,
      },
      state.nextOperationId + 1,
    ),
  });
}

export function mobileLocalActionSucceeded<T>(
  state: MobileLocalActionState<T>,
  operation: MobileLocalActionOperation,
  ...settledValue: [] | [T]
): MobileLocalActionState<T> {
  const row = state.rows[operation.key];
  if (row === undefined || row.operationId !== operation.id) return state;

  const value = settledValue.length === 0 ? row.value : settledValue[0] as T;
  return replaceRow(state, operation.key, {
    error: null,
    operationId: null,
    phase: "success",
    rollbackValue: value,
    value,
  });
}

export function mobileLocalActionFailed<T>(
  state: MobileLocalActionState<T>,
  operation: MobileLocalActionOperation,
  error: string,
): MobileLocalActionState<T> {
  const row = state.rows[operation.key];
  if (row === undefined || row.operationId !== operation.id) return state;

  return replaceRow(state, operation.key, {
    error,
    operationId: null,
    phase: "error",
    rollbackValue: row.rollbackValue,
    value: row.rollbackValue,
  });
}
