const challengeRefreshSafetyWindowMs = 30_000;
const minimumChallengeRefreshDelayMs = 1_000;

export function mobileNativeAuthChallengeRefreshDelayMs(
  expiresAt: string,
  nowMs = Date.now(),
  maximumDelayMs = 5 * 60_000,
) {
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMs)) return maximumDelayMs;
  return Math.max(
    minimumChallengeRefreshDelayMs,
    Math.min(maximumDelayMs, expiresAtMs - nowMs - challengeRefreshSafetyWindowMs),
  );
}
