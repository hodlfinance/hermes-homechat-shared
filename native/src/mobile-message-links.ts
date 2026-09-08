import {
  assistantMessageLinkSegments,
  type AssistantMessageLinkSegment,
} from "../core/index";

export function mobileAssistantLinkSegments(markdown: string): AssistantMessageLinkSegment[] {
  const segments = assistantMessageLinkSegments(markdown).map((segment) => ({ ...segment }));
  if (!segments.length) return segments;

  const leadingWhitespace = markdown.match(/^\s+/)?.[0] ?? "";
  const trailingWhitespace = markdown.match(/\s+$/)?.[0] ?? "";
  const first = segments[0];
  const last = segments[segments.length - 1];

  if (leadingWhitespace && first && !first.text.startsWith(leadingWhitespace)) {
    first.text = `${leadingWhitespace}${first.text}`;
  }
  if (trailingWhitespace && last && !last.text.endsWith(trailingWhitespace)) {
    last.text = `${last.text}${trailingWhitespace}`;
  }

  return segments;
}
