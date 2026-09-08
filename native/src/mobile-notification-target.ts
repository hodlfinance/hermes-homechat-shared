/**
 * What a tapped notification is allowed to open. Decided in
 * specs/active/a-notification-carries-the-answer.md, Entscheidung 2 and 4.
 *
 * Plain data in, plain data out, so it is tested for real rather than through
 * the source text of MobileApp.tsx. MobileApp.tsx only wires it.
 */
export type MobileNotificationTarget = {
  notificationId: string;
  accountId: string | null;
  conversationSessionId: string | null;
};

export type MobileNotificationAction = "open" | "remember" | "ignore";

const HANDLED_NOTIFICATION_MEMORY = 50;

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function mobileNotificationTargetFromData(data: unknown): MobileNotificationTarget | null {
  if (!data || typeof data !== "object") return null;
  const source = data as Record<string, unknown>;
  const notificationId = stringValue(source.notificationId);
  if (!notificationId) return null;
  return {
    notificationId,
    accountId: stringValue(source.accountId),
    conversationSessionId: stringValue(source.conversationSessionId),
  };
}

export function mobileNotificationAction(input: {
  target: MobileNotificationTarget;
  signedInAccountId: string | null;
  handledNotificationIds: readonly string[];
}): MobileNotificationAction {
  if (input.handledNotificationIds.includes(input.target.notificationId)) return "ignore";
  if (!input.signedInAccountId) return "remember";
  // No account on the payload means the sender is older than this rule. It is
  // not evidence that the notification belongs here, so it does not open.
  if (!input.target.accountId) return "ignore";
  return input.target.accountId === input.signedInAccountId ? "open" : "ignore";
}

export function mobileHandledNotificationIdsAfter(
  handled: readonly string[],
  notificationId: string,
): string[] {
  return [notificationId, ...handled.filter((entry) => entry !== notificationId)].slice(
    0,
    HANDLED_NOTIFICATION_MEMORY,
  );
}
