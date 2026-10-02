import assert from "node:assert/strict";
import test from "node:test";
import { assistantMessageLinkSegments, normalizeAssistantMarkdownLinks } from "../core/assistant-message-links";

const href = "/api/workspace/preview/4321/browser/00000000-1111-4222-8333-444444444444";

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
