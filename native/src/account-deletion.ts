import {
  heyAccountDeletionConfirmationPhrase,
  type HeyAccountDeletionReceipt,
} from "../core/index";

/**
 * Copy and gating rules for the Hey account-deletion control. Kept free of React Native
 * imports so it can be unit tested the same way the other mobile logic modules are.
 */

export function accountDeletionPhraseMatches(typed: string) {
  // The field autocapitalizes and users paste with stray spaces; neither should be treated
  // as a failed confirmation.
  return typed.trim().toUpperCase() === heyAccountDeletionConfirmationPhrase;
}

export function deletionSummary(receipt: HeyAccountDeletionReceipt) {
  const base = `Hey Hermes account deleted. Receipt ${receipt.receiptId}.`;
  // The purge normally runs with the confirmation. When it could not, say so plainly and
  // give the committed deadline rather than implying the data is already gone.
  const data = receipt.purge
    ? "Your active Hey data has been deleted."
    : `Your active Hey data will be deleted by ${formatDeadline(receipt.activeDataPurgeDueAt)}.`;
  return `${base} ${data} Your App Store subscription was not cancelled.`;
}

export function deletionErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : "";
  if (raw.includes("reauthentication")) {
    return "That password or access code did not match. If you signed in with Apple or Google, sign in again and retry.";
  }
  if (raw.includes("confirmation")) {
    return `Type ${heyAccountDeletionConfirmationPhrase} exactly to confirm.`;
  }
  return raw || "The account could not be deleted. Nothing was changed.";
}

function formatDeadline(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}
