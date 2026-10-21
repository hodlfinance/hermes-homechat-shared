import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import Yoga, { Align, Direction, FlexDirection, Gutter, MeasureMode, type Node as YogaNode } from "yoga-layout";

// HPD-1422: Justus, 2026-10-21 07:16, Hey build 138, chat "Home": a long
// markdown answer with a bullet list "went below the fold, I was not able to
// scroll to its end and the next answer overlaps with it". The list was drawn
// in a narrow column and ran past the bottom of its own message.
//
// React Native lays out with Yoga, so this test runs the real Yoga engine on
// the transcript styles read from surface.tsx: an assistant message holding a
// paragraph and a bullet list, followed by the user's next message.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const styleSheet = surface.slice(surface.lastIndexOf("StyleSheet.create({"));

type StyleValue = string | number;
function styleOf(name: string): Record<string, StyleValue> {
  const match = styleSheet.match(new RegExp(`\\n  ${name}: \\{\\n([\\s\\S]*?)\\n  \\},`));
  assert.ok(match, `style ${name} not found in surface.tsx`);
  const style: Record<string, StyleValue> = {};
  for (const line of (match[1] ?? "").split("\n")) {
    const prop = line.match(/^\s+(\w+): ("[^"]*"|-?\d+(?:\.\d+)?),?$/);
    const [, key, raw] = prop ?? [];
    if (key && raw) style[key] = raw.startsWith("\"") ? raw.slice(1, -1) : Number(raw);
  }
  return style;
}

const ALIGN: Record<string, Align | undefined> = {
  "flex-start": Align.FlexStart,
  "flex-end": Align.FlexEnd,
  center: Align.Center,
  stretch: Align.Stretch,
};

function view(...styles: Record<string, StyleValue>[]): YogaNode {
  const node = Yoga.Node.create();
  const style = Object.assign({}, ...styles) as Record<string, StyleValue>;
  for (const [key, value] of Object.entries(style)) {
    if (key === "flex") node.setFlex(Number(value));
    else if (key === "flexGrow") node.setFlexGrow(Number(value));
    else if (key === "flexShrink") node.setFlexShrink(Number(value));
    else if (key === "flexBasis") node.setFlexBasis(value as number | "auto" | `${number}%`);
    else if (key === "flexDirection") node.setFlexDirection(value === "row" ? FlexDirection.Row : FlexDirection.Column);
    else if (key === "alignSelf") node.setAlignSelf(ALIGN[String(value)] ?? Align.Auto);
    else if (key === "alignItems") node.setAlignItems(ALIGN[String(value)] ?? Align.Stretch);
    else if (key === "gap") node.setGap(Gutter.All, Number(value));
    else if (key === "minWidth") node.setMinWidth(value as number | `${number}%`);
    else if (key === "maxWidth") node.setMaxWidth(value as number | `${number}%`);
    else if (key === "paddingHorizontal") { node.setPadding(0, Number(value)); node.setPadding(2, Number(value)); }
    else if (key === "paddingVertical") { node.setPadding(1, Number(value)); node.setPadding(3, Number(value)); }
  }
  return node;
}

// Deterministic stand-in for iOS text measurement: fixed glyph width, greedy word wrap.
const GLYPH = 8.6;
const LINE = 25;
function wrappedLines(text: string, maxWidth: number) {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length * GLYPH > maxWidth && current) {
      lines.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) lines.push(current);
  return lines;
}

const texts: { node: YogaNode; text: string }[] = [];
function text(content: string, ...styles: Record<string, StyleValue>[]): YogaNode {
  const node = view(...styles);
  node.setMeasureFunc((width, widthMode) => {
    const maxWidth = widthMode === MeasureMode.Undefined ? Infinity : width;
    const lines = wrappedLines(content, maxWidth);
    const natural = Math.max(...lines.map((line) => line.length * GLYPH));
    return { width: widthMode === MeasureMode.Exactly ? width : Math.min(natural, maxWidth), height: lines.length * LINE };
  });
  texts.push({ node, text: content });
  return node;
}

function append(parent: YogaNode, ...children: YogaNode[]) {
  for (const child of children) parent.insertChild(child, parent.getChildCount());
  return parent;
}

function bottom(node: YogaNode) {
  let top = 0;
  for (let current: YogaNode | null = node; current; current = current.getParent()) top += current.getComputedTop();
  return top + node.getComputedHeight();
}

test("HPD-1422: a long bullet answer keeps its full height and the next message starts below it", () => {
  // The answer from Justus' screenshot, shortened to its shape.
  const bullets = [
    "Workspace files: memory files (memories/USER.md, memories/MEMORY.md), cron jobs (cron/jobs.json) and task data (kanban.db, ranked-tasks/).",
    "Obsidian vault and Basic Memory: documents such as the Steueramt letter are saved under Hermes/Knowledge.",
    "Gmail: your mail stays in your Google account. I read it through the connection, and I do not store a copy.",
    "Honcho: an external memory service. I can't see where it stores data.",
    "OpenRouter: the model provider. Your messages are sent to it to generate answers, so it processes them.",
  ];
  const transcriptWidth = 390 - 2 * Number(styleOf("chatMessagesInner").paddingHorizontal);
  const transcript = view({ gap: Number(styleOf("chatMessagesInner").gap) });
  transcript.setWidth(transcriptWidth);

  const answer = view(styleOf("message"), styleOf("assistantMessage"));
  const blocks = view(styleOf("markdownBlocks"));
  const list = view(styleOf("markdownList"));
  for (const bullet of bullets) {
    append(
      list,
      append(
        view(styleOf("markdownListItem")),
        text("•", styleOf("markdownListMarker")),
        append(view(styleOf("markdownListBody")), text(bullet)),
      ),
    );
  }
  append(blocks, text("Your data lives in a few places:"), list);
  append(answer, append(view(), blocks), text("7:15 AM", styleOf("messageTime")));
  const nextMessage = view(styleOf("message"), styleOf("userMessage"));
  append(nextMessage, text("Ok but where is the server"));
  append(transcript, answer, nextMessage);

  transcript.calculateLayout(transcriptWidth, undefined, Direction.LTR);

  // The answer uses the transcript's width; it is not squeezed into a narrow column.
  assert.equal(answer.getComputedWidth(), transcriptWidth);
  // Every text box is as tall as its text wrapped at the width it is drawn with.
  for (const { node, text: content } of texts) {
    assert.equal(
      node.getComputedHeight(),
      wrappedLines(content, node.getComputedWidth()).length * LINE,
      `"${content.slice(0, 24)}" drawn ${node.getComputedWidth()} wide must be exactly as tall as its lines`,
    );
  }
  // Each container is exactly as tall as what it holds: nothing runs past a message.
  const content = answer.getChild(0);
  assert.equal(content.getComputedHeight(), content.getChild(0).getComputedHeight());
  const lastBullet = list.getChild(list.getChildCount() - 1);
  assert.ok(bottom(lastBullet) <= bottom(content));
  assert.ok(bottom(answer) <= nextMessage.getComputedTop());
  transcript.freeRecursive();
});
