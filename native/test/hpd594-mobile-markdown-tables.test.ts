import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mobileMarkdownBlocks } from "../src/mobile-markdown";

const surfaceSource = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const financeArtifactCardSource = readFileSync(new URL("../src/FinanceArtifactCard.tsx", import.meta.url), "utf8");

test("native Markdown parses a header and several table rows without changing cell order", () => {
  const blocks = mobileMarkdownBlocks([
    "Before the table.",
    "",
    "| Name | State | Note |",
    "| --- | --- | --- |",
    "| Alpha | Open | First |",
    "| Beta | Done | Second |",
    "",
    "After the table.",
  ].join("\n"));

  assert.equal(blocks.length, 3);
  assert.equal(blocks[0]?.kind, "paragraph");
  assert.equal(blocks[1]?.kind, "table");
  assert.equal(blocks[2]?.kind, "paragraph");
  const table = blocks[1];
  assert.ok(table?.kind === "table");
  assert.deepEqual(table.header.map((cell) => cell.map((segment) => segment.text).join("")), ["Name", "State", "Note"]);
  assert.deepEqual(
    table.rows.map((row) => row.map((cell) => cell.map((segment) => segment.text).join(""))),
    [["Alpha", "Open", "First"], ["Beta", "Done", "Second"]],
  );
});

test("ATX headings become semantic blocks without leaking Markdown markers", () => {
  const blocks = mobileMarkdownBlocks([
    "## **View**",
    "",
    "Paragraph.",
    "",
    "###### Detail `score` ######",
  ].join("\n"));

  assert.deepEqual(blocks, [
    {
      kind: "heading",
      level: 2,
      segments: [{ kind: "bold", text: "View" }],
    },
    {
      kind: "paragraph",
      segments: [{ kind: "plain", text: "Paragraph." }],
    },
    {
      kind: "heading",
      level: 6,
      segments: [
        { kind: "plain", text: "Detail " },
        { kind: "inline_code", text: "score" },
      ],
    },
  ]);
  assert.doesNotMatch(JSON.stringify(blocks), /## View|###### Detail/);
});

test("both native Markdown renderers present semantic headings", () => {
  for (const source of [surfaceSource, financeArtifactCardSource]) {
    assert.match(source, /block\.kind === "heading"/);
    assert.match(source, /variant="heading"/);
    assert.match(source, /accessibilityRole=\{[^\n]*"header"/);
    assert.match(source, /markdownHeadingLargeText/);
  }
});

test("table cells keep empty values, bold, inline code, and pipes inside code", () => {
  const [table] = mobileMarkdownBlocks([
    "| Key | Value | Empty |",
    "| --- | --- | --- |",
    "| **Strong** | `a|b` | |",
  ].join("\n"));
  assert.ok(table?.kind === "table");
  assert.deepEqual(table.rows[0], [
    [{ kind: "bold", text: "Strong" }],
    [{ kind: "inline_code", text: "a|b" }],
    [{ kind: "plain", text: "" }],
  ]);
});

test("an escaped final pipe remains cell content instead of becoming a table boundary", () => {
  const [table] = mobileMarkdownBlocks([
    "| Key | Value",
    "| --- | ---",
    "| escaped | final \\|",
  ].join("\n"));
  assert.ok(table?.kind === "table");
  assert.deepEqual(table.rows[0], [
    [{ kind: "plain", text: "escaped" }],
    [{ kind: "plain", text: "final |" }],
  ]);
});

test("incomplete or invalid table syntax remains lossless paragraph text", () => {
  const invalid = [
    "| Name | State |",
    "| -- | --- |",
    "| Alpha | Open |",
  ].join("\n");
  assert.deepEqual(mobileMarkdownBlocks(invalid), [{
    kind: "paragraph",
    segments: [{ kind: "plain", text: invalid }],
  }]);

  const incomplete = "| Name | State |\n| --- | --- |";
  assert.deepEqual(mobileMarkdownBlocks(incomplete), [{
    kind: "paragraph",
    segments: [{ kind: "plain", text: incomplete }],
  }]);
});

test("the shared chat renderer keeps tables inside the transcript; a wide table scrolls sideways with fixed column widths (HPD-2263)", () => {
  const rendererStart = surfaceSource.indexOf("function LinkedMessageText(");
  const rendererEnd = surfaceSource.indexOf("function PendingAssistantMessage(", rendererStart);
  const renderer = surfaceSource.slice(rendererStart, rendererEnd);
  assert.ok(rendererStart > 0 && rendererEnd > rendererStart);
  assert.match(renderer, /block\.kind === "table"/);
  // HPD-2263: the only scroll view in the renderer is the table's sideways one,
  // and every cell carries a fixed width so its text never measures at zero.
  assert.equal((renderer.match(/<ScrollView/g) || []).length, 1);
  assert.match(renderer, /<ScrollView\s+key=\{`table-\$\{blockIndex\}`\}\s+horizontal/);
  assert.match(renderer, /style=\{styles\.markdownTableViewport\}/);
  assert.match(renderer, /markdownTableCellWidth\(block, cellIndex\)/);
  assert.match(surfaceSource, /return \{ width, flexGrow: width, flexShrink: 0 \};/);
  assert.match(surfaceSource, /markdownTableViewport:\s*\{[\s\S]*?maxWidth: "100%",[\s\S]*?minWidth: 0/);
  assert.match(surfaceSource, /markdownTableScrollContent:\s*\{\s*flexGrow: 1,/);
  assert.match(surfaceSource, /markdownTable:\s*\{\s*flexGrow: 1,/);
  assert.doesNotMatch(surfaceSource, /markdownTableCell:\s*\{[^}]*flexBasis: 0/);
  assert.match(surfaceSource, /markdownTableHeaderCell:\s*\{[\s\S]*?backgroundColor: palette\.tealSoft/);
  assert.match(surfaceSource, /markdownTableBoldText:\s*\{[\s\S]*?fontWeight: "700"/);
  assert.equal((surfaceSource.match(/mobileMarkdownBlocks\(text\)/g) || []).length, 1);
  // Persisted answers, the transient answer, and HPD-678's durable approval
  // preview all share the same non-scrolling Markdown renderer.
  assert.equal((surfaceSource.match(/<LinkedMessageText /g) || []).length, 3);
});

// HPD-2263: the engine's BTC answer wrote a key/value table under a blank
// header row; it showed on the phone as raw pipe text.
test("a table with a blank header row renders its rows without a header", () => {
  const blocks = mobileMarkdownBlocks([
    "Bitcoin today:",
    "| | |",
    "|---|---|",
    "| Price | 57,457.08 USD |",
    "| Day | **−7.01 %** |",
    "",
    "After.",
  ].join("\n"));
  assert.equal(blocks.length, 3);
  const table = blocks[1];
  assert.ok(table?.kind === "table");
  assert.deepEqual(table.header, []);
  assert.deepEqual(table.rows, [
    [[{ kind: "plain", text: "Price" }], [{ kind: "plain", text: "57,457.08 USD" }]],
    [[{ kind: "plain", text: "Day" }], [{ kind: "bold", text: "−7.01 %" }]],
  ]);
  assert.doesNotMatch(JSON.stringify(blocks), /\|/);
  for (const source of [surfaceSource, financeArtifactCardSource]) {
    assert.match(source, /\(block\.header\.length \? \[block\.header, \.\.\.block\.rows\] : block\.rows\)\.map\(/);
    assert.match(source, /block\.header\.length > 0 && rowIndex === 0 && styles\.markdownTableHeaderCell/);
  }
});

// HPD-2263: a six-column table split its header into single letters because
// every column got an equal share of the bubble.
test("table columns size to their content: never under the minimum, never break a word, capped for long text", async () => {
  const { markdownTableColumnWidths, mobileMarkdownBlocks, MARKDOWN_TABLE_COLUMN_MIN_WIDTH, MARKDOWN_TABLE_COLUMN_MAX_WIDTH } = await import("../src/mobile-markdown");
  const [block] = mobileMarkdownBlocks([
    "| Position | Amount | Last price | Value | Share | Note |",
    "|---|---|---|---|---|---|",
    "| AAPL | 10 | 344.86 USD | 3,449 USD | 42.2% | a very long remark that keeps going on and on and should wrap inside its column |",
  ].join("\n"));
  assert.equal(block?.kind, "table");
  if (block?.kind !== "table") return;
  const widths = markdownTableColumnWidths(block);
  assert.equal(widths.length, 6);
  assert.ok(widths.every((width) => width >= MARKDOWN_TABLE_COLUMN_MIN_WIDTH));
  // "Position" fits on one line: at least 8 header characters wide.
  assert.ok(widths[0]! >= 8 * 9, `Position column ${widths[0]}`);
  assert.ok(widths[2]! >= "344.86 USD".length * 8, `price column ${widths[2]}`);
  assert.equal(widths[5], MARKDOWN_TABLE_COLUMN_MAX_WIDTH);
  // Six content-sized columns are wider than a phone bubble: the table scrolls.
  assert.ok(widths.reduce((sum, width) => sum + width, 0) > 360);
  const [narrow] = mobileMarkdownBlocks("| a | b |\n|---|---|\n| 1 | 2 |");
  if (narrow?.kind !== "table") throw new Error("narrow table");
  assert.deepEqual(markdownTableColumnWidths(narrow), [MARKDOWN_TABLE_COLUMN_MIN_WIDTH, MARKDOWN_TABLE_COLUMN_MIN_WIDTH]);
});
