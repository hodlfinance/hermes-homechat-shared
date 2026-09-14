import {
  apiErrorCode,
  heyAccountDeletionConfirmationPhrase,
  type AppLocale,
  type HeyAccountDeletionReceipt,
} from "../core/index";

export const accountDeletionNativeReauthenticationRequired = "account_deletion_native_reauthentication_required";

const nativeReauthenticationCopy: Record<AppLocale, { emailAction: string; emailComplete: string; emailSent: string; message: string; googleAction: string }> = {
  en: { message: "Your sign-in is too old to confirm deletion. Refresh it with the linked email, Google, or Apple account below, then retry.", googleAction: "Sign in with Google again", emailAction: "Send a fresh email sign-in link", emailSent: "A fresh sign-in link is on its way. Open it on this iPhone, then retry deletion.", emailComplete: "Email sign-in refreshed. You can now confirm account deletion." },
  de: { message: "Deine Anmeldung ist zu alt, um die Löschung zu bestätigen. Aktualisiere sie unten per verknüpfter E-Mail, Google oder Apple und versuche es dann erneut.", googleAction: "Erneut mit Google anmelden", emailAction: "Neuen E-Mail-Anmeldelink senden", emailSent: "Ein neuer Anmeldelink ist unterwegs. Öffne ihn auf diesem iPhone und versuche die Löschung erneut.", emailComplete: "E-Mail-Anmeldung aktualisiert. Du kannst die Kontolöschung jetzt bestätigen." },
  fr: { message: "Votre connexion est trop ancienne pour confirmer la suppression. Actualisez-la ci-dessous avec l’e-mail, Google ou Apple lié, puis réessayez.", googleAction: "Se reconnecter avec Google", emailAction: "Envoyer un nouveau lien par e-mail", emailSent: "Un nouveau lien de connexion est en route. Ouvrez-le sur cet iPhone, puis réessayez.", emailComplete: "Connexion par e-mail actualisée. Vous pouvez maintenant confirmer la suppression." },
  es: { message: "Tu inicio de sesión es demasiado antiguo para confirmar la eliminación. Actualízalo abajo con el correo, Google o Apple vinculado y reinténtalo.", googleAction: "Volver a iniciar sesión con Google", emailAction: "Enviar un nuevo enlace por correo", emailSent: "Hay un nuevo enlace de acceso en camino. Ábrelo en este iPhone y vuelve a intentarlo.", emailComplete: "Acceso por correo actualizado. Ya puedes confirmar la eliminación." },
  it: { message: "L’accesso è troppo vecchio per confermare l’eliminazione. Aggiornalo qui sotto con l’e-mail, Google o Apple collegato, quindi riprova.", googleAction: "Accedi di nuovo con Google", emailAction: "Invia un nuovo link via e-mail", emailSent: "Un nuovo link di accesso è in arrivo. Aprilo su questo iPhone, quindi riprova.", emailComplete: "Accesso via e-mail aggiornato. Ora puoi confermare l’eliminazione." },
  "pt-BR": { message: "Seu login é antigo demais para confirmar a exclusão. Atualize-o abaixo com o e-mail, Google ou Apple vinculado e tente novamente.", googleAction: "Entrar novamente com o Google", emailAction: "Enviar novo link por e-mail", emailSent: "Um novo link de acesso está a caminho. Abra-o neste iPhone e tente novamente.", emailComplete: "Login por e-mail atualizado. Agora você pode confirmar a exclusão." },
  ja: { message: "削除を確定するにはサインインが古すぎます。下から連携済みのメール、Google、または Apple で更新してから再試行してください。", googleAction: "Google でもう一度サインイン", emailAction: "新しいメールリンクを送信", emailSent: "新しいサインインリンクを送信しました。この iPhone で開いてから、削除を再試行してください。", emailComplete: "メールサインインを更新しました。アカウント削除を確定できます。" },
  ko: { message: "삭제를 확인하기에는 로그인이 너무 오래되었습니다. 아래에서 연결된 이메일, Google 또는 Apple로 갱신한 후 다시 시도하세요.", googleAction: "Google로 다시 로그인", emailAction: "새 이메일 로그인 링크 보내기", emailSent: "새 로그인 링크를 보냈습니다. 이 iPhone에서 연 다음 삭제를 다시 시도하세요.", emailComplete: "이메일 로그인이 갱신되었습니다. 이제 계정 삭제를 확인할 수 있습니다." },
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
