import type { AiProviderId, ChatRoutePreference, ProviderStatusItem } from "../core/index";

/** Which stored notice a key belongs to. Only the two global notices carry one. */
export type MobileNoticeScope = "appError" | "sessionNotice";

/**
 * Where a keyed notice came from. Only the ChatGPT reconnect flow stamps one,
 * because it is the only source whose announcements a later snapshot can prove
 * out of date.
 */
export type MobileNoticeOrigin = "chatgpt_connection";

/**
 * What kind of sentence a chatgpt_connection-origin notice carries. Origin
 * answers "did this come from the ChatGPT connection flow" -- true of the
 * code sentence and a success confirmation too, not only of a stale prompt.
 * Kind answers the separate question the retirement actually needs: only
 * "reconnect_prompt" is a claim a later snapshot can prove false (that the
 * account still needs reconnecting). "code" and "confirmation" are content
 * the person still has to read, not a claim about current connection state,
 * so readiness must never retire them.
 */
export type MobileNoticeKind = "reconnect_prompt" | "code" | "confirmation";

/** A notice that carries the identity of the raise that produced it. */
export type MobileKeyedNotice = {
  message: string;
  key: string;
  origin?: MobileNoticeOrigin;
  kind?: MobileNoticeKind;
};

export type MobileRouteError = {
  message: string;
  owner: string | null;
  routePreference: ChatRoutePreference | null;
  key: string;
};

export function mobileNoticeKey(scope: MobileNoticeScope, sequence: number): string {
  return `${scope}#${sequence}`;
}

/**
 * Decides what the stored app error becomes when something raises one.
 *
 * The key is kept when the incoming announcement is identical to the one
 * already stored, and drawn fresh otherwise. That is the whole mechanism: a
 * poll that repeats itself keeps the key it already had and stays dismissed,
 * while a real second failure arrives after runAction's setAppError(null) and
 * therefore sees no previous notice and takes a new key.
 */
export function mobileRouteErrorAfterRaise(
  previous: MobileRouteError | null,
  next: {
    message: string | null;
    owner: string | null;
    routePreference: ChatRoutePreference | null;
  },
  freshKey: string,
): MobileRouteError | null {
  if (!next.message) return null;
  if (
    previous &&
    previous.message === next.message &&
    previous.owner === next.owner &&
    previous.routePreference === next.routePreference
  ) {
    return previous;
  }
  return {
    message: next.message,
    owner: next.owner,
    routePreference: next.routePreference,
    key: freshKey,
  };
}

export function mobileSessionNoticeAfterRaise(
  previous: MobileKeyedNotice | null,
  message: string | null,
  freshKey: string,
  origin: MobileNoticeOrigin | null = null,
  kind: MobileNoticeKind | null = null,
): MobileKeyedNotice | null {
  if (!message) return null;
  if (
    previous &&
    previous.message === message &&
    (previous.origin ?? null) === origin &&
    (previous.kind ?? null) === kind
  ) {
    return previous;
  }
  if (origin && kind) return { message, key: freshKey, origin, kind };
  if (origin) return { message, key: freshKey, origin };
  return { message, key: freshKey };
}

/**
 * What the stored session notice becomes when a fresh snapshot arrives.
 *
 * The ChatGPT reconnect flow stops polling the moment it reaches a terminal
 * outcome, so whatever it last said is frozen: nothing re-derives it from the
 * server again. When a later snapshot says the account is ready, a frozen
 * "reconnect_prompt" sentence is the app telling someone to reconnect an
 * account that is already connected, and it is retired here.
 *
 * A "code" sentence and a "confirmation" sentence are not claims about
 * current connection state -- they are content the person still has to read
 * (the code itself, or the fact that the connection they just completed
 * succeeded) -- so readiness never retires either one, no matter how fresh
 * the snapshot is or how the notice is otherwise stamped.
 *
 * Nothing else is retired. A snapshot that is not ready leaves the notice
 * alone, so a real expired, rejected or quota-limited outcome stays on screen
 * and stays true; and a notice from any other source is not this function's
 * business.
 */
export function mobileSessionNoticeAfterSnapshot(
  notice: MobileKeyedNotice | null,
  chatGptAccountReady: boolean,
): MobileKeyedNotice | null {
  if (!notice) return null;
  if (notice.origin === "chatgpt_connection" && notice.kind === "reconnect_prompt" && chatGptAccountReady) return null;
  return notice;
}

export function mobileVisibleNotice(
  notice: MobileKeyedNotice | null,
  dismissedKey: string | null,
): MobileKeyedNotice | null {
  if (!notice) return null;
  if (dismissedKey && notice.key === dismissedKey) return null;
  return notice;
}

/**
 * What the stored dismissal becomes when someone presses the close control.
 *
 * It records the key of the banner that was on screen. Nothing is nulled, so
 * the notice itself is still there for its own source to replace; it is simply
 * not shown until a raise gives it a different key.
 */
export function mobileNoticeAfterDismiss(
  notice: { key: string } | null,
  dismissedKey: string | null,
): string | null {
  return notice ? notice.key : dismissedKey;
}

export function mobileSelectedChatRoutePreference(
  snapshotPreference: ChatRoutePreference,
  modelOptionsPreference?: ChatRoutePreference | null,
) {
  return modelOptionsPreference ?? snapshotPreference;
}

export function mobileChatGptConnectionCardView(input: {
  dismissedKey: string | null;
  pendingSessionId: string | null;
  reconnectRequired: boolean;
  selectedPreference: ChatRoutePreference | null;
}) {
  const key = input.pendingSessionId || (
    input.selectedPreference === "chatgpt_account" && input.reconnectRequired ? "reconnect" : null
  );
  return {
    key,
    visible: key !== null && input.dismissedKey !== key,
  };
}

export function mobileProviderIdForRoute(preference: ChatRoutePreference): AiProviderId {
  if (preference === "included_ai") return "openrouter_managed";
  return preference;
}

export function mobileRouteReadiness(input: {
  preference: ChatRoutePreference;
  providers: ProviderStatusItem[];
  chatGptAccountReady: boolean;
}) {
  const providerId = mobileProviderIdForRoute(input.preference);
  const provider = input.providers.find((item) => item.id === providerId);
  return {
    provider,
    providerId,
    ready: input.preference === "chatgpt_account"
      ? input.chatGptAccountReady
      : provider?.live === true,
  };
}

export function mobileVisibleRouteError(
  error: MobileRouteError | null,
  selectedPreference: ChatRoutePreference | null,
  dismissedKey: string | null = null,
) {
  if (!error) return null;
  if (error.routePreference && error.routePreference !== selectedPreference) return null;
  if (dismissedKey && error.key === dismissedKey) return null;
  return error;
}

export function isProductSessionAuthError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("401") ||
    normalized.includes("please sign in") ||
    normalized.includes("sign in is required") ||
    normalized.includes("session expired") ||
    normalized.includes("expired session") ||
    normalized.includes("invalid session") ||
    normalized.includes("session ended")
  );
}
