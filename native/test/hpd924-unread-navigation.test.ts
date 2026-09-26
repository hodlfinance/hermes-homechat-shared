import assert from "node:assert/strict";
import test from "node:test";

import { automationThreadUnreadBadge } from "../src/mobile-automation-threads";

test("HPD-924: the server-owned count makes a capped visual badge with the full accessible count", () => {
  assert.deepEqual(automationThreadUnreadBadge("Portfolio Scan", 1, "en"), {
    count: 1,
    label: "1",
    accessibilityLabel: "Portfolio Scan, 1 unread message",
  });
  assert.deepEqual(automationThreadUnreadBadge("Portfolio Scan", 137, "de"), {
    count: 137,
    label: "99+",
    accessibilityLabel: "Portfolio Scan, 137 ungelesene Nachrichten",
  });
});

test("HPD-924: an old plane or invalid count does not invent unread activity", () => {
  for (const value of [undefined, null, 0, -1, 1.2, "2", Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(automationThreadUnreadBadge("Portfolio Scan", value, "en"), null);
  }
});

test("HPD-924: every app language supplies an accessible unread count", () => {
  const expected = {
    en: "2 unread messages",
    de: "2 ungelesene Nachrichten",
    fr: "2 messages non lus",
    es: "2 mensajes sin leer",
    it: "2 messaggi non letti",
    "pt-BR": "2 mensagens não lidas",
    ja: "未読メッセージ 2 件",
    ko: "읽지 않은 메시지 2개",
  } as const;
  for (const locale of Object.keys(expected) as Array<keyof typeof expected>) {
    const badge = automationThreadUnreadBadge("Portfolio Scan", 2, locale);
    assert.equal(badge?.label, "2", locale);
    assert.equal(badge?.accessibilityLabel, `Portfolio Scan, ${expected[locale]}`, locale);
  }
});
