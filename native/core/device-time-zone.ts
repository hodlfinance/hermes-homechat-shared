/**
 * HPD-1285: the client reports the device's IANA time zone with every request,
 * so the customer's Hermes runs in his zone and follows him when he travels.
 * The Hey Control Plane stores it per workspace (hey-hermes apps/api/src/workspace-time-zone.ts).
 * A runtime that cannot name its zone sends nothing; the workspace then keeps
 * its stored zone, or the default.
 */
export const DEVICE_TIME_ZONE_HEADER = "X-Hey-Time-Zone";

export function deviceTimeZone(): string | undefined {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof zone === "string" && zone.trim() ? zone.trim() : undefined;
  } catch {
    return undefined;
  }
}

export function deviceTimeZoneHeaders(): Record<string, string> {
  const zone = deviceTimeZone();
  return zone ? { [DEVICE_TIME_ZONE_HEADER]: zone } : {};
}
