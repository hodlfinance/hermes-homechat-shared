import type { AppLocale } from "../core/index";
import type { LapseExportOwnerView } from "../core/types";

/**
 * HPD-1027 S6(b): the lapse export on the account screen, shared by the app and the web. Pure
 * model and copy; the screens only render it.
 *
 * When a Hey subscription ends, the server is paused on day 8; on day 30 the Plane holds a
 * complete, encrypted backup of the server for seven days, then the server is deleted (HPD-735).
 * The signed-in Owner always sees this here, also while the server is paused and whether or not
 * the notice mail arrived. An Owner without an SSH key gets a fresh key for the backup, which can
 * be taken exactly once (the Plane enforces it).
 */

export const LAPSE_EXPORT_DOWNLOAD_HREF = "/api/workspace/server/lapse-export/download";

export interface LapseExportCopy {
  title: string;
  paused: (exportDue: string, deleteDue: string) => string;
  ready: (until: string) => string;
  gone: string;
  download: string;
  takeKey: string;
  keyOnce: string;
  keyShown: (at: string) => string;
  shareKey: string;
  copyKey: string;
  openFull: string;
  openKey: string;
  loadFailed: string;
  failed: string;
}

const en: LapseExportCopy = {
  title: "Backup after your subscription ended",
  paused: (exportDue, deleteDue) => `Your subscription has ended and your server is paused. On ${exportDue} a complete backup will be ready here; on ${deleteDue} the server is deleted.`,
  ready: (until) => `Your backup is ready until ${until}. After that the server is deleted and no backup remains.`,
  gone: "The backup is no longer available.",
  download: "Download backup",
  takeKey: "Get the key (once)",
  keyOnce: "The key is shown exactly once. Save it now, before you leave this screen.",
  keyShown: (at) => `The key was retrieved on ${at}.`,
  shareKey: "Save or share the key",
  copyKey: "Copy key",
  openFull: "Open it with: age -d -i ~/.ssh/id_ed25519 hey-hermes-server.tar.age | tar -x",
  openKey: "Open it with: age -d -i hey-hermes-key.txt hey-hermes-server.tar.age | tar -x",
  loadFailed: "The backup could not be loaded. Try again.",
  failed: "That did not work. Try again.",
};

const de: LapseExportCopy = {
  title: "Sicherung nach Abo-Ende",
  paused: (exportDue, deleteDue) => `Dein Abo ist beendet und Dein Server pausiert. Am ${exportDue} liegt hier eine vollständige Sicherung bereit; am ${deleteDue} wird der Server gelöscht.`,
  ready: (until) => `Deine Sicherung liegt bereit bis ${until}. Danach wird der Server gelöscht, und es bleibt keine Sicherung zurück.`,
  gone: "Die Sicherung ist nicht mehr verfügbar.",
  download: "Sicherung herunterladen",
  takeKey: "Schlüssel einmalig abrufen",
  keyOnce: "Der Schlüssel wird genau einmal angezeigt. Speichere ihn jetzt, bevor Du diese Ansicht verlässt.",
  keyShown: (at) => `Der Schlüssel wurde am ${at} abgerufen.`,
  shareKey: "Schlüssel sichern oder teilen",
  copyKey: "Schlüssel kopieren",
  openFull: "Öffnen mit: age -d -i ~/.ssh/id_ed25519 hey-hermes-server.tar.age | tar -x",
  openKey: "Öffnen mit: age -d -i hey-hermes-key.txt hey-hermes-server.tar.age | tar -x",
  loadFailed: "Die Sicherung konnte nicht geladen werden. Versuche es noch einmal.",
  failed: "Das hat nicht geklappt. Versuche es noch einmal.",
};

const fr: LapseExportCopy = {
  title: "Sauvegarde après la fin de votre abonnement",
  paused: (exportDue, deleteDue) => `Votre abonnement a pris fin et votre serveur est en pause. Le ${exportDue}, une sauvegarde complète sera disponible ici ; le ${deleteDue}, le serveur sera supprimé.`,
  ready: (until) => `Votre sauvegarde est disponible jusqu'au ${until}. Ensuite, le serveur est supprimé et aucune sauvegarde ne subsiste.`,
  gone: "La sauvegarde n'est plus disponible.",
  download: "Télécharger la sauvegarde",
  takeKey: "Obtenir la clé (une seule fois)",
  keyOnce: "La clé ne s'affiche qu'une seule fois. Enregistrez-la maintenant, avant de quitter cet écran.",
  keyShown: (at) => `La clé a été récupérée le ${at}.`,
  shareKey: "Enregistrer ou partager la clé",
  copyKey: "Copier la clé",
  openFull: "Ouvrez-la avec : age -d -i ~/.ssh/id_ed25519 hey-hermes-server.tar.age | tar -x",
  openKey: "Ouvrez-la avec : age -d -i hey-hermes-key.txt hey-hermes-server.tar.age | tar -x",
  loadFailed: "La sauvegarde n'a pas pu être chargée. Réessayez.",
  failed: "Cela n'a pas fonctionné. Réessayez.",
};

const es: LapseExportCopy = {
  title: "Copia de seguridad tras el fin de tu suscripción",
  paused: (exportDue, deleteDue) => `Tu suscripción ha terminado y tu servidor está en pausa. El ${exportDue} tendrás aquí una copia de seguridad completa; el ${deleteDue} se eliminará el servidor.`,
  ready: (until) => `Tu copia de seguridad está disponible hasta el ${until}. Después se elimina el servidor y no queda ninguna copia.`,
  gone: "La copia de seguridad ya no está disponible.",
  download: "Descargar copia de seguridad",
  takeKey: "Obtener la clave (una sola vez)",
  keyOnce: "La clave se muestra una sola vez. Guárdala ahora, antes de salir de esta pantalla.",
  keyShown: (at) => `La clave se obtuvo el ${at}.`,
  shareKey: "Guardar o compartir la clave",
  copyKey: "Copiar clave",
  openFull: "Ábrela con: age -d -i ~/.ssh/id_ed25519 hey-hermes-server.tar.age | tar -x",
  openKey: "Ábrela con: age -d -i hey-hermes-key.txt hey-hermes-server.tar.age | tar -x",
  loadFailed: "No se pudo cargar la copia de seguridad. Inténtalo de nuevo.",
  failed: "No ha funcionado. Inténtalo de nuevo.",
};

const it: LapseExportCopy = {
  title: "Backup dopo la fine dell'abbonamento",
  paused: (exportDue, deleteDue) => `Il tuo abbonamento è terminato e il tuo server è in pausa. Il ${exportDue} qui sarà pronto un backup completo; il ${deleteDue} il server verrà eliminato.`,
  ready: (until) => `Il tuo backup è disponibile fino al ${until}. Dopo il server viene eliminato e non resta alcun backup.`,
  gone: "Il backup non è più disponibile.",
  download: "Scarica il backup",
  takeKey: "Ottieni la chiave (una sola volta)",
  keyOnce: "La chiave viene mostrata una sola volta. Salvala ora, prima di lasciare questa schermata.",
  keyShown: (at) => `La chiave è stata recuperata il ${at}.`,
  shareKey: "Salva o condividi la chiave",
  copyKey: "Copia la chiave",
  openFull: "Aprilo con: age -d -i ~/.ssh/id_ed25519 hey-hermes-server.tar.age | tar -x",
  openKey: "Aprilo con: age -d -i hey-hermes-key.txt hey-hermes-server.tar.age | tar -x",
  loadFailed: "Non è stato possibile caricare il backup. Riprova.",
  failed: "Non ha funzionato. Riprova.",
};

const ptBR: LapseExportCopy = {
  title: "Backup após o fim da sua assinatura",
  paused: (exportDue, deleteDue) => `Sua assinatura terminou e seu servidor está pausado. Em ${exportDue} um backup completo estará disponível aqui; em ${deleteDue} o servidor será excluído.`,
  ready: (until) => `Seu backup está disponível até ${until}. Depois disso o servidor é excluído e nenhum backup permanece.`,
  gone: "O backup não está mais disponível.",
  download: "Baixar backup",
  takeKey: "Obter a chave (uma única vez)",
  keyOnce: "A chave é mostrada uma única vez. Salve-a agora, antes de sair desta tela.",
  keyShown: (at) => `A chave foi obtida em ${at}.`,
  shareKey: "Salvar ou compartilhar a chave",
  copyKey: "Copiar chave",
  openFull: "Abra com: age -d -i ~/.ssh/id_ed25519 hey-hermes-server.tar.age | tar -x",
  openKey: "Abra com: age -d -i hey-hermes-key.txt hey-hermes-server.tar.age | tar -x",
  loadFailed: "Não foi possível carregar o backup. Tente novamente.",
  failed: "Não funcionou. Tente novamente.",
};

const ja: LapseExportCopy = {
  title: "サブスクリプション終了後のバックアップ",
  paused: (exportDue, deleteDue) => `サブスクリプションが終了し、サーバーは一時停止中です。${exportDue} にここで完全なバックアップを用意し、${deleteDue} にサーバーを削除します。`,
  ready: (until) => `バックアップは ${until} までダウンロードできます。その後サーバーは削除され、バックアップは残りません。`,
  gone: "バックアップはもう利用できません。",
  download: "バックアップをダウンロード",
  takeKey: "鍵を取得（1 回のみ）",
  keyOnce: "鍵は 1 回だけ表示されます。この画面を離れる前に、今すぐ保存してください。",
  keyShown: (at) => `鍵は ${at} に取得されました。`,
  shareKey: "鍵を保存または共有",
  copyKey: "鍵をコピー",
  openFull: "開き方: age -d -i ~/.ssh/id_ed25519 hey-hermes-server.tar.age | tar -x",
  openKey: "開き方: age -d -i hey-hermes-key.txt hey-hermes-server.tar.age | tar -x",
  loadFailed: "バックアップを読み込めませんでした。もう一度お試しください。",
  failed: "うまくいきませんでした。もう一度お試しください。",
};

const ko: LapseExportCopy = {
  title: "구독 종료 후 백업",
  paused: (exportDue, deleteDue) => `구독이 종료되어 서버가 일시 중지되었습니다. ${exportDue}에 이곳에서 전체 백업을 받을 수 있고, ${deleteDue}에 서버가 삭제됩니다.`,
  ready: (until) => `백업은 ${until}까지 받을 수 있습니다. 그 후 서버가 삭제되며 백업은 남지 않습니다.`,
  gone: "백업을 더 이상 사용할 수 없습니다.",
  download: "백업 다운로드",
  takeKey: "키 받기 (한 번만)",
  keyOnce: "키는 딱 한 번만 표시됩니다. 이 화면을 떠나기 전에 지금 저장하세요.",
  keyShown: (at) => `키를 ${at}에 받았습니다.`,
  shareKey: "키 저장 또는 공유",
  copyKey: "키 복사",
  openFull: "여는 방법: age -d -i ~/.ssh/id_ed25519 hey-hermes-server.tar.age | tar -x",
  openKey: "여는 방법: age -d -i hey-hermes-key.txt hey-hermes-server.tar.age | tar -x",
  loadFailed: "백업을 불러오지 못했습니다. 다시 시도하세요.",
  failed: "잘 되지 않았습니다. 다시 시도하세요.",
};

const byLocale: Record<AppLocale, LapseExportCopy> = { en, de, fr, es, it, "pt-BR": ptBR, ja, ko };

export function lapseExportCopy(locale: AppLocale): LapseExportCopy {
  return byLocale[locale] ?? en;
}

/** Codes after which the section stays away: no lapse for this account, or a host the route is not for. */
export const LAPSE_EXPORT_HIDDEN_CODES: ReadonlySet<string> = new Set(["lapse_export_none", "native_r8_route_not_allowed"]);

export interface LapseExportModel {
  status: string;
  canDownload: boolean;
  canTakeKey: boolean;
  keyShownNote: string | null;
  hint: string | null;
}

export function lapseExportModel(
  view: LapseExportOwnerView,
  copy: LapseExportCopy,
  formatDate: (iso: string) => string,
  keyTaken: boolean,
): LapseExportModel {
  const ready = view.ready && Boolean(view.expiresAt);
  const status = ready ? copy.ready(formatDate(view.expiresAt!))
    : view.exportedAt ? copy.gone
      : copy.paused(formatDate(view.exportDueAt), formatDate(view.deleteDueAt));
  const freshKey = ready && view.format === "full" && (view.keyAvailable || keyTaken || Boolean(view.keyShownAt));
  return {
    status,
    canDownload: ready,
    canTakeKey: ready && view.keyAvailable && !keyTaken,
    keyShownNote: !keyTaken && view.keyShownAt ? copy.keyShown(formatDate(view.keyShownAt)) : null,
    hint: ready && view.format === "full" ? (freshKey ? copy.openKey : copy.openFull) : null,
  };
}

/** The key as a file the age tool reads (`age -d -i hey-hermes-key.txt`). */
export function lapseExportKeyFile(identity: string) {
  return `# Hey Hermes: key for your server backup\n${identity}\n`;
}
