import type { MobileHostHeaderThread } from "./mobile-host-header";

/**
 * HPD-1504 (HODL iOS 10.0, Justus 2026-10-23): a bot opened from the HODL
 * Bots list showed the Home thread instead of its own, Home flashed first in
 * almost every bot, and Home itself painted two or three times.
 *
 * Each bot chat mounts a fresh surface. Its startup refresh selected Home from
 * the snapshot and painted Home's recent messages, while the host's
 * navigation request loaded the bot. The refresh noted the selection version
 * only after publishing the snapshot; on React's legacy root the next state
 * update renders synchronously and runs the navigation effect first, so the
 * bot load could bump the version before it was noted. The hydration then
 * thought nobody had navigated, loaded Home's page and selected Home again,
 * after the bot's page had been applied.
 *
 * The rules below: the version is noted when the refresh starts; a host that
 * opened the chat for one thread owns the selection until that thread is on
 * screen (or could not be opened); until then the chat shows a neutral
 * loading state and never another thread's messages.
 */
export type MobileHostThreadTarget =
  | { kind: "home" }
  | { kind: "thread"; conversationId: string };

/**
 * The thread the host opened this chat for. A navigation request names a
 * thread; a host that lists the threads itself (HODL Bots, headerBack) and
 * names Home opens Home. Anything else (Hey, a plain Hermes tab) has no
 * target and the startup behaves as before.
 */
export function mobileHostThreadTarget(input: {
  navigationConversationId?: string | null;
  headerThread?: MobileHostHeaderThread | null;
  hostListsThreads: boolean;
}): MobileHostThreadTarget | null {
  const conversationId = typeof input.navigationConversationId === "string" ? input.navigationConversationId.trim() : "";
  if (conversationId) return { kind: "thread", conversationId };
  if (input.hostListsThreads && input.headerThread?.home) return { kind: "home" };
  return null;
}

export function mobileHostThreadTargetKey(target: MobileHostThreadTarget | null): string | null {
  if (!target) return null;
  return target.kind === "home" ? "home" : `thread:${target.conversationId}`;
}

/**
 * Whether the startup refresh may choose the conversation itself (the
 * snapshot's Home, the hydration, the empty-chat recovery). Never while the
 * host's thread is still loading, and never in place of a host thread that
 * could not be opened: an empty chat with its error says the truth, Home in
 * its place does not.
 */
export function mobileStartupMaySelectConversation(input: {
  target: MobileHostThreadTarget | null;
  targetSettled: boolean;
  activeConversationId: string | null;
}): boolean {
  if (!input.target || input.target.kind === "home") return true;
  if (!input.targetSettled) return false;
  return input.activeConversationId !== null;
}

/**
 * Whether the first snapshot's recent messages are painted before the full
 * page arrives. Only without a host target: a host thread paints once, from
 * its own page.
 */
export function mobileStartupPaintsSnapshotMessages(target: MobileHostThreadTarget | null): boolean {
  return target === null;
}

/**
 * The startup hydration applies only when no navigation happened since the
 * refresh started. `versionAtRefreshStart` must be noted before the first
 * request of the refresh, not after the snapshot is published.
 */
export function mobileStartupHydrationAllowed(input: {
  versionAtRefreshStart: number;
  currentVersion: number;
  maySelect: boolean;
}): boolean {
  return input.maySelect && input.currentVersion === input.versionAtRefreshStart;
}

/** While true the chat shows a neutral loading state instead of messages. */
export function mobileHostThreadLoading(target: MobileHostThreadTarget | null, settledKey: string | null): boolean {
  const key = mobileHostThreadTargetKey(target);
  return key !== null && key !== settledKey;
}

/**
 * A re-hydration that brings exactly the page already on screen is not
 * painted again (Home painted two or three times on open).
 */
export function mobileMessagePagesEqual<T extends { id?: unknown }>(left: readonly T[], right: readonly T[]): boolean {
  if (left === right) return true;
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] === right[index]) continue;
    if (left[index]?.id !== right[index]?.id) return false;
    try {
      if (JSON.stringify(left[index]) !== JSON.stringify(right[index])) return false;
    } catch {
      return false;
    }
  }
  return true;
}
