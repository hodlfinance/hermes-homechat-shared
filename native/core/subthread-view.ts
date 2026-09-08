/**
 * A sub thread is an ordinary conversation that was opened from a delegated
 * task inside another conversation. The chat screen is the same screen, so the
 * only thing that separates the two views is where the user came from.
 *
 * That origin is what the header needs: while it is set, the app bar owes the
 * user a way back instead of the global menu, and it has to say plainly that
 * this is a sub thread rather than the conversation they were reading.
 */
export type SubthreadOrigin = {
  readonly parentConversationId: string;
  readonly subthreadConversationId: string;
  readonly taskName: string | null;
};

export type SubthreadHeader =
  | { readonly kind: "menu" }
  | {
      readonly kind: "subthread";
      readonly label: string;
      readonly parentConversationId: string;
      readonly taskName: string | null;
    };

export const subthreadHeaderLabels = Object.freeze({
  en: "Subthread",
  de: "Subthread",
  es: "Subhilo",
} as const);

/**
 * The control that leaves the sub thread. The app already had this label in its
 * own navigation copy; the web client had none, and a back control without a
 * name is unusable with a screen reader.
 */
export const subthreadBackLabels = Object.freeze({
  en: "Back",
  de: "Zurück",
  es: "Atrás",
} as const);

export function subthreadBackLabel(locale: string) {
  const labels = subthreadBackLabels as Record<string, string>;
  return labels[locale] ?? subthreadBackLabels.en;
}

export function subthreadHeaderLabel(locale: string) {
  const labels = subthreadHeaderLabels as Record<string, string>;
  return labels[locale] ?? subthreadHeaderLabels.en;
}

export function subthreadOpened(
  parentConversationId: string | null,
  subthreadConversationId: string,
  taskName: string | null,
): SubthreadOrigin | null {
  const parent = (parentConversationId ?? "").trim();
  const subthread = subthreadConversationId.trim();
  // Opening the conversation you are already in is not a sub thread, and a sub
  // thread without a parent has nowhere to go back to.
  if (!parent || !subthread || parent === subthread) return null;
  return { parentConversationId: parent, subthreadConversationId: subthread, taskName };
}

/**
 * The origin survives only as long as the sub thread stays open. Any other
 * conversation, screen, or account change ends it, so a stale back button can
 * never point at a conversation the user already left.
 */
export function subthreadAfterConversationChange(
  origin: SubthreadOrigin | null,
  activeConversationId: string | null,
): SubthreadOrigin | null {
  if (!origin) return null;
  return origin.subthreadConversationId === (activeConversationId ?? "") ? origin : null;
}

export function subthreadHeader(
  origin: SubthreadOrigin | null,
  tab: string,
  locale: string,
): SubthreadHeader {
  if (!origin || tab !== "chat") return { kind: "menu" };
  return {
    kind: "subthread",
    label: subthreadHeaderLabel(locale),
    parentConversationId: origin.parentConversationId,
    taskName: origin.taskName,
  };
}
