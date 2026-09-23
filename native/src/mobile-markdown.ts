export type MobileMarkdownInlineSegment = {
  kind: "plain" | "bold" | "italic" | "inline_code";
  text: string;
};

export type MobileMarkdownBlock =
  | { kind: "paragraph"; segments: MobileMarkdownInlineSegment[] }
  | { kind: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; segments: MobileMarkdownInlineSegment[] }
  | { kind: "code"; language: string | null; text: string }
  // HPD-808: Hermes and CapChat answer in bullet and numbered lists; they used
  // to run together as one paragraph with the raw "- " markers in it.
  | { kind: "list"; ordered: boolean; items: MobileMarkdownInlineSegment[][] }
  | {
      kind: "table";
      header: MobileMarkdownInlineSegment[][];
      rows: MobileMarkdownInlineSegment[][][];
    };

// Plain character class, no Unicode property escapes: the app's JS engine must parse it.
const WORDLIKE = /[0-9A-Za-z_*\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]/;

// HPD-808: single-marker emphasis, *text* or _text_. CapChat and Hermes put every
// source in it — "*(marketscreener, 21.09.)*" — and it showed raw on the phone.
// A marker must not touch a letter, digit or another marker on its outer side
// (so snake_case and 2*3*4 stay text), and the text inside must not start or end
// with a space. Anything else stays exactly as written.
function italicSegments(text: string): MobileMarkdownInlineSegment[] {
  const segments: MobileMarkdownInlineSegment[] = [];
  const pattern = /([*_])([^*_\n]+?)\1/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const index = match.index;
    const end = index + match[0].length;
    const inner = match[2] || "";
    const before = index > 0 ? text[index - 1] || "" : "";
    const after = text[end] || "";
    if (WORDLIKE.test(before) || WORDLIKE.test(after) || /^\s|\s$/.test(inner)) {
      pattern.lastIndex = index + 1;
      continue;
    }
    if (index > cursor) segments.push({ kind: "plain", text: text.slice(cursor, index) });
    segments.push({ kind: "italic", text: inner });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ kind: "plain", text: text.slice(cursor) });
  return segments;
}

function inlineSegments(text: string): MobileMarkdownInlineSegment[] {
  const segments: MobileMarkdownInlineSegment[] = [];
  const pattern = /(\*\*|__)(.+?)\1|`([^`\n]+)`/g;
  let cursor = 0;
  const pushPlain = (value: string) => {
    if (value) segments.push(...italicSegments(value));
  };
  for (const match of text.matchAll(pattern)) {
    const index = match.index || 0;
    if (index > cursor) pushPlain(text.slice(cursor, index));
    if (match[3] !== undefined) segments.push({ kind: "inline_code", text: match[3] });
    else segments.push({ kind: "bold", text: match[2] || "" });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) pushPlain(text.slice(cursor));
  return segments.length ? segments : [{ kind: "plain", text }];
}

const LIST_ITEM = /^ {0,3}(?:([-*+•])|(\d{1,3})[.)])[ \t]+(.*)$/;

function listBlockAt(lines: string[], start: number) {
  const first = LIST_ITEM.exec(lines[start] || "");
  if (!first) return null;
  const ordered = first[2] !== undefined;
  const items: string[] = [];
  let cursor = start;
  while (cursor < lines.length) {
    const item = LIST_ITEM.exec(lines[cursor] || "");
    if (!item || (item[2] !== undefined) !== ordered) break;
    items.push(item[3] || "");
    cursor += 1;
    // An indented, non-empty line continues the item above it.
    while (cursor < lines.length && /^[ \t]{2,}\S/.test(lines[cursor] || "") && !LIST_ITEM.exec(lines[cursor] || "")) {
      items[items.length - 1] += `\n${(lines[cursor] || "").trim()}`;
      cursor += 1;
    }
  }
  return {
    block: { kind: "list" as const, ordered, items: items.map(inlineSegments) },
    next: cursor,
  };
}

function tableCells(line: string) {
  const value = line.trim();
  if (!value.includes("|")) return null;

  const cells: string[] = [];
  let cell = "";
  let separatorSeen = false;
  let inCode = false;
  let leadingBoundary = false;
  let trailingBoundary = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index] || "";
    const next = value[index + 1] || "";
    if (character === "\\" && next === "|") {
      cell += "|";
      index += 1;
      continue;
    }
    if (character === "`") inCode = !inCode;
    if (character === "|" && !inCode) {
      if (index === 0) leadingBoundary = true;
      if (index === value.length - 1) trailingBoundary = true;
      cells.push(cell.trim());
      cell = "";
      separatorSeen = true;
      continue;
    }
    cell += character;
  }
  cells.push(cell.trim());
  if (!separatorSeen) return null;
  if (leadingBoundary) cells.shift();
  if (trailingBoundary) cells.pop();
  return cells.length ? cells : null;
}

function tableDelimiter(cells: string[] | null, columnCount: number) {
  return Boolean(
    cells &&
    cells.length === columnCount &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell)),
  );
}

function headingBlock(line: string): Extract<MobileMarkdownBlock, { kind: "heading" }> | null {
  const match = /^(?: {0,3})(#{1,6})(?:[ \t]+(.*?)|[ \t]*)$/.exec(line);
  if (!match) return null;
  const content = (match[2] || "").replace(/[ \t]+#+[ \t]*$/, "");
  return {
    kind: "heading",
    level: match[1]!.length as 1 | 2 | 3 | 4 | 5 | 6,
    segments: inlineSegments(content),
  };
}

function tableBlockAt(lines: string[], start: number) {
  const header = tableCells(lines[start] || "");
  if (!header || !header.some(Boolean) || !tableDelimiter(tableCells(lines[start + 1] || ""), header.length)) {
    return null;
  }

  const rows: string[][] = [];
  let cursor = start + 2;
  while (cursor < lines.length && lines[cursor]?.trim()) {
    const cells = tableCells(lines[cursor] || "");
    if (!cells || cells.length !== header.length) break;
    rows.push(cells);
    cursor += 1;
  }
  if (!rows.length) return null;
  return {
    block: {
      kind: "table" as const,
      header: header.map(inlineSegments),
      rows: rows.map((row) => row.map(inlineSegments)),
    },
    next: cursor,
  };
}

export function mobileMarkdownBlocks(text: string): MobileMarkdownBlock[] {
  const blocks: MobileMarkdownBlock[] = [];
  const fence = /^```([^\n`]*)\n([\s\S]*?)\n?```[ \t]*$/gm;
  let cursor = 0;
  const addFlowBlocks = (value: string) => {
    const lines = value.split("\n");
    let paragraphLines: string[] = [];
    const flushParagraph = () => {
      const paragraph = paragraphLines.join("\n").trim();
      if (paragraph) blocks.push({ kind: "paragraph", segments: inlineSegments(paragraph) });
      paragraphLines = [];
    };
    let line = 0;
    while (line < lines.length) {
      if (!lines[line]?.trim()) {
        flushParagraph();
        line += 1;
        continue;
      }
      const heading = headingBlock(lines[line] || "");
      if (heading) {
        flushParagraph();
        blocks.push(heading);
        line += 1;
        continue;
      }
      const table = tableBlockAt(lines, line);
      if (table) {
        flushParagraph();
        blocks.push(table.block);
        line = table.next;
        continue;
      }
      const list = listBlockAt(lines, line);
      if (list) {
        flushParagraph();
        blocks.push(list.block);
        line = list.next;
        continue;
      }
      paragraphLines.push(lines[line] || "");
      line += 1;
    }
    flushParagraph();
  };
  for (const match of text.matchAll(fence)) {
    const index = match.index || 0;
    addFlowBlocks(text.slice(cursor, index));
    blocks.push({
      kind: "code",
      language: (match[1] || "").trim() || null,
      text: (match[2] || "").replace(/\n$/, ""),
    });
    cursor = index + match[0].length;
  }
  addFlowBlocks(text.slice(cursor));
  return blocks;
}
