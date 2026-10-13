import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales, type AppLocale, type HermesAutomationJob } from "../core/index";
import type { RankedTaskAutomationView } from "../core/ranked-task-automations";
import { mobileText } from "../src/appI18n";
import {
  automationCardFromJob,
  automationCardFromManaged,
  automationPrivacyRoute,
  automationPrivacyRouteLine,
} from "../src/mobile-automation-card";

const cardSource = readFileSync(new URL("../src/AutomationCard.tsx", import.meta.url), "utf8");
const approved = { reason: "google_user_data", modelName: "DeepSeek V4 Flash" } as const;

function job(id: string, privacyRoute?: unknown): HermesAutomationJob {
  return {
    id, title: `Job ${id}`, status: "active", schedule: "30 7 * * *", nextRunAt: null, lastRunAt: null,
    delivery: null, summary: null, ...(privacyRoute === undefined ? {} : { privacyRoute }),
  } as HermesAutomationJob;
}

function managed(role: string, privacyRoute?: unknown): RankedTaskAutomationView {
  return {
    metadata: { role, nativeJobId: role, activeUserVersion: 1 },
    snapshot: { name: role, schedule: "0 8 * * *", delivery: "chat" },
    versions: [], enabled: true, resultStatus: "stored", stalled: null, nextRunAt: null,
    ...(privacyRoute === undefined ? {} : { privacyRoute }),
  } as unknown as RankedTaskAutomationView;
}

test("HPD-1234: the card model carries the server's route for both readers and for no other automation", () => {
  assert.deepEqual(automationCardFromJob(job("gmail", approved)).privacyRoute, approved);
  assert.equal(automationCardFromJob(job("weather", null)).privacyRoute, null);
  // A server older than HPD-1202 sends no key at all.
  assert.equal(automationCardFromJob(job("old-server")).privacyRoute, null);
  assert.deepEqual(automationCardFromManaged(managed("email_scanner", approved)).privacyRoute, approved);
  assert.equal(automationCardFromManaged(managed("ranker", null)).privacyRoute, null);
  assert.equal(automationCardFromManaged(managed("ranker")).privacyRoute, null);
});

test("HPD-1234: a malformed or unknown route yields no line", () => {
  for (const value of [
    true, "google_user_data", [], { reason: "google_user_data" },
    { reason: "google_user_data", modelName: "  " }, { reason: "google_user_data", modelName: 7 },
    { reason: "something_else", modelName: "X" },
  ]) {
    assert.equal(automationPrivacyRoute(value), null, JSON.stringify(value));
    assert.equal(automationCardFromJob(job("bad", value)).privacyRoute, null, JSON.stringify(value));
    assert.equal(automationCardFromManaged(managed("email_scanner", value)).privacyRoute, null, JSON.stringify(value));
  }
  assert.deepEqual(automationPrivacyRoute({ reason: "google_user_data", modelName: " DeepSeek V4 Flash " }), approved);
});

/** The eight sentences as the web showed them since HPD-1202 (hey-hermes PR #1891). */
const sentences: Record<AppLocale, string> = {
  en: "Runs on the privacy-approved model (DeepSeek V4 Flash) because it uses your Gmail.",
  de: "Läuft mit dem datenschutzgeprüften Modell (DeepSeek V4 Flash), weil sie dein Gmail nutzt.",
  fr: "S’exécute avec le modèle approuvé pour la confidentialité (DeepSeek V4 Flash), car elle utilise votre Gmail.",
  es: "Se ejecuta con el modelo aprobado para la privacidad (DeepSeek V4 Flash) porque usa tu Gmail.",
  it: "Viene eseguita con il modello approvato per la privacy (DeepSeek V4 Flash) perché usa il tuo Gmail.",
  "pt-BR": "É executada no modelo aprovado para privacidade (DeepSeek V4 Flash) porque usa o seu Gmail.",
  ja: "Gmailを使用するため、プライバシー承認済みのモデル（DeepSeek V4 Flash）で実行されます。",
  ko: "Gmail을 사용하므로 개인정보 보호 승인 모델(DeepSeek V4 Flash)에서 실행됩니다.",
};

test("HPD-1234: every supported locale says the web's sentence and names the model", () => {
  assert.deepEqual(Object.keys(sentences).sort(), [...appLocales].sort());
  for (const locale of appLocales) {
    const template = mobileText(locale).systemPages.automations.privacyRoute;
    assert.equal(template.split("{model}").length, 2, `${locale} names the model exactly once`);
    assert.equal(automationPrivacyRouteLine({ privacyRoute: approved }, template), sentences[locale], locale);
    assert.equal(automationPrivacyRouteLine({ privacyRoute: null }, template), null, locale);
  }
});

test("HPD-1234: a model name is printed as it is, never read as a replacement pattern", () => {
  const template = mobileText("en").systemPages.automations.privacyRoute;
  const line = automationPrivacyRouteLine({ privacyRoute: { reason: "google_user_data", modelName: "A$&B $1" } }, template);
  assert.equal(line, "Runs on the privacy-approved model (A$&B $1) because it uses your Gmail.");
});

test("HPD-1234: the native card draws the line from the model, directly under the next-run line", () => {
  assert.match(cardSource, /automationPrivacyRouteLine\(automation, copy\.privacyRoute\)/);
  assert.match(cardSource, /\{privacyRouteLine \? \(\s*<Text style=\{styles\.muted\}>\{privacyRouteLine\}<\/Text>\s*\) : null\}/);
  const nextRunLine = cardSource.indexOf("{[nextRun, automation.delivery");
  const privacyLine = cardSource.indexOf("{privacyRouteLine ? (");
  const resultLine = cardSource.indexOf("{automation.resultStatus ? (");
  assert.ok(nextRunLine > 0 && nextRunLine < privacyLine && privacyLine < resultLine);
  // The card decides nothing itself: no title, role or skill is looked at.
  assert.doesNotMatch(cardSource, /email_scanner|gmail/i);
});
