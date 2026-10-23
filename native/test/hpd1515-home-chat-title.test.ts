import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { mobileHostHeaderTitle } from "../src/mobile-host-header";

/**
 * HPD-1515 (Justus, 2026-10-23, HODL 10.0.1): in the HODL and LiveQuote Bots
 * header the Home chat is called "Home". The host option is optional: Hey
 * passes none and keeps "Hermes" there.
 */
const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");

test("the option is optional and typed", () => {
  assert.match(host, /homeChatTitle\?: string;/);
});

test("the Home chat takes the host's title; other threads and pages keep theirs", () => {
  const base = { productName: "Hermes", screenTitle: "Pages", homeTitle: "Home" };
  assert.equal(mobileHostHeaderTitle({ ...base, tab: "chat", session: { role: "home", title: "Hermes" } }), "Home");
  assert.equal(mobileHostHeaderTitle({ ...base, tab: "chat", session: null }), "Home");
  assert.equal(mobileHostHeaderTitle({ ...base, tab: "chat", session: { role: "chat", title: "Hermes · ETH" } }), "Hermes · ETH");
  assert.equal(mobileHostHeaderTitle({ ...base, tab: "chat", session: { role: "chat", title: "" } }), "Hermes");
  assert.equal(mobileHostHeaderTitle({ ...base, tab: "bookmarks", session: null }), "Pages");
});

test("without the option (Hey) the Home chat stays Hermes", () => {
  const base = { productName: "Hermes", screenTitle: "Pages" };
  assert.equal(mobileHostHeaderTitle({ ...base, tab: "chat", session: { role: "home" } }), "Hermes");
  assert.equal(mobileHostHeaderTitle({ ...base, homeTitle: "  ", tab: "chat", session: { role: "home" } }), "Hermes");
});
