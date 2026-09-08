// A single shared "Reduce Motion" subscription, used by every mounted
// MobileRunActivityTrail (HPD-120 finding I-4) instead of one native read
// and one native listener per assistant message bubble. Kept free of
// react-native and react imports on purpose: MobileApp.tsx cannot be loaded
// by this repository's `node --test` runner (react-native's index.js uses
// Flow syntax esbuild cannot parse — see mobile-chat-feel-wiring.test.ts's
// header), so the only way to test this store's actual behaviour, not a
// copy of it, is to keep it importable on its own, with the two native
// calls passed in as deps.
//
// Generation guard (HPD-120 review round 2, Question 2; extended round 3,
// Question 1): a harness proved two ways an unguarded shared read goes
// wrong. First, a read issued while this store had subscribers can resolve
// after every subscriber has left, the cache has reset, and a completely new
// generation has started and read its own value — the orphaned read does
// not know its generation ended, and applying it overwrites the new
// generation's correct value for every currently mounted trail at once.
// Second, a read that is still in flight when a live "reduceMotionChanged"
// event arrives can resolve afterward with the value that was current
// before that event, reverting it. Both share one cause: the read's
// resolution carried no record of whether it was still current. So every
// read closes over the generation it was issued in, and a flag for whether
// an event has already superseded it since, and discards itself — writes
// nothing, notifies no one — if either has happened by the time it
// resolves.
//
// The event callback handed to `deps.subscribe` carries the same generation
// check. It does not need a `supersededByEvent`-style flag of its own — only
// the read needs to know whether an event beat it — but without the
// generation check, a second harness showed the same corruption on the
// event side: a torn-down generation's own callback, if it could still fire
// after teardown, would write the shared cache and notify every listener
// exactly as unconditionally as the read once did. Whether that ordering
// can actually happen depends on `deps.subscribe`, not on this module: the
// concrete `AccessibilityInfo.addEventListener` MobileApp.tsx wires in
// cannot produce it (react-native's EventEmitter deletes a registration
// synchronously on `remove()`, and `emit()` re-reads that registry fresh on
// every call, so a removed callback provably cannot fire again — read from
// node_modules/react-native/Libraries/vendor/emitter/EventEmitter.js, not
// assumed), but `subscribe` is a parameter here, not a fixed dependency, and
// nothing in `ReduceMotionDeps`'s type requires a caller's implementation to
// share that guarantee. The guard makes this store correct regardless of
// which `subscribe` it is given, rather than correct only for the one this
// file happens to supply today.
//
// "if its generation ended" above used to be true only while at least one
// subscriber remained: `generation` was incremented inside `subscribe`, not
// in the teardown branch of the unsubscribe it returns, so a full teardown
// reset `cache` to `null` without ending the generation any in-flight read
// had been issued in. A harness against this exact function, ordering
// subscribe, teardown to zero, the orphaned read resolving with nobody
// subscribed, then a fresh subscriber — found that subscriber received the
// orphaned value synchronously, the stale write teardown's own `cache =
// null` was supposed to prevent. `generation += 1;` in the teardown branch
// closes it: a full teardown now ends the generation itself, not only the
// next `subscribe()` after it.

export type ReduceMotionDeps = {
  read: () => Promise<boolean>;
  subscribe: (onChange: (enabled: boolean) => void) => { remove: () => void };
};

export function createReduceMotionStore(deps: ReduceMotionDeps) {
  let cache: boolean | null = null;
  const listeners = new Set<(enabled: boolean) => void>();
  let subscription: { remove: () => void } | null = null;
  let generation = 0;

  function subscribe(onChange: (enabled: boolean) => void) {
    listeners.add(onChange);
    if (cache !== null) onChange(cache);

    if (!subscription) {
      generation += 1;
      const thisGeneration = generation;
      let supersededByEvent = false;

      void deps
        .read()
        .then((enabled) => {
          if (thisGeneration !== generation || supersededByEvent) return;
          cache = enabled;
          listeners.forEach((listener) => listener(enabled));
        })
        .catch(() => {
          // Best-effort: a rejected read leaves the cache as it was.
        });

      subscription = deps.subscribe((enabled) => {
        if (thisGeneration !== generation) return;
        supersededByEvent = true;
        cache = enabled;
        listeners.forEach((listener) => listener(enabled));
      });
    }

    return () => {
      listeners.delete(onChange);
      if (listeners.size === 0 && subscription) {
        subscription.remove();
        subscription = null;
        cache = null;
        generation += 1;
      }
    };
  }

  return { subscribe };
}
