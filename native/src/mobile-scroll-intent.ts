export type MobileScrollIntent = {
  autoFollow: boolean;
  showScrollDown: boolean;
};

export const initialMobileScrollIntent: MobileScrollIntent = {
  autoFollow: true,
  showScrollDown: false,
};

export function mobileScrollIntentAfterScroll(
  current: MobileScrollIntent,
  distanceFromBottom: number,
  threshold = 96,
): MobileScrollIntent {
  const atBottom = distanceFromBottom <= threshold;
  return {
    autoFollow: atBottom,
    showScrollDown: atBottom ? false : current.showScrollDown,
  };
}

export function mobileScrollIntentAfterContent(current: MobileScrollIntent) {
  return {
    ...current,
    showScrollDown: !current.autoFollow,
    scrollToEnd: current.autoFollow,
  };
}

export function mobileScrollIntentAfterJump(): MobileScrollIntent {
  return { autoFollow: true, showScrollDown: false };
}
