export type MobileMarkdownInlineSegment = {
  kind: "plain" | "bold" | "inline_code";
  text: string;
};

export type MobileMarkdownBlock =
  | { kind: "paragraph"; segments: MobileMarkdownInlineSegment[] }
  | { kind: "code"; language: string | null; text: string }
  | {
      kind: "table";
      header: MobileMarkdownInlineSegment[][];
      rows: MobileMarkdownInlineSegment[][][];
    };

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
      const table = tableBlockAt(lines, line);
      if (table) {
        flushParagraph();
        blocks.push(table.block);
        line = table.next;
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
