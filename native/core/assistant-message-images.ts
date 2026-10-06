// HPD-1062. An image the agent made (a chart, for example) reaches the chat as
// an artifact reference on the assistant message: source "hermes", kind
// "image", version 1, and an href to the plane's authenticated read route
// /hermes/runs/<runId>/images/<imageId>. The bytes come back as JSON (base64),
// because every host transport (the HODL native R8 fetch reads bodies as text)
// carries JSON unchanged. Anything else is ignored, so a reference this client
// does not know never breaks a message.

export const ASSISTANT_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type AssistantImageMimeType = (typeof ASSISTANT_IMAGE_MIME_TYPES)[number];
/** The plane refuses larger uploads; a larger answer is not an image this client shows. */
export const ASSISTANT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
/** At most this many images under one message. */
export const ASSISTANT_IMAGE_MAX_PER_MESSAGE = 6;

const IMAGE_ID = /^img_[0-9a-f]{32}$/;
const RUN_ID = /^[A-Za-z0-9_-]{1,160}$/;
const IMAGE_HREF = /^\/hermes\/runs\/([A-Za-z0-9_-]{1,160})\/images\/(img_[0-9a-f]{32})$/;
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

export type AssistantMessageImage = {
  key: string;
  runId: string;
  imageId: string;
  label: string;
};

type ReferenceLike = Readonly<Record<string, unknown>>;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

/** The agent images of one assistant message, in order, each once. */
export function assistantMessageImages(
  references: readonly ReferenceLike[] | null | undefined,
): AssistantMessageImage[] {
  const images: AssistantMessageImage[] = [];
  const seen = new Set<string>();
  for (const reference of references ?? []) {
    if (
      reference?.source !== "hermes" ||
      reference.kind !== "image" ||
      reference.version !== 1 ||
      typeof reference.href !== "string"
    ) continue;
    const match = IMAGE_HREF.exec(reference.href);
    if (!match || reference.id !== match[2] || seen.has(match[2]!)) continue;
    seen.add(match[2]!);
    images.push({
      key: `${match[1]}:${match[2]}`,
      runId: match[1]!,
      imageId: match[2]!,
      label: typeof reference.label === "string" && reference.label.trim() ? reference.label.trim().slice(0, 120) : "",
    });
    if (images.length >= ASSISTANT_IMAGE_MAX_PER_MESSAGE) break;
  }
  return images;
}

function base64ByteLength(data: string): number {
  const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  return (data.length / 4) * 3 - padding;
}

/**
 * The data URI to draw for the plane's answer to one image read, or null when
 * the answer is not exactly that image in an allowed format and size.
 */
export function assistantImageDataUri(
  response: unknown,
  expected: { runId: string; imageId: string },
): string | null {
  const image = record(record(response)?.image);
  if (!image) return null;
  const { id, runId, mimeType, size, data } = image;
  if (
    !IMAGE_ID.test(expected.imageId) || !RUN_ID.test(expected.runId) ||
    id !== expected.imageId || runId !== expected.runId ||
    typeof mimeType !== "string" || !(ASSISTANT_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType) ||
    typeof size !== "number" || !Number.isSafeInteger(size) || size <= 0 || size > ASSISTANT_IMAGE_MAX_BYTES ||
    typeof data !== "string" || !data || data.length % 4 !== 0 || !BASE64.test(data) ||
    base64ByteLength(data) !== size
  ) return null;
  return `data:${mimeType};base64,${data}`;
}

/** The plane's read path for one image; the same shape the href carries. */
export function assistantImagePath(runId: string, imageId: string): string | null {
  if (!RUN_ID.test(runId) || !IMAGE_ID.test(imageId)) return null;
  return `/hermes/runs/${runId}/images/${imageId}`;
}
