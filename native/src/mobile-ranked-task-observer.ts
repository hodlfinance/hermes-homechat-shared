/** Read visible task projections on the existing shell tick, without overlap. */
export function createMobileRankedTaskObserver(input: {
  shouldObserve: () => boolean;
  reload: () => Promise<void>;
}) {
  let inFlight = false;
  return {
    async observe() {
      if (inFlight || !input.shouldObserve()) return;
      inFlight = true;
      try {
        await input.reload();
      } finally {
        inFlight = false;
      }
    },
  };
}

export type MobileRankedTaskNotice = "load_error" | "change_error" | null;

/** A projection read cannot dismiss or replace a failed task mutation. */
export function mobileRankedTaskNoticeAfterRead(
  previous: MobileRankedTaskNotice,
  outcome: "started" | "succeeded" | "failed",
  background: boolean,
): MobileRankedTaskNotice {
  if (background && previous === "change_error") return previous;
  if (outcome === "started") return background ? previous : null;
  if (outcome === "failed") return "load_error";
  return background && previous === "load_error" ? null : previous;
}
