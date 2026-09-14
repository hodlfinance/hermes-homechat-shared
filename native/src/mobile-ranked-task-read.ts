import {
  rankedTaskListView,
  type RankedTaskListView,
} from "../core/ranked-task-list-view";
import type { RankedTaskCollection } from "../core/ranked-tasks";

export type MobileRankedTaskRead =
  | Readonly<{
      phase: "ready";
      collection: RankedTaskCollection;
      view: RankedTaskListView;
    }>
  | Readonly<{ phase: "error" }>;

/**
 * Treat the authenticated API response as untrusted until the same projection
 * boundary used by the Tasks screen has accepted it.  Without this boundary a
 * stale or partially migrated response could throw while React rendered the
 * screen, which terminates the native surface instead of showing its existing
 * recoverable load-error state.
 */
export function mobileRankedTaskRead(value: unknown): MobileRankedTaskRead {
  try {
    const collection = value as RankedTaskCollection;
    return Object.freeze({
      phase: "ready" as const,
      collection,
      view: rankedTaskListView(collection),
    });
  } catch {
    return Object.freeze({ phase: "error" as const });
  }
}
