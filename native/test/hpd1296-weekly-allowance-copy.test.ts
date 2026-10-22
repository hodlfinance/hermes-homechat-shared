import assert from "node:assert/strict";
import test from "node:test";
import { adminUiCopy } from "../core/admin-ui-copy";
import { appLocales } from "../core/types";
import { mobileText } from "../src/appI18n";
import { dailyCheckInCopy, selfManagedCopy } from "../src/self-managed";

// HPD-1296 (Justus, 2026-10-19 "Ja"): the included AI renews weekly, USD 3.75 per week
// from the account's start (HPD-452). No customer-visible app copy may still call it a
// monthly budget. Two dead admin keys ("Monthly budget renews", "/ month.") are removed,
// and the self-managed confirmation and the daily check-in setting name the weekly budget.
const monthlyAllowance = /monthly (model )?budget|budget renews|Monatsbudget|monatliches Modellbudget|budget mensuel|presupuesto mensual|budget mensile|orçamento mensal|月間予算|월간 예산/i;

test("HPD-1296: admin copy names no monthly allowance in any locale", () => {
  for (const locale of appLocales) {
    const copy = adminUiCopy(locale) as Record<string, string>;
    assert.equal("Monthly budget renews" in copy, false, locale);
    assert.equal("/ month." in copy, false, locale);
    for (const [key, value] of Object.entries(copy)) {
      assert.doesNotMatch(`${key} ${value}`, monthlyAllowance, `${locale}: ${key}`);
    }
  }
});

test("HPD-1296: the account label names the weekly model budget in every locale", () => {
  const expected: Record<string, string> = {
    en: "Weekly model budget",
    de: "Wöchentliches Modellbudget",
    fr: "Budget de modèle hebdomadaire",
    es: "Presupuesto semanal de modelo",
    it: "Budget settimanale del modello",
    "pt-BR": "Orçamento semanal de modelo",
    ja: "週間モデル予算",
    ko: "주간 모델 예산",
  };
  for (const locale of appLocales) {
    assert.equal(mobileText(locale).systemPages.account.monthlyBudget, expected[locale], locale);
    assert.doesNotMatch(JSON.stringify(mobileText(locale).systemPages.account), monthlyAllowance, locale);
  }
});

test("HPD-1296: self-managed and daily check-in copy name the weekly budget", () => {
  assert.equal(selfManagedCopy("en").confirmPoints.includes("Your included AI keeps its weekly budget."), true);
  assert.equal(selfManagedCopy("de").confirmPoints.includes("Die enthaltene KI behält ihr Wochenbudget."), true);
  assert.equal(dailyCheckInCopy("en").settingsDetail, "Your included AI has one limit: its weekly budget.");
  assert.equal(dailyCheckInCopy("de").settingsDetail, "Die enthaltene KI hat eine Grenze: ihr Wochenbudget.");
  for (const locale of appLocales) {
    assert.doesNotMatch(JSON.stringify(selfManagedCopy(locale)), monthlyAllowance, locale);
    assert.doesNotMatch(dailyCheckInCopy(locale).settingsDetail, monthlyAllowance, locale);
  }
});
