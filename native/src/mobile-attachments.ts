import type { AppLocale } from "../core/index";
import { interactionUiCopy } from "../core/interaction-ui-copy";

export const MOBILE_ATTACHMENT_MAX_COUNT = 5;
export const MOBILE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const MOBILE_ATTACHMENT_TOTAL_MAX_BYTES = 10 * 1024 * 1024;

export type MobileAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: "image" | "file";
  dataBase64: string;
};

export function mobileAttachmentBytes(value: string): { dataBase64: string; size: number } {
  const dataBase64 = value
    .trim()
    .replace(/^data:[^,]*;base64,/i, "")
    .replace(/\s+/g, "");
  if (
    !dataBase64 ||
    dataBase64.length % 4 === 1 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(dataBase64) ||
    /=/.test(dataBase64.slice(0, -2))
  ) {
    throw new Error("The selected attachment could not be read.");
  }
  const padding = dataBase64.endsWith("==") ? 2 : dataBase64.endsWith("=") ? 1 : 0;
  const size = Math.floor((dataBase64.length * 3) / 4) - padding;
  if (size <= 0) throw new Error("The selected attachment could not be read.");
  return { dataBase64, size };
}

export function validateMobileAttachmentSelection(
  current: readonly MobileAttachment[],
  incoming: readonly MobileAttachment[],
  locale: AppLocale = "en",
): { accepted: MobileAttachment[]; error: string | null } {
  const copy = interactionUiCopy(locale);
  const candidates = [...current, ...incoming];
  if (candidates.length > MOBILE_ATTACHMENT_MAX_COUNT) {
    return { accepted: [...current], error: copy["You can attach up to {count} files."].replace("{count}", new Intl.NumberFormat(locale).format(MOBILE_ATTACHMENT_MAX_COUNT)) };
  }
  const oversized = incoming.find((attachment) => attachment.size > MOBILE_ATTACHMENT_MAX_BYTES);
  if (oversized) {
    return { accepted: [...current], error: copy["{name} is larger than 5 MB."].replace("{name}", () => oversized.name) };
  }
  const totalBytes = candidates.reduce((sum, attachment) => sum + attachment.size, 0);
  if (totalBytes > MOBILE_ATTACHMENT_TOTAL_MAX_BYTES) {
    return { accepted: [...current], error: copy["Attachments can be up to 10 MB in total."] };
  }
  return { accepted: candidates, error: null };
}

export function mobileAttachmentPayload(attachments: readonly MobileAttachment[]) {
  return attachments.map(({ id: _id, ...attachment }) => attachment);
}
