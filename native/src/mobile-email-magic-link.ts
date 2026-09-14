export function emailMagicLinkTokenFromUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "heyhermes:" || parsed.hostname !== "auth" || parsed.pathname !== "/email-magic-link") return null;
    const token = parsed.searchParams.get("token")?.trim() ?? "";
    return /^[A-Za-z0-9_-]{32,256}$/.test(token) ? token : null;
  } catch {
    return null;
  }
}
