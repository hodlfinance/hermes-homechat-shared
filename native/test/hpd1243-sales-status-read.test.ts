import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createApiClient } from "../core/api-client";
import type { HeyHermesSalesStatus } from "../core/hermes-api";
import { heyPlayProductGuard } from "../src/hey-store-platform";
import {
  heySalesPaywallInView,
  heySalesStatusAndroidRead,
  heySalesStatusRereadOnOpen,
  readHeySalesStatus,
} from "../src/hey-sales-status-read";

// HPD-1243, phase 3.
//
// The Android paywall sells only after the Plane's sales status named the Play
// product (heyPlayProductGuard). The status was read once per sign-in and
// without a deadline: one failed read closed the paywall with the "not
// configured" sentence until the app was restarted, and a stalled connection
// kept it on "loading" for good.
//
// Android now reads with a deadline and a bounded retry, and reads again when
// the paywall comes back into view after a failed read. iOS reads exactly as
// before: one call, no deadline, no retry, no re-read.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const PRODUCT = "hey_personal:monthly";
const status: HeyHermesSalesStatus = {
  schemaVersion: "heyhermes.sales-status/v1",
  open: true,
  reason: "open",
  mayPurchase: true,
  invitation: null,
  waitlist: null,
  checkedAt: "2026-10-13T22:00:00.000Z",
  playStorePersonalProductId: PRODUCT,
};

const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

/** A clock the test turns by hand; every timer the read sets is recorded. */
function clock() {
  let now = 0;
  let sequence = 0;
  const pending = new Map<number, { at: number; run: () => void }>();
  const set: number[] = [];
  return {
    set,
    pending,
    timers: {
      setTimeout: (run: () => void, ms: number) => {
        sequence += 1;
        set.push(ms);
        pending.set(sequence, { at: now + ms, run });
        return sequence;
      },
      clearTimeout: (id: unknown) => {
        pending.delete(id as number);
      },
    },
    /** Runs the next due timer, whatever its delay, and lets the promises settle. */
    async next() {
      await settle();
      const due = [...pending.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      assert.ok(due, "a timer is pending");
      pending.delete(due[0]);
      const waited = due[1].at - now;
      now = due[1].at;
      due[1].run();
      await settle();
      return waited;
    },
  };
}

const forbiddenTimers = {
  setTimeout: () => assert.fail("iOS sets no timer"),
  clearTimeout: () => assert.fail("iOS clears no timer"),
};

test("the bound is fixed: three attempts, eight seconds each, one and two seconds between them", () => {
  assert.deepEqual(heySalesStatusAndroidRead, { attempts: 3, deadlineMs: 8_000, pausesMs: [1_000, 2_000] });
});

test("iOS reads exactly as before: the very promise of one call, no argument, no timer, no retry", async () => {
  for (const answer of [status, null]) {
    const calls: unknown[][] = [];
    const promise = Promise.resolve(answer);
    const read = (...args: unknown[]) => {
      calls.push(args);
      return promise;
    };
    const returned = readHeySalesStatus("ios", read, { timers: forbiddenTimers, cancelled: () => assert.fail("iOS asks no cancellation") });
    assert.equal(returned, promise, "the same promise object, not a wrapper");
    assert.equal(await returned, answer);
    await settle();
    assert.deepEqual(calls, [[]], "one call without an argument, also after a failed read");
  }
  // A read that never answers stays unanswered on iOS: no deadline.
  let stalledCalls = 0;
  const stalled = readHeySalesStatus<HeyHermesSalesStatus>("ios", () => {
    stalledCalls += 1;
    return new Promise(() => undefined);
  }, { timers: forbiddenTimers });
  const outcome = await Promise.race([stalled.then(() => "answered"), settle().then(() => "open")]);
  assert.equal(outcome, "open");
  assert.equal(stalledCalls, 1);
});

test("Android: an answer on the first attempt is returned at once and the deadline is put away", async () => {
  const time = clock();
  const signals: Array<AbortSignal | undefined> = [];
  const result = await readHeySalesStatus("android", async (options) => {
    signals.push(options?.signal);
    return status;
  }, { timers: time.timers });
  assert.deepEqual(result, status);
  assert.equal(signals.length, 1);
  assert.ok(signals[0] instanceof AbortSignal, "the request can be aborted at the deadline");
  assert.equal(signals[0]!.aborted, false);
  assert.deepEqual(time.set, [8_000]);
  assert.equal(time.pending.size, 0, "no timer is left behind");
});

test("Android: a failed read is tried again after one second, then after two, and the third answer counts", async () => {
  const time = clock();
  const answers: Array<HeyHermesSalesStatus | null> = [null, null, status];
  let calls = 0;
  const reading = readHeySalesStatus("android", async () => answers[calls++]!, { timers: time.timers });
  assert.equal(await time.next(), 1_000);
  assert.equal(calls, 2);
  assert.equal(await time.next(), 2_000);
  assert.deepEqual(await reading, status);
  assert.equal(calls, 3);
  assert.deepEqual(time.set, [8_000, 1_000, 8_000, 2_000, 8_000]);
  assert.equal(time.pending.size, 0);
});

test("Android: three failed reads end the read with 'unknown'; there is no fourth", async () => {
  const time = clock();
  let calls = 0;
  const reading = readHeySalesStatus<HeyHermesSalesStatus>("android", async () => {
    calls += 1;
    return null;
  }, { timers: time.timers });
  await time.next();
  await time.next();
  assert.equal(await reading, null);
  await settle();
  assert.equal(calls, 3);
  assert.equal(time.pending.size, 0, "nothing is scheduled after the last attempt");
  // The paywall then shows the existing "not configured" state.
  assert.equal(heyPlayProductGuard({ buildProductId: PRODUCT, salesStatusSettled: true, salesStatus: null }), "mismatch");
});

test("Android: a read that throws counts as a failed read", async () => {
  const time = clock();
  let calls = 0;
  const reading = readHeySalesStatus("android", async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("Network request failed");
    return status;
  }, { timers: time.timers });
  assert.equal(await time.next(), 1_000);
  assert.deepEqual(await reading, status);
  assert.equal(calls, 2);
});

test("Android: a stalled connection is cut at the deadline, its request aborted, and the read still ends", async () => {
  const time = clock();
  const signals: AbortSignal[] = [];
  const reading = readHeySalesStatus<HeyHermesSalesStatus>("android", (options) => {
    signals.push(options!.signal!);
    return new Promise(() => undefined);
  }, { timers: time.timers });
  let answered: HeyHermesSalesStatus | null | "open" = "open";
  void reading.then((value) => {
    answered = value;
  });
  assert.equal(await time.next(), 8_000);
  assert.equal(signals[0]!.aborted, true, "the first stalled request is aborted");
  assert.equal(answered, "open");
  assert.equal(await time.next(), 1_000);
  assert.equal(await time.next(), 8_000);
  assert.equal(await time.next(), 2_000);
  assert.equal(signals.length, 3);
  assert.equal(signals[2]!.aborted, false);
  assert.equal(await time.next(), 8_000);
  assert.equal(await reading, null);
  assert.deepEqual(signals.map((signal) => signal.aborted), [true, true, true]);
  assert.equal(time.pending.size, 0);
  // Worst case on a dead connection: 27 seconds of "loading", then the existing sentence.
  assert.equal(time.set.reduce((sum, ms) => sum + ms, 0), 27_000);
});

test("Android: a stalled first attempt followed by an answer sells", async () => {
  const time = clock();
  let calls = 0;
  const reading = readHeySalesStatus<HeyHermesSalesStatus>("android", () => {
    calls += 1;
    return calls === 1 ? new Promise(() => undefined) : Promise.resolve(status);
  }, { timers: time.timers });
  await time.next();
  await time.next();
  const result = await reading;
  assert.deepEqual(result, status);
  assert.equal(heyPlayProductGuard({ buildProductId: PRODUCT, salesStatusSettled: true, salesStatus: result }), "match");
});

test("Android: a read whose session ended starts no further attempt", async () => {
  const time = clock();
  let cancelled = false;
  let calls = 0;
  const reading = readHeySalesStatus<HeyHermesSalesStatus>("android", async () => {
    calls += 1;
    // The session ends while the request is in flight.
    cancelled = true;
    return null;
  }, { timers: time.timers, cancelled: () => cancelled });
  assert.equal(await reading, null);
  await settle();
  assert.equal(calls, 1);
  assert.equal(time.pending.size, 0, "no pause is scheduled for a session that is gone");

  // Cancelled during the pause: the pause ends, the next attempt does not start.
  const second = clock();
  let secondCancelled = false;
  let secondCalls = 0;
  const secondReading = readHeySalesStatus<HeyHermesSalesStatus>("android", async () => {
    secondCalls += 1;
    return null;
  }, { timers: second.timers, cancelled: () => secondCancelled });
  await settle();
  secondCancelled = true;
  await second.next();
  assert.equal(await secondReading, null);
  assert.equal(secondCalls, 1);
});

test("the paywall coming back into view reads again on Android only, and only after a failed read", () => {
  const failed = { store: "android", opened: true, settled: true, status: null } as const;
  assert.equal(heySalesStatusRereadOnOpen(failed), true);
  // Still in view, or going out of view: nothing.
  assert.equal(heySalesStatusRereadOnOpen({ ...failed, opened: false }), false);
  // A read is still running: its own retries decide.
  assert.equal(heySalesStatusRereadOnOpen({ ...failed, settled: false }), false);
  // The Plane answered; an answer that names another product is not a failed read.
  assert.equal(heySalesStatusRereadOnOpen({ ...failed, status }), false);
  assert.equal(heySalesStatusRereadOnOpen({ ...failed, status: { ...status, playStorePersonalProductId: null } }), false);
  // iOS and a build without a store never read again.
  assert.equal(heySalesStatusRereadOnOpen({ ...failed, store: "ios" }), false);
  assert.equal(heySalesStatusRereadOnOpen({ ...failed, store: null }), false);
});

test("the Android paywall is in view on the purchase screen, behind the deleted-server purchase and on the Account page", () => {
  const base = {
    store: "android", appInFront: true, accountPanelOpen: false, screen: "purchase",
    deletedPaywallOpen: false, hasAccess: false, accountScreenOpen: false,
  } as const;
  // The three places that render the paywall.
  assert.equal(heySalesPaywallInView(base), true);
  assert.equal(heySalesPaywallInView({ ...base, screen: "deleted", deletedPaywallOpen: true }), true);
  assert.equal(heySalesPaywallInView({ ...base, screen: "home", hasAccess: true, accountScreenOpen: true }), true);
  // The purchase screen does not depend on the other two openers.
  assert.equal(heySalesPaywallInView({ ...base, hasAccess: true, accountScreenOpen: true, deletedPaywallOpen: true }), true);

  // Out of view: the app in the background, the small account panel on top.
  for (const screen of ["purchase", "deleted", "home"] as const) {
    const shown = { ...base, screen, deletedPaywallOpen: true, accountScreenOpen: true };
    assert.equal(heySalesPaywallInView(shown), true, screen);
    assert.equal(heySalesPaywallInView({ ...shown, appInFront: false }), false, `${screen} in the background`);
    assert.equal(heySalesPaywallInView({ ...shown, accountPanelOpen: true }), false, `${screen} under the account panel`);
  }
  // The deleted-server screen without its purchase opened, or with a running plan: no paywall.
  assert.equal(heySalesPaywallInView({ ...base, screen: "deleted" }), false);
  assert.equal(heySalesPaywallInView({ ...base, screen: "deleted", deletedPaywallOpen: true, hasAccess: true }), false);
  // Home without the Account page: no paywall.
  assert.equal(heySalesPaywallInView({ ...base, screen: "home", hasAccess: true }), false);
  assert.equal(heySalesPaywallInView({ ...base, screen: "home", deletedPaywallOpen: true }), false);
  // Screens that never carry the paywall, whatever else is open.
  for (const screen of ["preparing", "no_access", null] as const) {
    assert.equal(heySalesPaywallInView({ ...base, screen, deletedPaywallOpen: true, accountScreenOpen: true }), false, String(screen));
  }
  // iOS and a build without a store: never, on every screen.
  for (const store of ["ios", null] as const) {
    for (const screen of ["purchase", "deleted", "home"] as const) {
      assert.equal(heySalesPaywallInView({ ...base, store, screen, deletedPaywallOpen: true, accountScreenOpen: true }), false, `${store} ${screen}`);
    }
  }
});

test("coming into view and a failed read together start exactly one more round", () => {
  // The surface's edge detection, run as the surface runs it: the reference
  // holds the last answer, and only a change from out of view to in view opens.
  let wasInView = false;
  let round = 0;
  const render = (inView: boolean, settled: boolean, read: HeyHermesSalesStatus | null) => {
    const opened = inView && !wasInView;
    wasInView = inView;
    if (heySalesStatusRereadOnOpen({ store: "android", opened, settled, status: read })) round += 1;
  };
  render(true, false, null); // the paywall opens while the first read runs
  assert.equal(round, 0);
  render(true, true, null); // the read failed with the paywall still in view: nothing by itself
  assert.equal(round, 0);
  render(false, true, null); // the app goes to the background
  assert.equal(round, 0);
  render(true, true, null); // and returns: one more round
  assert.equal(round, 1);
  render(true, true, null); // rendered again while still in view: no second one
  assert.equal(round, 1);
  render(false, true, null);
  render(true, true, status); // opened again after an answer: nothing to repair
  assert.equal(round, 1);
});

test("the client hands the signal to the request only when one is given", async () => {
  const inits: Array<RequestInit | undefined> = [];
  const api = createApiClient({
    baseUrl: "https://heyhermes.test/api",
    token: "test-session",
    fetchImpl: (async (_url: string, init?: RequestInit) => {
      inits.push(init);
      return new Response(JSON.stringify(status), { status: 200 });
    }) as unknown as typeof fetch,
  });
  const controller = new AbortController();
  assert.deepEqual(await api.salesStatus(), status);
  assert.deepEqual(await api.salesStatus({}), status);
  assert.deepEqual(await api.salesStatus({ signal: controller.signal }), status);
  // iOS (no argument): the request carries exactly what it carried before.
  assert.equal("signal" in inits[0]!, false);
  assert.deepEqual(Object.keys(inits[0]!).sort(), ["credentials", "headers"]);
  assert.equal("signal" in inits[1]!, false);
  assert.equal(inits[2]!.signal, controller.signal);

  // An aborted request is a failed read, like every other failure.
  const aborting = createApiClient({
    baseUrl: "https://heyhermes.test/api",
    fetchImpl: (async () => {
      throw new DOMException("Aborted", "AbortError");
    }) as unknown as typeof fetch,
  });
  assert.equal(await aborting.salesStatus({ signal: controller.signal }), null);
});

test("the surface reads through the one function, and only Android can start a second read", () => {
  const effect = surface.slice(surface.indexOf("const [salesStatusSettled, setSalesStatusSettled]"), surface.indexOf("async function joinMobileWaitlist()"));
  // Reset with the session, gated by the store, settled by an answer and by a failure alike.
  assert.match(effect, /setSalesStatus\(null\);\s*setSalesStatusSettled\(false\);\s*if \(!token \|\| host\.session\.mode !== "standalone" \|\| !storePlatform\) return;\s*let cancelled = false;\s*void readHeySalesStatus\(storePlatform, \(options\) => api\.salesStatus\(options\), \{ cancelled: \(\) => cancelled \}\)\.then\(\(status\) => \{\s*if \(cancelled\) return;\s*setSalesStatus\(status\);\s*setSalesStatusSettled\(true\);/);
  assert.match(effect, /\}, \[api, token, host\.session\.mode, salesStatusReadRound\]\);/);
  // No other place reads the status.
  assert.equal(surface.split("api.salesStatus(").length - 1, 1);

  // The round moves in one place, behind the predicate.
  assert.equal(surface.split("setSalesStatusReadRound(").length - 1, 1);
  assert.match(surface, /if \(heySalesStatusRereadOnOpen\(\{ store: storePlatform, opened, settled: salesStatusSettled, status: salesStatus \}\)\) \{\s*setSalesStatusReadRound\(\(round\) => round \+ 1\);\s*\}/);
  // "In view" is decided by the one function, from the same values the render uses.
  assert.match(surface, /const salesPaywallInView = heySalesPaywallInView\(\{\s*store: storePlatform,\s*appInFront,\s*accountPanelOpen: paywallAccountOpen,\s*screen: productAccessScreenNow,\s*deletedPaywallOpen,\s*hasAccess: snapshot \? hasValidMobileProductAccess\(snapshot\.entitlement\) : false,\s*accountScreenOpen,\s*\}\);/);
  assert.match(surface, /const productAccessScreenNow = snapshot \? mobileProductAccessScreen\(\{/);
  // The edge: opened only on the change from out of view to in view, and the
  // reference is moved on every run.
  assert.match(surface, /useEffect\(\(\) => \{\s*const opened = salesPaywallInView && !salesPaywallWasInViewRef\.current;\s*salesPaywallWasInViewRef\.current = salesPaywallInView;\s*if \(heySalesStatusRereadOnOpen\(/);
  assert.match(surface, /const salesPaywallWasInViewRef = useRef\(false\);/);
  // The effect runs on the edge alone; the status is not a dependency.
  assert.match(surface, /setSalesStatusReadRound\(\(round\) => round \+ 1\);\s*\}\s*\}, \[salesPaywallInView\]\);/);
});

test("no sentence was added for a failed or slow read", () => {
  const existing = "App Store purchases are not configured in this build.";
  assert.equal(surface.split(`"${existing}"`).length - 1, 2);
  const source = readFileSync(new URL("../src/hey-sales-status-read.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /staticUiCopy|staticUiMessage|appI18n/);
});
