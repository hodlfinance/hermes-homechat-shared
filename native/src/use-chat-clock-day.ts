import { useEffect, useState } from "react";
import { chatCalendarDayKey, msUntilNextChatDay } from "./chat-message-time";

/**
 * HPD-1215: the reference "now" for chat time stamps. It changes only when the
 * calendar day changes, so "today" turns into "yesterday" at midnight without
 * a reload and without re-rendering the chat every minute.
 *
 * A timer aims at the next midnight; a once-a-minute check covers what a timer
 * misses (a phone or laptop asleep over midnight, a changed time zone). The
 * state is set only when the day key differs, so the check itself renders
 * nothing.
 */
export function useChatClockDay(timeZone?: string): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let cancelled = false;
    let dayKey = chatCalendarDayKey(now, timeZone);
    let midnightTimer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      if (cancelled) return;
      const current = new Date();
      const currentKey = chatCalendarDayKey(current, timeZone);
      if (currentKey !== dayKey) {
        dayKey = currentKey;
        setNow(current);
      }
    };
    const aim = () => {
      midnightTimer = setTimeout(() => {
        check();
        aim();
      }, msUntilNextChatDay(new Date(), timeZone) + 250);
    };
    aim();
    const minuteCheck = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      if (midnightTimer) clearTimeout(midnightTimer);
      clearInterval(minuteCheck);
    };
    // `now` seeds the first key only; a new `now` comes from this effect itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZone]);
  return now;
}
