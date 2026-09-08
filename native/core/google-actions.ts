export const googleActionKeys = ["google_gmail_draft", "google_gmail_send", "google_calendar_create", "google_drive_write"] as const;
export type GoogleActionKey = (typeof googleActionKeys)[number];
export type GoogleActionPayload =
  | { draftId: string; to: string; subject: string; body: string }
  | { to: string; subject: string; body: string }
  | { summary: string; start: string; end: string; description: string; location: string }
  | { name: string; content: string; mimeType: string };

function text(value: unknown) {
  return String(value || "");
}

function singleLine(value: unknown, label: string, maxLength: number) {
  const normalized = text(value);
  if (!normalized || normalized.length > maxLength || /[\r\n]/.test(normalized)) {
    throw new Error(`${label} is missing, too long, or contains a line break.`);
  }
  return normalized;
}

export function normalizeGoogleActionPayload(action: GoogleActionKey, input: unknown): GoogleActionPayload {
  const source = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  if (action === "google_gmail_send" || action === "google_gmail_draft") {
    const to = singleLine(source.to, "Gmail recipient", 320).trim();
    if (!/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/u.test(to)) throw new Error("Gmail recipient must be one email address.");
    const subject = singleLine(source.subject, "Gmail subject", 998);
    const body = text(source.body);
    if (body.length > 1_000_000) throw new Error("Gmail body is too large.");
    if (action === "google_gmail_draft") {
      const draftId = text(source.draftId ?? source.draft_id).trim();
      if (draftId && !/^[A-Za-z0-9_-]{1,200}$/.test(draftId)) throw new Error("Gmail draft id is invalid.");
      return { draftId, to, subject, body };
    }
    return { to, subject, body };
  }
  if (action === "google_calendar_create") {
    const summary = singleLine(source.summary, "Calendar summary", 500);
    const start = singleLine(source.start, "Calendar start", 100);
    const end = singleLine(source.end, "Calendar end", 100);
    if (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(end) <= Date.parse(start)) {
      throw new Error("Calendar start and end must be valid ordered timestamps.");
    }
    const description = text(source.description);
    const location = text(source.location);
    if (description.length > 10_000 || location.length > 1_000 || /[\r\n]/.test(location)) {
      throw new Error("Calendar description or location is too large or invalid.");
    }
    return { summary, start, end, description, location };
  }
  const name = singleLine(source.name, "Drive file name", 255);
  const content = text(source.content);
  if (content.length > 1_000_000) throw new Error("Drive content is too large.");
  const mimeType = text(source.mimeType ?? source.mime_type) || "text/plain";
  if (!/^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/.test(mimeType)) throw new Error("Drive MIME type is invalid.");
  return { name, content, mimeType };
}
