import assert from "node:assert/strict";
import test from "node:test";
import { appLocales } from "../core/types";
import { mobileText } from "../src/appI18n";
import { deletionSummary } from "../src/account-deletion";

// HPD-1027: account deletion deletes the account data in the service database,
// but a private server, its memory and its backups go only with the Owner's
// server deletion (privacy policy 2026-10-08.1, section 7). The deletion copy
// must not promise more, in any language, and must say what happens to the server.

const serverWord: Record<(typeof appLocales)[number], string> = {
  en: "server",
  de: "Server",
  fr: "serveur",
  es: "servidor",
  it: "server",
  "pt-BR": "servidor",
  ja: "サーバー",
  ko: "서버",
};

test("every language says the private server is not deleted with the account", () => {
  for (const locale of appLocales) {
    const copy = mobileText(locale).systemPages.account.deletion;
    for (const key of ["description", "confirmBody", "purged", "purgePending"] as const) {
      assert.ok(copy[key].includes(serverWord[locale]), `${locale}.${key} does not mention the private server`);
    }
    assert.ok(copy.purgePending.includes("{date}"), `${locale} loses the deadline`);
  }
});

test("English never claims all active Hey data is deleted", () => {
  const en = mobileText("en").systemPages.account.deletion;
  for (const text of [en.description, en.confirmBody, en.purged, en.purgePending]) {
    assert.doesNotMatch(text, /active Hey data/);
  }
});

test("the native receipt summary says the same", () => {
  const base = {
    receiptId: "delrcpt_test",
    activeDataPurgeDueAt: "2026-11-07T12:00:00.000Z",
  };
  const pending = deletionSummary({ ...base, purge: null } as never);
  assert.match(pending, /will be deleted by/);
  assert.match(pending, /server/);
  assert.doesNotMatch(pending, /active Hey data/);
  const purged = deletionSummary({ ...base, purge: { privateRuntimeTeardownPending: true } } as never);
  assert.match(purged, /has been deleted/);
  assert.match(purged, /server/);
});
