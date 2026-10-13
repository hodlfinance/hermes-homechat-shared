import type { HeyStorePlatform } from "./hey-store-platform";

/**
 * HPD-1243: how the sales status is read, by store.
 *
 * On Android the paywall sells only after the Plane's sales status named the
 * Play product (heyPlayProductGuard). Read once and without a deadline, one
 * failed read closed the paywall with the "not configured" sentence until the
 * app was restarted, and a stalled connection kept it on "loading" for good.
 *
 * Android therefore reads with a deadline per attempt and a bounded number of
 * attempts, and reads again when the paywall comes back into view after a read
 * that failed (heySalesStatusRereadOnOpen). The read ends in every case, with
 * the status or with null; null is the "unknown" the paywall already knows,
 * and it shows the existing sentence. No text belongs to this file.
 *
 * iOS does not take part: its paywall does not wait for the status, an unknown
 * status keeps the purchase (HPD-1063), and the call is handed through as it
 * was: once, without an argument, without a timer.
 */
export const heySalesStatusAndroidRead = {
  /** Reads per round. A fourth is never made; the next round starts when the paywall is opened again. */
  attempts: 3,
  /** After this long one attempt counts as failed and its request is aborted. */
  deadlineMs: 8_000,
  /** The pause before the second and before the third attempt. */
  pausesMs: [1_000, 2_000],
} as const;

export type HeySalesStatusReadTimers = {
  setTimeout: (run: () => void, ms: number) => unknown;
  clearTimeout: (timer: unknown) => void;
};

export type HeySalesStatusReadOptions = {
  /** True once the session that asked is gone; no further attempt starts then. Android only. */
  cancelled?: () => boolean;
  /** The clock; tests turn it by hand. Android only. */
  timers?: HeySalesStatusReadTimers;
};

const systemTimers: HeySalesStatusReadTimers = {
  setTimeout: (run, ms) => setTimeout(run, ms),
  clearTimeout: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
};

/**
 * One round of reading the sales status. `read` answers the status, or null
 * when the Plane did not give one (an old Plane, a network error, an odd body).
 */
export function readHeySalesStatus<T>(
  store: HeyStorePlatform,
  read: (options?: { signal?: AbortSignal }) => Promise<T | null>,
  options: HeySalesStatusReadOptions = {},
): Promise<T | null> {
  // iOS: the call itself, nothing around it.
  if (store !== "android") return read();
  return readWithDeadlineAndRetry(read, options);
}

async function readWithDeadlineAndRetry<T>(
  read: (options?: { signal?: AbortSignal }) => Promise<T | null>,
  options: HeySalesStatusReadOptions,
): Promise<T | null> {
  const timers = options.timers ?? systemTimers;
  const cancelled = options.cancelled ?? (() => false);
  const { attempts, deadlineMs, pausesMs } = heySalesStatusAndroidRead;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (cancelled()) return null;
    const status = await readOnceWithDeadline(read, deadlineMs, timers);
    if (status !== null) return status;
    if (cancelled() || attempt === attempts - 1) return null;
    const pauseMs = pausesMs[Math.min(attempt, pausesMs.length - 1)]!;
    await new Promise<void>((resolve) => {
      timers.setTimeout(resolve, pauseMs);
    });
  }
  return null;
}

/** One attempt. A thrown error, a rejection and the deadline all answer null. */
function readOnceWithDeadline<T>(
  read: (options?: { signal?: AbortSignal }) => Promise<T | null>,
  deadlineMs: number,
  timers: HeySalesStatusReadTimers,
): Promise<T | null> {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  return new Promise<T | null>((resolve) => {
    let finished = false;
    const finish = (value: T | null) => {
      if (finished) return;
      finished = true;
      timers.clearTimeout(timer);
      resolve(value);
    };
    // The timer also covers a fetch implementation that ignores the signal.
    const timer = timers.setTimeout(() => {
      controller?.abort();
      finish(null);
    }, deadlineMs);
    let reading: Promise<T | null>;
    try {
      reading = read(controller ? { signal: controller.signal } : undefined);
    } catch {
      finish(null);
      return;
    }
    reading.then(finish, () => finish(null));
  });
}

/**
 * Is the Android paywall in view? It is where a plan can be bought: the
 * purchase screen, the purchase screen behind the deleted-server screen, and
 * the Account page of a running account, which carries the plan. It is out of
 * view while the app is in the background and while the small account panel
 * (Sign out, delete account) covers it. Always false on iOS and without a
 * store: nothing is read again there.
 */
export function heySalesPaywallInView(input: {
  store: HeyStorePlatform | null;
  appInFront: boolean;
  /** The small account panel that replaces the purchase screen while open. */
  accountPanelOpen: boolean;
  /** What mobileProductAccessScreen answers; null before the first snapshot. */
  screen: "purchase" | "no_access" | "deleted" | "preparing" | "home" | null;
  /** The deleted-server screen's purchase was opened. */
  deletedPaywallOpen: boolean;
  /** The account holds valid access; the deleted-server screen then shows no paywall. */
  hasAccess: boolean;
  /** The Account page of Settings is open. */
  accountScreenOpen: boolean;
}): boolean {
  if (input.store !== "android" || !input.appInFront || input.accountPanelOpen) return false;
  if (input.screen === "purchase") return true;
  if (input.screen === "deleted") return input.deletedPaywallOpen && !input.hasAccess;
  if (input.screen === "home") return input.accountScreenOpen;
  return false;
}

/**
 * Does the paywall coming into view start a new round? Only on Android, only
 * at the moment it comes into view, and only when the last round ended without
 * an answer. An answer that names no product or another product is an answer:
 * reading it again would not change it.
 */
export function heySalesStatusRereadOnOpen(input: {
  store: HeyStorePlatform | null;
  /** The paywall was out of view and is in view now. */
  opened: boolean;
  settled: boolean;
  status: unknown | null;
}): boolean {
  return input.store === "android" && input.opened && input.settled && input.status === null;
}
