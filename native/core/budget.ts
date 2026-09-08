import type { SpendCounters } from "./types";

/**
 * Die eine Ansicht des enthaltenen Budgets. Anzeige und Sperre lesen sie beide,
 * damit `MVP-SOLL.md` gilt: der Nutzer wird nach derselben Zahl gesperrt, die er sieht.
 * Reserviertes zählt als verbraucht, weil das Tor bei used + reserved >= cap schließt.
 */
export type IncludedBudgetInput = Pick<SpendCounters, "cycleCapCents" | "cycleUsedCents" | "reservedCents">;

export interface IncludedBudgetView {
  capCents: number;
  usedCents: number;
  remainingCents: number;
  exhausted: boolean;
}

export function includedBudgetView(spend: IncludedBudgetInput): IncludedBudgetView {
  const capCents = Math.max(0, Math.trunc(spend.cycleCapCents));
  const rawUsedCents =
    Math.max(0, Math.trunc(spend.cycleUsedCents)) + Math.max(0, Math.trunc(spend.reservedCents));
  // Gedeckelt, weil die Abrechnung den Abzug beim Nutzer auf sein Restguthaben deckelt und
  // den Überhang als company_absorbed_cents traegt. Was darueber liegt, hat der Nutzer nicht
  // aus seinem Budget bezahlt, und es gehoert deshalb nicht in seine Anzeige. Der Betreiber
  // sieht den Ueberhang getrennt.
  const usedCents = Math.min(rawUsedCents, capCents);
  return {
    capCents,
    usedCents,
    remainingCents: capCents - usedCents,
    exhausted: capCents > 0 && rawUsedCents >= capCents,
  };
}
