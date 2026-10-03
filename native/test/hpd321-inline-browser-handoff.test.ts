import assert from "node:assert/strict";
import test from "node:test";
import { assistantMessageLinkSegments, normalizeAssistantMarkdownLinks } from "../core/assistant-message-links";
import { mobileMarkdownBlocks, type MobileMarkdownBlock } from "../src/mobile-markdown";
import { mobileAssistantLinkSegments } from "../src/mobile-message-links";

const href = "/api/workspace/preview/4321/browser/00000000-1111-4222-8333-444444444444";

function inlineSegments(blocks: MobileMarkdownBlock[]) {
  return blocks.flatMap((block) => block.kind === "paragraph" || block.kind === "heading"
    ? block.segments
    : block.kind === "list" ? block.items.flat()
    : block.kind === "table" ? [...block.header, ...block.rows.flat()].flat()
    : []);
}

test("the Native Markdown parser leaves the handoff eligible for its actual link renderer", () => {
  for (const input of [
    `Hier übernehmen: \`${href}\`.`, `- Hier übernehmen: \`${href}\``,
    `## \`${href}\``, `| Browser |\n| --- |\n| \`${href}\` |`,
  ]) {
    const segments = inlineSegments(mobileMarkdownBlocks(input));
    assert.equal(segments.some((segment) => segment.kind === "inline_code" && segment.text === href), false);
    const links = segments.filter((segment) => segment.kind !== "inline_code")
      .flatMap((segment) => mobileAssistantLinkSegments(segment.text).filter((part) => part.href));
    assert.deepEqual(links.map((link) => link.href), [href]);
  }
});

test("Native parsing preserves code examples and rejected handoffs", () => {
  for (const body of [href, `\`${href}\``]) {
    const fenced = `\`\`\`text\n${body}\n\`\`\``;
    assert.deepEqual(mobileMarkdownBlocks(fenced), [{ kind: "code", language: "text", text: body }]);
  }
  for (const value of [`curl ${href}`, "console.log(1)", `https://foreign.example${href}`,
    `${href}?token=synthetic`, `${href}#fragment`, href.replace("4321", "4200"),
    `${href}/extra`, href.replace("4222", "1222"), href.replace("8333", "7333")]) {
    assert.deepEqual(mobileMarkdownBlocks(`\`${value}\``), [
      { kind: "paragraph", segments: [{ kind: "inline_code", text: value }] },
    ]);
  }
});

test("the Native parser keeps ordinary plain URLs and inline code unchanged", () => {
  assert.deepEqual(mobileMarkdownBlocks("Doku: https://example.com/a_b"), [
    { kind: "paragraph", segments: [{ kind: "plain", text: "Doku: https://example.com/a_b" }] },
  ]);
  assert.deepEqual(mobileMarkdownBlocks("`/api/workspace/preview/4200/page`"), [
    { kind: "paragraph", segments: [{ kind: "inline_code", text: "/api/workspace/preview/4200/page" }] },
  ]);
});

test("an exact inline-code Browser handoff produces a clickable Web link and Native segment", () => {
  const input = `Hier übernehmen: \`${href}\`.`;
  assert.equal(normalizeAssistantMarkdownLinks(input), `Hier übernehmen: [${href}](${href}).`);
  const links = assistantMessageLinkSegments(input).filter((segment) => segment.href);
  assert.equal(links.length, 1);
  assert.equal(links[0]?.href, href);
});

test("fenced examples, commands and other inline code remain code", () => {
  for (const input of [`\`\`\`text\n${href}\n\`\`\``, `\`curl ${href}\``, "`console.log(1)`"]) {
    assert.equal(normalizeAssistantMarkdownLinks(input), input);
  }
});

test("foreign origins, capabilities, wrong ports and malformed sessions remain code", () => {
  for (const value of [
    `https://foreign.example${href}`, `${href}?token=synthetic`, `${href}#fragment`,
    href.replace("4321", "4200"), `${href}/extra`, href.replace("00000000", "../foreign"),
    `//foreign.example${href}`, href.replace("4222", "1222"), href.replace("8333", "7333"),
  ]) {
    const input = `\`${value}\``;
    assert.equal(normalizeAssistantMarkdownLinks(input), input);
    assert.equal(assistantMessageLinkSegments(input).filter((segment) => segment.href).length, 0);
  }
});

test("existing links and repeated normalization remain stable", () => {
  for (const input of [`[Übernehmen](${href})`, "[Doku](https://example.com)", `\`${href}\``]) {
    const normalized = normalizeAssistantMarkdownLinks(input);
    assert.equal(normalizeAssistantMarkdownLinks(normalized), normalized);
  }
});
