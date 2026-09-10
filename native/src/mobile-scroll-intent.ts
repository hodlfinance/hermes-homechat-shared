export type MobileScrollIntent = {
  autoFollow: boolean;
  showScrollDown: boolean;
};

export const initialMobileScrollIntent: MobileScrollIntent = {
  autoFollow: true,
  showScrollDown: false,
};

export function mobileScrollIntentAfterScroll(
  _current: MobileScrollIntent,
  distanceFromBottom: number,
  threshold = 96,
): MobileScrollIntent {
  const atBottom = distanceFromBottom <= threshold;
  return {
    autoFollow: atBottom,
    showScrollDown: !atBottom,
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
