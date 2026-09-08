export type MobileMarkdownInlineSegment = {
  kind: "plain" | "bold" | "inline_code";
  text: string;
};

export type MobileMarkdownBlock =
  | { kind: "paragraph"; segments: MobileMarkdownInlineSegment[] }
  | { kind: "code"; language: string | null; text: string };

function inlineSegments(text: string): MobileMarkdownInlineSegment[] {
  const segments: MobileMarkdownInlineSegment[] = [];
  const pattern = /(\*\*|__)(.+?)\1|`([^`\n]+)`/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index || 0;
    if (index > cursor) segments.push({ kind: "plain", text: text.slice(cursor, index) });
    if (match[3] !== undefined) segments.push({ kind: "inline_code", text: match[3] });
    else segments.push({ kind: "bold", text: match[2] || "" });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) segments.push({ kind: "plain", text: text.slice(cursor) });
  return segments.length ? segments : [{ kind: "plain", text }];
}

export function mobileMarkdownBlocks(text: string): MobileMarkdownBlock[] {
  const blocks: MobileMarkdownBlock[] = [];
  const fence = /^```([^\n`]*)\n([\s\S]*?)\n?```[ \t]*$/gm;
  let cursor = 0;
  const addParagraphs = (value: string) => {
    for (const paragraph of value.trim().split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)) {
      blocks.push({ kind: "paragraph", segments: inlineSegments(paragraph) });
    }
  };
  for (const match of text.matchAll(fence)) {
    const index = match.index || 0;
    addParagraphs(text.slice(cursor, index));
    blocks.push({
      kind: "code",
      language: (match[1] || "").trim() || null,
      text: (match[2] || "").replace(/\n$/, ""),
    });
    cursor = index + match[0].length;
  }
  addParagraphs(text.slice(cursor));
  return blocks;
}
