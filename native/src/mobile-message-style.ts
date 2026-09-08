import type { AssistantMessageSegmentKind } from "../core/index";

// The style a segment is drawn in is looked up by the segment's own name.
// It is never chosen by the segment's position in the list: two styles put
// into an array in the wrong order would still pass a positional test, and
// that is the defect this module exists to make impossible.
export type AssistantSegmentStyleName = "messageText" | "messageTextBold";

const ASSISTANT_SEGMENT_STYLE_NAMES: Record<AssistantMessageSegmentKind, AssistantSegmentStyleName> = {
  plain: "messageText",
  bold: "messageTextBold",
};

export const assistantSegmentKinds: readonly AssistantMessageSegmentKind[] = Object.keys(
  ASSISTANT_SEGMENT_STYLE_NAMES,
) as AssistantMessageSegmentKind[];

export function assistantSegmentStyleName(kind: AssistantMessageSegmentKind): AssistantSegmentStyleName {
  return ASSISTANT_SEGMENT_STYLE_NAMES[kind];
}
