import assert from "node:assert/strict";
import test from "node:test";
import { assistantMessageLinkSegments, markdownLinkDestination } from "../core/assistant-message-links";
import { mobileMarkdownBlocks } from "../src/mobile-markdown";
import { mobileAssistantLinkSegments } from "../src/mobile-message-links";
import { isPrivateMobileBrowserHref, mobileBrowserUrl } from "../src/mobile-browser-session";

// HPD-1059. On fc-justus-3 (r102, 2026-10-06 10:47Z) Hermes wrote the Browser
// handoff as a CommonMark angle-bracket destination. The brackets stayed in the
// href, mobileMessageUrl returned null for it, and "Browser übernehmen" showed
// as plain text. The session id below is synthetic.
const href = "/api/workspace/preview/4321/browser/00000000-1111-4222-8333-444444444444";
const measured = `Die Seite ist offen. [Browser übernehmen](<${href}>) - tippe, um dich einzuloggen.`;

function links(markdown: string) {
  return assistantMessageLinkSegments(markdown).filter((segment) => segment.href);
}

test("the measured angle-bracket handoff becomes a link to the handoff path", () => {
  assert.deepEqual(links(measured), [{ text: "Browser übernehmen", href, kind: "plain" }]);
  const native = mobileMarkdownBlocks(measured).flatMap((block) => block.kind === "paragraph" ? block.segments : [])
    .flatMap((segment) => mobileAssistantLinkSegments(segment.text).filter((part) => part.href));
  assert.deepEqual(native.map((segment) => segment.href), [href]);
});

test("the unwrapped app-relative handoff is the in-app browser on the API origin", () => {
  const [link] = links(measured);
  assert.equal(isPrivateMobileBrowserHref(link!.href!), true);
  assert.equal(mobileBrowserUrl("https://heyhermes.app/api", link!.href!), `https://heyhermes.app${href}`);
});

test("other angle-bracket destinations unwrap, everything else stays as it was", () => {
  assert.equal(links(`[Open](<https://example.com/a b>)`)[0]?.href, "https://example.com/a b");
  assert.equal(links(`[Open](<${href}> "Titel")`)[0]?.href, href);
  assert.equal(links(`[Open](${href})`)[0]?.href, href);
  assert.equal(links(`[Open][b]\n\n[b]: <${href}>`)[0]?.href, href);
  assert.equal(links(`Code: \`[x](<${href}>)\``).length, 0);
  assert.equal(markdownLinkDestination(` <${href}> `), href);
  assert.equal(markdownLinkDestination(href), href);
  assert.equal(markdownLinkDestination("<a><b>"), "<a><b>");
});
