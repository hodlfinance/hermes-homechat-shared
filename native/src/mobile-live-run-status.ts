import { heyLiveRunActivity, heyLiveRunActivityHistory, type ChatRunEvent, type ChatRunStatus } from "../core/index";
import type { MobileRunActivityView } from "./mobile-chat-activity";

/**
 * Projects one active run into a single, user-facing live status line.
 *
 * The projection deliberately returns null for every terminal status. The
 * status is transient UI, never a persisted part of the assistant's answer.
 * Raw runtime payloads are reduced to a small allow-list of friendly labels so
 * command arguments, environment values, URLs, and secrets cannot leak into
 * either the default line or its optional history.
 *
 * Since HPD-350 the projection itself lives in `@hermes/core`'s
 * `chat-run-activity`, so the app and the web say one thing rather than two.
 * What remains here is the shape this app draws.
 */
export function mobileLiveRunActivityView(input: {
  assistantText?: string;
  events: ChatRunEvent[];
  runStatus: ChatRunStatus | null;
}): MobileRunActivityView | null {
  const activity = heyLiveRunActivity(input);
  if (!activity) return null;

  return {
    details: heyLiveRunActivityHistory(input.events),
    summary: {
      label: activity.label,
      ...(activity.labelKey ? { labelKey: activity.labelKey } : {}),
      detail: "Hermes is working on your request.",
      tone: "working",
    },
  };
}
