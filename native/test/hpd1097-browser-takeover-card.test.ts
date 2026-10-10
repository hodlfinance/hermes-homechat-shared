import assert from "node:assert/strict";
import test from "node:test";
import { browserTakeoverCardCopy, browserTakeoverCardParts, browserTakeoverCardState } from "../core/browser-takeover-card";

// HPD-1097: Hermes' takeover link becomes a "Computer" card; its link text is the task.
const session = "6f262a17-c500-4761-9356-5056b44eec7d";
const relative = `/api/workspace/preview/4321/browser/${session}`;
const apiBase = "https://heyhermes.app/api";

test("a takeover link becomes a card with the link text as task, the text around it stays", () => {
  for (const href of [relative, `https://heyhermes.app${relative}`, `<${relative}>`]) {
    const parts = browserTakeoverCardParts(
      `Mache ich, ich öffne kayak.de auf meinem Computer.\n\n[Bei KAYAK anmelden, dann zurückgeben](${href}) - tippe, um zu übernehmen.`,
      apiBase);
    assert.deepEqual(parts, [
      { kind: "text", text: "Mache ich, ich öffne kayak.de auf meinem Computer.\n\n" },
      { kind: "card", task: "Bei KAYAK anmelden, dann zurückgeben", href: href.replace(/[<>]/g, ""), sessionId: session },
      { kind: "text", text: " - tippe, um zu übernehmen." },
    ]);
  }
});

test("anything that is not an exact takeover link stays text", () => {
  for (const text of [
    `[x](https://evil.invalid${relative})`,
    `[x](${relative}?ticket=1)`,
    `[x](${relative}/extra)`,
    `[x](${relative.replace("4321", "4200")})`,
    "```\n[x](" + relative + ")\n```",
    "[KAYAK](https://www.kayak.de)",
  ]) assert.deepEqual(browserTakeoverCardParts(text, apiBase), [{ kind: "text", text }], text);
  assert.deepEqual(browserTakeoverCardParts("plain", apiBase), [{ kind: "text", text: "plain" }]);
});

test("the card follows the session: open, done after a hand-back, ended when gone", () => {
  assert.equal(browserTakeoverCardState(200, { controlOwner: "human", handedBack: false }), "open");
  assert.equal(browserTakeoverCardState(200, { controlOwner: "agent", handedBack: true }), "done");
  assert.equal(browserTakeoverCardState(404, null), "ended");
  assert.equal(browserTakeoverCardState(410, null), "ended");
  assert.equal(browserTakeoverCardState(503, null), "open");
  assert.equal(browserTakeoverCardCopy("de").open, "Computer öffnen");
  assert.equal(browserTakeoverCardCopy("en").done, "✓ Done");
});

test("HODL/Fin keep the text link: cards appear only where the host opens the takeover itself", async () => {
  const { readFileSync } = await import("node:fs");
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /useMemo<BrowserTakeoverCardHost \| null>\(\(\) => !host\.openBrowserTakeover \? null :/);
  assert.match(surface, /const parts = cardHost \? browserTakeoverCardParts\(text, API_BASE\) : \[\];/);
  const card = readFileSync(new URL("../src/BrowserTakeoverCard.tsx", import.meta.url), "utf8");
  assert.match(card, /AppState\.currentState === "active"/, "no reads in the background");
  assert.match(card, /settled = next !== "open";/, "no reads after done or ended");
});
