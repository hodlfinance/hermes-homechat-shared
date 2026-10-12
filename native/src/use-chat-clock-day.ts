import { useEffect, useState } from "react";
import { documentVisibilityResume, startChatClockDayWatch } from "./chat-message-time";

/**
 * HPD-1215: the reference "now" for chat time stamps. It changes only when the
 * calendar day changes, so "today" turns into "yesterday" at midnight without
 * a reload and without re-rendering the chat every minute.
 *
 * `subscribeResume` re-checks the day when the chat comes to the front again:
 * the app passes React Native's AppState, the web defaults to the tab's
 * visibility.
 */
export function useChatClockDay(
  options: { timeZone?: string; subscribeResume?: (onResume: () => void) => () => void } = {},
): Date {
  const { timeZone, subscribeResume = documentVisibilityResume } = options;
  const [now, setNow] = useState(() => new Date());
  useEffect(
    () => startChatClockDayWatch({ onDayChange: setNow, timeZone, shownNow: now, subscribeResume }),
    // `now` seeds the first day key only; a new `now` comes from this watch itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timeZone, subscribeResume],
  );
  return now;
}
