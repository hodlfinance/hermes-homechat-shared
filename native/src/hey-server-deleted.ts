import type { AppLocale, ServerDeletedSnapshotView, ServerOwnerDeletionReceiptSummary } from "../core/index";

/**
 * HPD-1106: after the Owner deleted the server, the account showed "Your Hermes is being set up"
 * forever (the deletion fences new provisioning). The web and the app now show this screen
 * instead, in the HPD-1085 paywall design: the deletion date, a count-only summary of the host
 * receipt, and, while the subscription runs, "Set up a new server" (Owner only, after an explicit
 * "fresh server, old data is gone" confirmation) and "Manage subscription". Once the subscription
 * has ended, the screen keeps the deleted state with the paywall's purchase and account entry.
 * `titleAccent` is a substring of `title`, painted in the brand blue like the paywall headline.
 */
export type HeyServerDeletedCopy = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  /** "{date}" is replaced with the formatted deletion date. */
  deletedOn: string;
  /** "{volumes}" and "{files}": what the host removed; nothing of the server is left. */
  receipt: string;
  bodyActive: string;
  bodyEnded: string;
  /** Once the subscription has ended: opens the paywall; the new purchase brings a fresh server. */
  purchase: string;
  newServer: string;
  confirmTitle: string;
  confirmBody: string;
  confirmAction: string;
  cancel: string;
  manage: string;
  waitlist: string;
  subscriptionRequired: string;
  failed: string;
};

const copyByLocale: Record<AppLocale, HeyServerDeletedCopy> = {
  en: {
    eyebrow: "Hey Hermes Personal",
    title: "Your server was deleted",
    titleAccent: "deleted",
    deletedOn: "Deleted on {date}.",
    receipt: "Receipt: {volumes} disks and {files} files removed, nothing of the server is left.",
    bodyActive: "Your subscription is still running. You can set up a new server or manage your subscription.",
    bodyEnded: "Your subscription has ended. Subscribe again to get a fresh server. Your account stays until you delete it.",
    purchase: "Subscribe again",
    newServer: "Set up a new server",
    confirmTitle: "Set up a new server?",
    confirmBody: "You get a fresh server. Your old data is gone and does not come back.",
    confirmAction: "Yes, set up a fresh server",
    cancel: "Cancel",
    manage: "Manage subscription",
    waitlist: "There is no free place right now. Please try again later.",
    subscriptionRequired: "A new server needs a running subscription.",
    failed: "That did not work. Please try again.",
  },
  de: {
    eyebrow: "Hey Hermes Personal",
    title: "Dein Server wurde gelöscht",
    titleAccent: "gelöscht",
    deletedOn: "Gelöscht am {date}.",
    receipt: "Beleg: {volumes} Datenträger und {files} Dateien entfernt, vom Server ist nichts übrig.",
    bodyActive: "Dein Abo läuft noch. Du kannst einen neuen Server einrichten oder dein Abo verwalten.",
    bodyEnded: "Dein Abo ist beendet. Mit einem neuen Abo bekommst du einen neuen Server. Dein Konto bleibt, bis du es löschst.",
    purchase: "Wieder abonnieren",
    newServer: "Neuen Server einrichten",
    confirmTitle: "Neuen Server einrichten?",
    confirmBody: "Du bekommst einen frischen Server. Deine alten Daten sind weg und kommen nicht zurück.",
    confirmAction: "Ja, frischen Server einrichten",
    cancel: "Abbrechen",
    manage: "Abo verwalten",
    waitlist: "Gerade ist kein Platz frei. Bitte versuche es später noch einmal.",
    subscriptionRequired: "Für einen neuen Server braucht es ein laufendes Abo.",
    failed: "Das hat nicht geklappt. Bitte versuche es noch einmal.",
  },
  fr: {
    eyebrow: "Hey Hermes Personal",
    title: "Votre serveur a été supprimé",
    titleAccent: "supprimé",
    deletedOn: "Supprimé le {date}.",
    receipt: "Justificatif : {volumes} disques et {files} fichiers supprimés, il ne reste rien du serveur.",
    bodyActive: "Votre abonnement est toujours actif. Vous pouvez configurer un nouveau serveur ou gérer votre abonnement.",
    bodyEnded: "Votre abonnement est terminé. En vous réabonnant, vous obtenez un nouveau serveur. Votre compte reste jusqu’à ce que vous le supprimiez.",
    purchase: "Se réabonner",
    newServer: "Configurer un nouveau serveur",
    confirmTitle: "Configurer un nouveau serveur ?",
    confirmBody: "Vous obtenez un serveur vierge. Vos anciennes données ont disparu et ne reviendront pas.",
    confirmAction: "Oui, configurer un serveur vierge",
    cancel: "Annuler",
    manage: "Gérer l’abonnement",
    waitlist: "Aucune place n’est libre pour le moment. Veuillez réessayer plus tard.",
    subscriptionRequired: "Un nouveau serveur nécessite un abonnement actif.",
    failed: "Cela n’a pas fonctionné. Veuillez réessayer.",
  },
  es: {
    eyebrow: "Hey Hermes Personal",
    title: "Tu servidor se ha eliminado",
    titleAccent: "eliminado",
    deletedOn: "Eliminado el {date}.",
    receipt: "Comprobante: {volumes} discos y {files} archivos eliminados; no queda nada del servidor.",
    bodyActive: "Tu suscripción sigue activa. Puedes configurar un servidor nuevo o gestionar tu suscripción.",
    bodyEnded: "Tu suscripción ha terminado. Si te suscribes de nuevo, obtienes un servidor nuevo. Tu cuenta se mantiene hasta que la elimines.",
    purchase: "Suscribirse de nuevo",
    newServer: "Configurar un servidor nuevo",
    confirmTitle: "¿Configurar un servidor nuevo?",
    confirmBody: "Recibes un servidor limpio. Tus datos anteriores ya no existen y no volverán.",
    confirmAction: "Sí, configurar un servidor limpio",
    cancel: "Cancelar",
    manage: "Gestionar suscripción",
    waitlist: "Ahora mismo no hay ninguna plaza libre. Inténtalo de nuevo más tarde.",
    subscriptionRequired: "Un servidor nuevo requiere una suscripción activa.",
    failed: "No ha funcionado. Inténtalo de nuevo.",
  },
  it: {
    eyebrow: "Hey Hermes Personal",
    title: "Il tuo server è stato eliminato",
    titleAccent: "eliminato",
    deletedOn: "Eliminato il {date}.",
    receipt: "Ricevuta: {volumes} dischi e {files} file rimossi, del server non resta nulla.",
    bodyActive: "Il tuo abbonamento è ancora attivo. Puoi configurare un nuovo server o gestire l’abbonamento.",
    bodyEnded: "Il tuo abbonamento è terminato. Abbonandoti di nuovo ottieni un nuovo server. Il tuo account resta finché non lo elimini.",
    purchase: "Abbonati di nuovo",
    newServer: "Configura un nuovo server",
    confirmTitle: "Configurare un nuovo server?",
    confirmBody: "Ricevi un server nuovo. I tuoi vecchi dati non ci sono più e non torneranno.",
    confirmAction: "Sì, configura un server nuovo",
    cancel: "Annulla",
    manage: "Gestisci abbonamento",
    waitlist: "Al momento non c’è nessun posto libero. Riprova più tardi.",
    subscriptionRequired: "Per un nuovo server serve un abbonamento attivo.",
    failed: "Non ha funzionato. Riprova.",
  },
  "pt-BR": {
    eyebrow: "Hey Hermes Personal",
    title: "Seu servidor foi excluído",
    titleAccent: "excluído",
    deletedOn: "Excluído em {date}.",
    receipt: "Comprovante: {volumes} discos e {files} arquivos removidos; nada do servidor restou.",
    bodyActive: "Sua assinatura continua ativa. Você pode configurar um novo servidor ou gerenciar sua assinatura.",
    bodyEnded: "Sua assinatura terminou. Ao assinar novamente, você recebe um novo servidor. Sua conta continua até você excluí-la.",
    purchase: "Assinar novamente",
    newServer: "Configurar um novo servidor",
    confirmTitle: "Configurar um novo servidor?",
    confirmBody: "Você recebe um servidor novo. Seus dados antigos foram apagados e não voltam.",
    confirmAction: "Sim, configurar um servidor novo",
    cancel: "Cancelar",
    manage: "Gerenciar assinatura",
    waitlist: "No momento não há vaga livre. Tente novamente mais tarde.",
    subscriptionRequired: "Um novo servidor exige uma assinatura ativa.",
    failed: "Não funcionou. Tente novamente.",
  },
  ja: {
    eyebrow: "Hey Hermes Personal",
    title: "サーバーは削除されました",
    titleAccent: "削除されました",
    deletedOn: "削除日: {date}",
    receipt: "証明: ディスク {volumes} 個とファイル {files} 個を削除しました。サーバーのデータは何も残っていません。",
    bodyActive: "サブスクリプションはまだ有効です。新しいサーバーを設定するか、サブスクリプションを管理できます。",
    bodyEnded: "サブスクリプションは終了しました。再度登録すると新しいサーバーが用意されます。アカウントは削除するまで残ります。",
    purchase: "再度登録する",
    newServer: "新しいサーバーを設定",
    confirmTitle: "新しいサーバーを設定しますか？",
    confirmBody: "まっさらな新しいサーバーになります。以前のデータは削除済みで、元に戻りません。",
    confirmAction: "はい、新しいサーバーを設定する",
    cancel: "キャンセル",
    manage: "サブスクリプションを管理",
    waitlist: "現在空きがありません。しばらくしてからもう一度お試しください。",
    subscriptionRequired: "新しいサーバーには有効なサブスクリプションが必要です。",
    failed: "うまくいきませんでした。もう一度お試しください。",
  },
  ko: {
    eyebrow: "Hey Hermes Personal",
    title: "서버가 삭제되었습니다",
    titleAccent: "삭제되었습니다",
    deletedOn: "삭제일: {date}",
    receipt: "확인: 디스크 {volumes}개와 파일 {files}개를 삭제했으며 서버에 남은 것은 없습니다.",
    bodyActive: "구독이 아직 활성 상태입니다. 새 서버를 설정하거나 구독을 관리할 수 있습니다.",
    bodyEnded: "구독이 종료되었습니다. 다시 구독하면 새 서버를 받습니다. 계정은 직접 삭제할 때까지 유지됩니다.",
    purchase: "다시 구독하기",
    newServer: "새 서버 설정",
    confirmTitle: "새 서버를 설정할까요?",
    confirmBody: "깨끗한 새 서버를 받게 됩니다. 이전 데이터는 삭제되었으며 복구되지 않습니다.",
    confirmAction: "예, 새 서버 설정",
    cancel: "취소",
    manage: "구독 관리",
    waitlist: "지금은 빈자리가 없습니다. 나중에 다시 시도해 주세요.",
    subscriptionRequired: "새 서버를 설정하려면 활성 구독이 필요합니다.",
    failed: "실패했습니다. 다시 시도해 주세요.",
  },
};

export function heyServerDeletedCopy(locale: AppLocale): HeyServerDeletedCopy {
  return copyByLocale[locale] ?? copyByLocale.en;
}

export function heyServerDeletedDateLine(locale: AppLocale, deletedAt: string | null, formatDate: (value: string) => string) {
  return deletedAt ? heyServerDeletedCopy(locale).deletedOn.replace("{date}", formatDate(deletedAt)) : null;
}

export function heyServerDeletedReceiptLine(locale: AppLocale, receipt: ServerOwnerDeletionReceiptSummary | null) {
  // Only a clean receipt is summarised as "nothing is left"; the Plane never records another one as deleted.
  if (!receipt || receipt.remainingVolumes || receipt.remainingFiles) return null;
  return heyServerDeletedCopy(locale).receipt
    .replace("{volumes}", String(receipt.removedVolumes))
    .replace("{files}", String(receipt.removedFiles));
}

/**
 * What the screen offers. "Set up a new server" only while the Plane says the Owner may
 * (`newServer: "available"`, which already includes the running subscription); "Manage
 * subscription" while the entitlement is valid. Ended: the paywall's purchase (a new purchase
 * supersedes the deletion on the Plane) and the account entry.
 */
export function heyServerDeletedModel(input: { deletion: ServerDeletedSnapshotView; subscriptionActive: boolean }) {
  return {
    subscriptionActive: input.subscriptionActive,
    newServerOffered: input.subscriptionActive && input.deletion.newServer === "available",
    manageOffered: input.subscriptionActive,
    // HPD-1106: ended. A new purchase lifts the deletion's fence on the Plane and asks for a fresh server.
    purchaseOffered: !input.subscriptionActive,
  };
}

/** The new-server route's refusal codes, in words; anything else is the generic failure. */
export function heyServerDeletedErrorMessage(locale: AppLocale, code: string | null | undefined) {
  const copy = heyServerDeletedCopy(locale);
  if (code === "server_capacity_waitlist") return copy.waitlist;
  if (code === "subscription_required") return copy.subscriptionRequired;
  return copy.failed;
}
