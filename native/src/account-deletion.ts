import {
  apiErrorCode,
  heyAccountDeletionConfirmationPhrase,
  type AppLocale,
  type HeyAccountDeletionReceipt,
} from "../core/index";

export const accountDeletionNativeReauthenticationRequired = "account_deletion_native_reauthentication_required";

const nativeReauthenticationCopy: Record<AppLocale, { message: string; googleAction: string }> = {
  en: { message: "Your Google or Apple sign-in is too old to confirm deletion. Sign in with the linked account again below, then retry.", googleAction: "Sign in with Google again" },
  de: { message: "Deine Google- oder Apple-Anmeldung ist zu alt, um die Löschung zu bestätigen. Melde dich unten erneut mit dem verknüpften Account an und versuche es dann noch einmal.", googleAction: "Erneut mit Google anmelden" },
  fr: { message: "Votre connexion Google ou Apple est trop ancienne pour confirmer la suppression. Reconnectez-vous ci-dessous avec le compte lié, puis réessayez.", googleAction: "Se reconnecter avec Google" },
  es: { message: "Tu inicio de sesión con Google o Apple es demasiado antiguo para confirmar la eliminación. Vuelve a iniciar sesión abajo con la cuenta vinculada y reinténtalo.", googleAction: "Volver a iniciar sesión con Google" },
  it: { message: "L’accesso con Google o Apple è troppo vecchio per confermare l’eliminazione. Accedi di nuovo qui sotto con l’account collegato, quindi riprova.", googleAction: "Accedi di nuovo con Google" },
  "pt-BR": { message: "Seu login com Google ou Apple é antigo demais para confirmar a exclusão. Entre novamente abaixo com a conta vinculada e tente outra vez.", googleAction: "Entrar novamente com o Google" },
  ja: { message: "削除を確定するには、Google または Apple のサインインが古すぎます。下から連携済みアカウントでもう一度サインインしてから、再試行してください。", googleAction: "Google でもう一度サインイン" },
  ko: { message: "삭제를 확인하기에는 Google 또는 Apple 로그인이 너무 오래되었습니다. 아래에서 연결된 계정으로 다시 로그인한 후 다시 시도하세요.", googleAction: "Google로 다시 로그인" },
};

export function accountDeletionNativeReauthenticationCopy(locale: AppLocale) {
  return nativeReauthenticationCopy[locale];
}

export function needsAccountDeletionNativeReauthentication(error: unknown) {
  return apiErrorCode(error) === accountDeletionNativeReauthenticationRequired;
}

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
  if (needsAccountDeletionNativeReauthentication(error)) {
    return nativeReauthenticationCopy.en.message;
  }
  const code = apiErrorCode(error);
  const raw = error instanceof Error ? error.message : "";
  if (code === "account_deletion_reauthentication_required" || raw.includes("reauthentication")) {
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
