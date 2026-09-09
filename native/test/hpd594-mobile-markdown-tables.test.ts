import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mobileMarkdownBlocks } from "../src/mobile-markdown";

const surfaceSource = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

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

test("the shared chat renderer keeps tables inside the transcript without a nested scroll surface", () => {
  const rendererStart = surfaceSource.indexOf("function LinkedMessageText(");
  const rendererEnd = surfaceSource.indexOf("function PendingAssistantMessage(", rendererStart);
  const renderer = surfaceSource.slice(rendererStart, rendererEnd);
  assert.ok(rendererStart > 0 && rendererEnd > rendererStart);
  assert.match(renderer, /block\.kind === "table"/);
  assert.doesNotMatch(renderer, /<ScrollView/);
  assert.match(renderer, /style=\{styles\.markdownTableViewport\}/);
  assert.match(surfaceSource, /markdownTableViewport:\s*\{[\s\S]*?maxWidth: "100%",[\s\S]*?minWidth: 0/);
  assert.match(surfaceSource, /markdownTable:\s*\{[\s\S]*?alignSelf: "stretch",[\s\S]*?maxWidth: "100%"/);
  assert.match(surfaceSource, /markdownTableCell:\s*\{[\s\S]*?flex: 1,[\s\S]*?flexBasis: 0,[\s\S]*?minWidth: 0/);
  assert.match(surfaceSource, /markdownTableHeaderCell:\s*\{[\s\S]*?backgroundColor: palette\.tealSoft/);
  assert.match(surfaceSource, /markdownTableBoldText:\s*\{[\s\S]*?fontWeight: "700"/);
  assert.equal((surfaceSource.match(/mobileMarkdownBlocks\(text\)/g) || []).length, 1);
  assert.equal((surfaceSource.match(/<LinkedMessageText /g) || []).length, 2);
});
