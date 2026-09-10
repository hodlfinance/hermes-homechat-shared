export type MobileScrollIntent = {
  autoFollow: boolean;
  showScrollDown: boolean;
};

export const initialMobileScrollIntent: MobileScrollIntent = {
  autoFollow: true,
  showScrollDown: false,
};

export function mobileScrollDistanceFromBottom(input: {
  contentHeight: number;
  offsetY: number;
  viewportHeight: number;
}) {
  return Math.max(0, input.contentHeight - input.offsetY - input.viewportHeight);
}

export function mobileScrollMomentumExpected(
  contentOffsetY: number,
  targetContentOffsetY: number | undefined,
  velocityY: number | undefined,
) {
  if (Number.isFinite(targetContentOffsetY)) {
    return Math.abs((targetContentOffsetY ?? contentOffsetY) - contentOffsetY) > 1;
  }
  return Number.isFinite(velocityY) && Math.abs(velocityY ?? 0) > 0.01;
}

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
