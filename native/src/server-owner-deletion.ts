import type { AppLocale } from "../core/index";
import type { ServerOwnerDeletionStatus } from "../core/types";

/**
 * HPD-1027 S6a: the server Owner deletes their own server, shared by the app
 * and the web. Pure model and copy; the screens only render it.
 *
 * The Plane (hey-hermes apps/api/src/server-owner-deletion.ts) answers what a
 * deletion removes and what stays; the screen shows that first, with the hint
 * to download the full archive before, and asks for two confirmations: the
 * server id typed again and the irreversibility acknowledged. Then it follows
 * the request (requested, running, deleted, failed) and shows the host
 * receipt as counts.
 *
 * Shown only while the Plane says serverDeletionAvailable (switch on, never
 * Fin, never a protected or pilot workspace).
 */

export const SERVER_OWNER_DELETION_POLL_MS = 15_000;

export type ServerOwnerDeletionDeletedItem =
  | "system_disk"
  | "private_data_disk"
  | "disk_snapshots"
  | "host_backups"
  | "server_export_copies"
  | "runtime_binding";
export type ServerOwnerDeletionKeptItem = "account" | "subscription" | "billing_records" | "app_conversations" | "honcho_memory";

export interface ServerOwnerDeletionCopy {
  title: string;
  intro: string;
  exportFirst: string;
  deletedHeading: string;
  keptHeading: string;
  items: Record<ServerOwnerDeletionDeletedItem | ServerOwnerDeletionKeptItem, string>;
  offHost: string;
  separate: string;
  serverIdLabel: string;
  confirmLabel: string;
  acknowledge: string;
  submit: string;
  submitting: string;
  requested: string;
  running: string;
  deleted: (when: string) => string;
  deletedNext: string;
  receipt: (volumes: number, files: number) => string;
  receiptClean: string;
  failed: string;
  failures: Record<string, string>;
  errors: Record<string, string>;
  loadFailed: string;
  retry: string;
}

const en: ServerOwnerDeletionCopy = {
  title: "Delete server",
  intro: "Deletes your whole server for good: both disks and every copy we keep of it. This cannot be undone.",
  exportFirst: "Download your full archive before deleting. After the deletion nothing of the server can be recovered.",
  deletedHeading: "What gets deleted",
  keptHeading: "What stays",
  items: {
    system_disk: "System disk",
    private_data_disk: "Private data disk (your files)",
    disk_snapshots: "All disk snapshots",
    host_backups: "Backups and recovery copies on our host",
    server_export_copies: "Server archives and export copies",
    runtime_binding: "The connection between the app and this server",
    account: "Your account and sign-in",
    subscription: "Your subscription",
    billing_records: "Billing records",
    app_conversations: "Conversations in the app",
    honcho_memory: "Hermes memory",
  },
  offHost: "There are no backups of customer servers outside our host.",
  separate: "Cancelling the subscription and deleting your account are separate steps.",
  serverIdLabel: "Your server ID",
  confirmLabel: "Type your server ID to confirm",
  acknowledge: "I understand that my server and all its copies are deleted for good and cannot be restored.",
  submit: "Delete server permanently",
  submitting: "Requesting…",
  requested: "Deletion requested. Your server will be deleted shortly; you can leave this page.",
  running: "Your server is being deleted now.",
  deleted: (when) => `Your server was deleted on ${when}.`,
  deletedNext: "Your account, subscription and app conversations stay until you delete them separately.",
  receipt: (volumes, files) => `Removed: disks and snapshots ${volumes}, backup and export files ${files}.`,
  receiptClean: "Nothing of the server is left on our host.",
  failed: "The server could not be deleted. Try again or contact support.",
  failures: {
    stale: "The deletion did not finish in time and was stopped. Try again.",
    volumes_remain: "Part of the server could not be removed. Try again or contact support.",
    no_guest_on_host: "We could not find your server on our host. Please contact support.",
    instance_mismatch: "Your server changed since you asked. Check the server ID and try again.",
  },
  errors: {
    server_deletion_confirmation_mismatch: "The server ID does not match.",
    server_deletion_not_acknowledged: "Please confirm that the deletion cannot be undone.",
    server_deletion_in_progress: "A deletion is already under way.",
    full_export_in_progress: "A full archive is being created. Wait until it is ready, then delete.",
    server_already_deleted: "This server has already been deleted.",
    generic: "That did not work. Try again.",
  },
  loadFailed: "The server deletion could not be loaded. Try again.",
  retry: "Try again",
};

const de: ServerOwnerDeletionCopy = {
  title: "Server löschen",
  intro: "Löscht Deinen ganzen Server endgültig: beide Festplatten und jede Kopie, die wir davon haben. Das lässt sich nicht rückgängig machen.",
  exportFirst: "Lade vor dem Löschen Dein Komplettarchiv herunter. Nach dem Löschen lässt sich vom Server nichts wiederherstellen.",
  deletedHeading: "Was gelöscht wird",
  keptHeading: "Was bleibt",
  items: {
    system_disk: "Systemplatte",
    private_data_disk: "Private Datenplatte (Deine Dateien)",
    disk_snapshots: "Alle Snapshots der Platten",
    host_backups: "Backups und Wiederherstellungskopien auf unserem Host",
    server_export_copies: "Serverarchive und Exportkopien",
    runtime_binding: "Die Verbindung zwischen App und diesem Server",
    account: "Dein Konto und Deine Anmeldung",
    subscription: "Dein Abo",
    billing_records: "Abrechnungsbelege",
    app_conversations: "Unterhaltungen in der App",
    honcho_memory: "Hermes-Gedächtnis",
  },
  offHost: "Außerhalb unseres Hosts gibt es keine Backups von Kundenservern.",
  separate: "Abo kündigen und Konto löschen sind eigene Schritte.",
  serverIdLabel: "Deine Server-ID",
  confirmLabel: "Gib zur Bestätigung Deine Server-ID ein",
  acknowledge: "Ich verstehe, dass mein Server und alle Kopien endgültig gelöscht werden und nicht wiederhergestellt werden können.",
  submit: "Server endgültig löschen",
  submitting: "Wird angefordert…",
  requested: "Löschung angefordert. Dein Server wird gleich gelöscht; Du kannst diese Seite verlassen.",
  running: "Dein Server wird gerade gelöscht.",
  deleted: (when) => `Dein Server wurde am ${when} gelöscht.`,
  deletedNext: "Konto, Abo und Unterhaltungen in der App bleiben, bis Du sie eigens löschst.",
  receipt: (volumes, files) => `Entfernt: Platten und Snapshots ${volumes}, Backup- und Exportdateien ${files}.`,
  receiptClean: "Vom Server ist auf unserem Host nichts mehr übrig.",
  failed: "Der Server konnte nicht gelöscht werden. Versuche es noch einmal oder wende Dich an den Support.",
  failures: {
    stale: "Das Löschen wurde nicht rechtzeitig fertig und abgebrochen. Versuche es noch einmal.",
    volumes_remain: "Ein Teil des Servers konnte nicht entfernt werden. Versuche es noch einmal oder wende Dich an den Support.",
    no_guest_on_host: "Wir konnten Deinen Server auf unserem Host nicht finden. Bitte wende Dich an den Support.",
    instance_mismatch: "Dein Server hat sich seit der Anfrage geändert. Prüfe die Server-ID und versuche es noch einmal.",
  },
  errors: {
    server_deletion_confirmation_mismatch: "Die Server-ID stimmt nicht.",
    server_deletion_not_acknowledged: "Bitte bestätige, dass sich das Löschen nicht rückgängig machen lässt.",
    server_deletion_in_progress: "Es läuft bereits eine Löschung.",
    full_export_in_progress: "Gerade wird ein Komplettarchiv erstellt. Warte, bis es bereit ist, und lösche dann.",
    server_already_deleted: "Dieser Server wurde bereits gelöscht.",
    generic: "Das hat nicht geklappt. Versuche es noch einmal.",
  },
  loadFailed: "Die Serverlöschung konnte nicht geladen werden. Versuche es noch einmal.",
  retry: "Erneut versuchen",
};

const fr: ServerOwnerDeletionCopy = {
  title: "Supprimer le serveur",
  intro: "Supprime définitivement tout votre serveur : les deux disques et chaque copie que nous en gardons. Cette action est irréversible.",
  exportFirst: "Téléchargez votre archive complète avant de supprimer. Après la suppression, rien du serveur ne peut être récupéré.",
  deletedHeading: "Ce qui est supprimé",
  keptHeading: "Ce qui reste",
  items: {
    system_disk: "Disque système",
    private_data_disk: "Disque de données privé (vos fichiers)",
    disk_snapshots: "Tous les instantanés des disques",
    host_backups: "Sauvegardes et copies de récupération sur notre hôte",
    server_export_copies: "Archives du serveur et copies d'export",
    runtime_binding: "La liaison entre l'app et ce serveur",
    account: "Votre compte et votre connexion",
    subscription: "Votre abonnement",
    billing_records: "Justificatifs de facturation",
    app_conversations: "Conversations dans l'app",
    honcho_memory: "Mémoire de Hermes",
  },
  offHost: "Il n'existe aucune sauvegarde des serveurs clients en dehors de notre hôte.",
  separate: "Résilier l'abonnement et supprimer votre compte sont des étapes distinctes.",
  serverIdLabel: "Identifiant de votre serveur",
  confirmLabel: "Saisissez l'identifiant de votre serveur pour confirmer",
  acknowledge: "Je comprends que mon serveur et toutes ses copies sont supprimés définitivement et ne peuvent pas être restaurés.",
  submit: "Supprimer le serveur définitivement",
  submitting: "Demande en cours…",
  requested: "Suppression demandée. Votre serveur sera supprimé sous peu ; vous pouvez quitter cette page.",
  running: "Votre serveur est en cours de suppression.",
  deleted: (when) => `Votre serveur a été supprimé le ${when}.`,
  deletedNext: "Votre compte, votre abonnement et les conversations de l'app restent jusqu'à ce que vous les supprimiez séparément.",
  receipt: (volumes, files) => `Supprimés : disques et instantanés ${volumes}, fichiers de sauvegarde et d'export ${files}.`,
  receiptClean: "Plus rien du serveur ne reste sur notre hôte.",
  failed: "Le serveur n'a pas pu être supprimé. Réessayez ou contactez le support.",
  failures: {
    stale: "La suppression n'a pas abouti à temps et a été arrêtée. Réessayez.",
    volumes_remain: "Une partie du serveur n'a pas pu être retirée. Réessayez ou contactez le support.",
    no_guest_on_host: "Nous n'avons pas trouvé votre serveur sur notre hôte. Contactez le support.",
    instance_mismatch: "Votre serveur a changé depuis la demande. Vérifiez l'identifiant et réessayez.",
  },
  errors: {
    server_deletion_confirmation_mismatch: "L'identifiant du serveur ne correspond pas.",
    server_deletion_not_acknowledged: "Confirmez que la suppression est irréversible.",
    server_deletion_in_progress: "Une suppression est déjà en cours.",
    full_export_in_progress: "Une archive complète est en cours de création. Attendez qu'elle soit prête, puis supprimez.",
    server_already_deleted: "Ce serveur a déjà été supprimé.",
    generic: "Cela n'a pas fonctionné. Réessayez.",
  },
  loadFailed: "La suppression du serveur n'a pas pu être chargée. Réessayez.",
  retry: "Réessayer",
};

const es: ServerOwnerDeletionCopy = {
  title: "Eliminar servidor",
  intro: "Elimina todo tu servidor para siempre: los dos discos y cada copia que guardamos de él. No se puede deshacer.",
  exportFirst: "Descarga tu archivo completo antes de eliminar. Después no se podrá recuperar nada del servidor.",
  deletedHeading: "Qué se elimina",
  keptHeading: "Qué se conserva",
  items: {
    system_disk: "Disco del sistema",
    private_data_disk: "Disco de datos privado (tus archivos)",
    disk_snapshots: "Todas las instantáneas de los discos",
    host_backups: "Copias de seguridad y de recuperación en nuestro host",
    server_export_copies: "Archivos del servidor y copias de exportación",
    runtime_binding: "La conexión entre la app y este servidor",
    account: "Tu cuenta y tu inicio de sesión",
    subscription: "Tu suscripción",
    billing_records: "Registros de facturación",
    app_conversations: "Conversaciones en la app",
    honcho_memory: "Memoria de Hermes",
  },
  offHost: "No hay copias de seguridad de servidores de clientes fuera de nuestro host.",
  separate: "Cancelar la suscripción y eliminar tu cuenta son pasos aparte.",
  serverIdLabel: "ID de tu servidor",
  confirmLabel: "Escribe el ID de tu servidor para confirmar",
  acknowledge: "Entiendo que mi servidor y todas sus copias se eliminan para siempre y no se pueden restaurar.",
  submit: "Eliminar servidor definitivamente",
  submitting: "Solicitando…",
  requested: "Eliminación solicitada. Tu servidor se eliminará en breve; puedes salir de esta página.",
  running: "Tu servidor se está eliminando ahora.",
  deleted: (when) => `Tu servidor se eliminó el ${when}.`,
  deletedNext: "Tu cuenta, tu suscripción y las conversaciones de la app se conservan hasta que las elimines por separado.",
  receipt: (volumes, files) => `Eliminado: discos e instantáneas ${volumes}, archivos de copia y exportación ${files}.`,
  receiptClean: "No queda nada del servidor en nuestro host.",
  failed: "No se pudo eliminar el servidor. Inténtalo de nuevo o contacta con soporte.",
  failures: {
    stale: "La eliminación no terminó a tiempo y se detuvo. Inténtalo de nuevo.",
    volumes_remain: "Una parte del servidor no se pudo quitar. Inténtalo de nuevo o contacta con soporte.",
    no_guest_on_host: "No encontramos tu servidor en nuestro host. Contacta con soporte.",
    instance_mismatch: "Tu servidor cambió desde la solicitud. Comprueba el ID e inténtalo de nuevo.",
  },
  errors: {
    server_deletion_confirmation_mismatch: "El ID del servidor no coincide.",
    server_deletion_not_acknowledged: "Confirma que la eliminación no se puede deshacer.",
    server_deletion_in_progress: "Ya hay una eliminación en curso.",
    full_export_in_progress: "Se está creando un archivo completo. Espera a que esté listo y luego elimina.",
    server_already_deleted: "Este servidor ya se eliminó.",
    generic: "No ha funcionado. Inténtalo de nuevo.",
  },
  loadFailed: "No se pudo cargar la eliminación del servidor. Inténtalo de nuevo.",
  retry: "Reintentar",
};

const it: ServerOwnerDeletionCopy = {
  title: "Elimina server",
  intro: "Elimina per sempre tutto il tuo server: entrambi i dischi e ogni copia che ne conserviamo. Non si può annullare.",
  exportFirst: "Scarica il tuo archivio completo prima di eliminare. Dopo l'eliminazione non si potrà recuperare nulla del server.",
  deletedHeading: "Cosa viene eliminato",
  keptHeading: "Cosa resta",
  items: {
    system_disk: "Disco di sistema",
    private_data_disk: "Disco dati privato (i tuoi file)",
    disk_snapshots: "Tutti gli snapshot dei dischi",
    host_backups: "Backup e copie di ripristino sul nostro host",
    server_export_copies: "Archivi del server e copie di esportazione",
    runtime_binding: "Il collegamento tra l'app e questo server",
    account: "Il tuo account e l'accesso",
    subscription: "Il tuo abbonamento",
    billing_records: "Documenti di fatturazione",
    app_conversations: "Conversazioni nell'app",
    honcho_memory: "Memoria di Hermes",
  },
  offHost: "Non esistono backup dei server dei clienti al di fuori del nostro host.",
  separate: "Disdire l'abbonamento ed eliminare l'account sono passaggi separati.",
  serverIdLabel: "ID del tuo server",
  confirmLabel: "Digita l'ID del tuo server per confermare",
  acknowledge: "Ho capito che il mio server e tutte le sue copie vengono eliminati per sempre e non possono essere ripristinati.",
  submit: "Elimina il server definitivamente",
  submitting: "Richiesta in corso…",
  requested: "Eliminazione richiesta. Il tuo server verrà eliminato a breve; puoi lasciare questa pagina.",
  running: "Il tuo server è in fase di eliminazione.",
  deleted: (when) => `Il tuo server è stato eliminato il ${when}.`,
  deletedNext: "Account, abbonamento e conversazioni nell'app restano finché non li elimini a parte.",
  receipt: (volumes, files) => `Rimossi: dischi e snapshot ${volumes}, file di backup ed esportazione ${files}.`,
  receiptClean: "Del server non resta nulla sul nostro host.",
  failed: "Non è stato possibile eliminare il server. Riprova o contatta il supporto.",
  failures: {
    stale: "L'eliminazione non è terminata in tempo ed è stata interrotta. Riprova.",
    volumes_remain: "Una parte del server non è stata rimossa. Riprova o contatta il supporto.",
    no_guest_on_host: "Non abbiamo trovato il tuo server sul nostro host. Contatta il supporto.",
    instance_mismatch: "Il tuo server è cambiato dalla richiesta. Controlla l'ID e riprova.",
  },
  errors: {
    server_deletion_confirmation_mismatch: "L'ID del server non corrisponde.",
    server_deletion_not_acknowledged: "Conferma che l'eliminazione non si può annullare.",
    server_deletion_in_progress: "È già in corso un'eliminazione.",
    full_export_in_progress: "È in corso la creazione di un archivio completo. Attendi che sia pronto, poi elimina.",
    server_already_deleted: "Questo server è già stato eliminato.",
    generic: "Non ha funzionato. Riprova.",
  },
  loadFailed: "Non è stato possibile caricare l'eliminazione del server. Riprova.",
  retry: "Riprova",
};

const ptBR: ServerOwnerDeletionCopy = {
  title: "Excluir servidor",
  intro: "Exclui todo o seu servidor para sempre: os dois discos e cada cópia que guardamos dele. Não dá para desfazer.",
  exportFirst: "Baixe seu arquivo completo antes de excluir. Depois da exclusão, nada do servidor pode ser recuperado.",
  deletedHeading: "O que é excluído",
  keptHeading: "O que fica",
  items: {
    system_disk: "Disco do sistema",
    private_data_disk: "Disco de dados privado (seus arquivos)",
    disk_snapshots: "Todos os snapshots dos discos",
    host_backups: "Backups e cópias de recuperação no nosso host",
    server_export_copies: "Arquivos do servidor e cópias de exportação",
    runtime_binding: "A conexão entre o app e este servidor",
    account: "Sua conta e seu login",
    subscription: "Sua assinatura",
    billing_records: "Registros de cobrança",
    app_conversations: "Conversas no app",
    honcho_memory: "Memória do Hermes",
  },
  offHost: "Não existem backups de servidores de clientes fora do nosso host.",
  separate: "Cancelar a assinatura e excluir sua conta são etapas separadas.",
  serverIdLabel: "ID do seu servidor",
  confirmLabel: "Digite o ID do seu servidor para confirmar",
  acknowledge: "Entendo que meu servidor e todas as cópias são excluídos para sempre e não podem ser restaurados.",
  submit: "Excluir servidor definitivamente",
  submitting: "Solicitando…",
  requested: "Exclusão solicitada. Seu servidor será excluído em breve; você pode sair desta página.",
  running: "Seu servidor está sendo excluído agora.",
  deleted: (when) => `Seu servidor foi excluído em ${when}.`,
  deletedNext: "Sua conta, sua assinatura e as conversas do app ficam até você excluí-las separadamente.",
  receipt: (volumes, files) => `Removidos: discos e snapshots ${volumes}, arquivos de backup e exportação ${files}.`,
  receiptClean: "Nada do servidor ficou no nosso host.",
  failed: "Não foi possível excluir o servidor. Tente novamente ou fale com o suporte.",
  failures: {
    stale: "A exclusão não terminou a tempo e foi interrompida. Tente novamente.",
    volumes_remain: "Parte do servidor não pôde ser removida. Tente novamente ou fale com o suporte.",
    no_guest_on_host: "Não encontramos seu servidor no nosso host. Fale com o suporte.",
    instance_mismatch: "Seu servidor mudou desde a solicitação. Confira o ID e tente novamente.",
  },
  errors: {
    server_deletion_confirmation_mismatch: "O ID do servidor não confere.",
    server_deletion_not_acknowledged: "Confirme que a exclusão não pode ser desfeita.",
    server_deletion_in_progress: "Já há uma exclusão em andamento.",
    full_export_in_progress: "Um arquivo completo está sendo criado. Espere ficar pronto e depois exclua.",
    server_already_deleted: "Este servidor já foi excluído.",
    generic: "Não funcionou. Tente novamente.",
  },
  loadFailed: "Não foi possível carregar a exclusão do servidor. Tente novamente.",
  retry: "Tentar novamente",
};

const ja: ServerOwnerDeletionCopy = {
  title: "サーバーを削除",
  intro: "サーバー全体を完全に削除します。2 つのディスクと、当社が保持するすべてのコピーが対象です。元に戻すことはできません。",
  exportFirst: "削除する前に完全アーカイブをダウンロードしてください。削除後はサーバーの内容を一切復元できません。",
  deletedHeading: "削除されるもの",
  keptHeading: "残るもの",
  items: {
    system_disk: "システムディスク",
    private_data_disk: "プライベートデータディスク（あなたのファイル）",
    disk_snapshots: "ディスクのすべてのスナップショット",
    host_backups: "当社ホスト上のバックアップと復旧用コピー",
    server_export_copies: "サーバーアーカイブとエクスポートのコピー",
    runtime_binding: "アプリとこのサーバーの接続",
    account: "アカウントとサインイン",
    subscription: "サブスクリプション",
    billing_records: "請求記録",
    app_conversations: "アプリ内の会話",
    honcho_memory: "Hermes のメモリ",
  },
  offHost: "お客様のサーバーのバックアップは当社ホストの外にはありません。",
  separate: "サブスクリプションの解約とアカウントの削除は、別の操作です。",
  serverIdLabel: "あなたのサーバー ID",
  confirmLabel: "確認のためサーバー ID を入力してください",
  acknowledge: "サーバーとそのすべてのコピーが完全に削除され、復元できないことを理解しました。",
  submit: "サーバーを完全に削除",
  submitting: "リクエスト中…",
  requested: "削除をリクエストしました。まもなくサーバーが削除されます。このページを離れても大丈夫です。",
  running: "サーバーを削除しています。",
  deleted: (when) => `サーバーは ${when} に削除されました。`,
  deletedNext: "アカウント、サブスクリプション、アプリ内の会話は、別途削除するまで残ります。",
  receipt: (volumes, files) => `削除記録：ディスクとスナップショット ${volumes} 件、バックアップとエクスポートのファイル ${files} 件を削除しました。`,
  receiptClean: "当社ホスト上にサーバーの残りはありません。",
  failed: "サーバーを削除できませんでした。もう一度お試しいただくか、サポートにお問い合わせください。",
  failures: {
    stale: "削除が時間内に終わらなかったため中止しました。もう一度お試しください。",
    volumes_remain: "サーバーの一部を削除できませんでした。もう一度お試しいただくか、サポートにお問い合わせください。",
    no_guest_on_host: "当社ホスト上にあなたのサーバーが見つかりませんでした。サポートにお問い合わせください。",
    instance_mismatch: "リクエスト後にサーバーが変わりました。サーバー ID を確認して、もう一度お試しください。",
  },
  errors: {
    server_deletion_confirmation_mismatch: "サーバー ID が一致しません。",
    server_deletion_not_acknowledged: "削除は元に戻せないことを確認してください。",
    server_deletion_in_progress: "すでに削除が進行中です。",
    full_export_in_progress: "完全アーカイブを作成中です。準備ができてから削除してください。",
    server_already_deleted: "このサーバーはすでに削除されています。",
    generic: "うまくいきませんでした。もう一度お試しください。",
  },
  loadFailed: "サーバーの削除情報を読み込めませんでした。もう一度お試しください。",
  retry: "再試行",
};

const ko: ServerOwnerDeletionCopy = {
  title: "서버 삭제",
  intro: "서버 전체를 영구적으로 삭제합니다. 두 디스크와 저희가 보관하는 모든 사본이 대상입니다. 되돌릴 수 없습니다.",
  exportFirst: "삭제하기 전에 전체 아카이브를 다운로드하세요. 삭제 후에는 서버의 어떤 것도 복구할 수 없습니다.",
  deletedHeading: "삭제되는 항목",
  keptHeading: "남는 항목",
  items: {
    system_disk: "시스템 디스크",
    private_data_disk: "개인 데이터 디스크 (내 파일)",
    disk_snapshots: "디스크의 모든 스냅샷",
    host_backups: "저희 호스트의 백업 및 복구용 사본",
    server_export_copies: "서버 아카이브 및 내보내기 사본",
    runtime_binding: "앱과 이 서버의 연결",
    account: "내 계정과 로그인",
    subscription: "내 구독",
    billing_records: "결제 기록",
    app_conversations: "앱의 대화",
    honcho_memory: "Hermes 메모리",
  },
  offHost: "고객 서버의 백업은 저희 호스트 밖에 없습니다.",
  separate: "구독 해지와 계정 삭제는 별도의 단계입니다.",
  serverIdLabel: "내 서버 ID",
  confirmLabel: "확인을 위해 서버 ID를 입력하세요",
  acknowledge: "내 서버와 모든 사본이 영구적으로 삭제되며 복원할 수 없음을 이해합니다.",
  submit: "서버 영구 삭제",
  submitting: "요청 중…",
  requested: "삭제를 요청했습니다. 곧 서버가 삭제됩니다. 이 페이지를 떠나도 됩니다.",
  running: "서버를 삭제하고 있습니다.",
  deleted: (when) => `서버가 ${when}에 삭제되었습니다.`,
  deletedNext: "계정, 구독, 앱의 대화는 따로 삭제할 때까지 남아 있습니다.",
  receipt: (volumes, files) => `삭제 기록: 디스크와 스냅샷 ${volumes}개, 백업 및 내보내기 파일 ${files}개를 삭제했습니다.`,
  receiptClean: "저희 호스트에 서버의 남은 것이 없습니다.",
  failed: "서버를 삭제하지 못했습니다. 다시 시도하거나 지원팀에 문의하세요.",
  failures: {
    stale: "삭제가 제시간에 끝나지 않아 중단되었습니다. 다시 시도하세요.",
    volumes_remain: "서버의 일부를 삭제하지 못했습니다. 다시 시도하거나 지원팀에 문의하세요.",
    no_guest_on_host: "저희 호스트에서 서버를 찾지 못했습니다. 지원팀에 문의하세요.",
    instance_mismatch: "요청 이후 서버가 바뀌었습니다. 서버 ID를 확인하고 다시 시도하세요.",
  },
  errors: {
    server_deletion_confirmation_mismatch: "서버 ID가 일치하지 않습니다.",
    server_deletion_not_acknowledged: "삭제는 되돌릴 수 없음을 확인하세요.",
    server_deletion_in_progress: "이미 삭제가 진행 중입니다.",
    full_export_in_progress: "전체 아카이브를 만들고 있습니다. 준비된 후에 삭제하세요.",
    server_already_deleted: "이 서버는 이미 삭제되었습니다.",
    generic: "실패했습니다. 다시 시도하세요.",
  },
  loadFailed: "서버 삭제 정보를 불러오지 못했습니다. 다시 시도하세요.",
  retry: "다시 시도",
};

const byLocale: Record<AppLocale, ServerOwnerDeletionCopy> = { en, de, fr, es, it, "pt-BR": ptBR, ja, ko };

export function serverOwnerDeletionCopy(locale: AppLocale): ServerOwnerDeletionCopy {
  return byLocale[locale] ?? en;
}

/**
 * Whether the section shows at all: only while the Plane offers it (server-identity
 * serverDeletionAvailable). The Plane sets it for the server Owner while the switch is on, never
 * for Fin or a protected workspace, and keeps it after the deletion so the Owner reads the result.
 */
export function serverOwnerDeletionVisible(identity: { serverDeletionAvailable?: boolean } | null | undefined) {
  return identity?.serverDeletionAvailable === true;
}

/** Answers that mean the section must not show (switched off, protected, Fin, not the Owner). */
export const SERVER_OWNER_DELETION_HIDDEN_CODES: ReadonlySet<string> = new Set([
  "server_deletion_unavailable",
  "server_deletion_protected",
  "server_owner_required",
  "firecracker_server_required",
]);

export function serverOwnerDeletionErrorMessage(code: string | null | undefined, copy: ServerOwnerDeletionCopy) {
  return (code && copy.errors[code]) || copy.errors.generic!;
}

/** Idempotency key for one confirmation: a retry of the same press answers the same request. */
export function newServerOwnerDeletionOperationId(random: () => number = Math.random) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "sod_";
  for (let i = 0; i < 24; i += 1) id += alphabet[Math.floor(random() * alphabet.length) % alphabet.length];
  return id;
}

/** Both confirmations: the server id typed again exactly, and the irreversibility acknowledged. */
export function serverOwnerDeletionConfirmed(serverId: string, typed: string, acknowledged: boolean) {
  return serverId.length > 0 && typed.trim() === serverId && acknowledged;
}

export type ServerOwnerDeletionPhase = "loading" | "preview" | "requested" | "running" | "deleted" | "failed";

export interface ServerOwnerDeletionModel {
  phase: ServerOwnerDeletionPhase;
  /** The status line, or null in the preview. */
  status: string | null;
  tone: "teal" | "amber" | "muted" | "coral";
  /** Preview, export hint and the two confirmations; offered again after a failure. */
  showForm: boolean;
  /** Receipt lines after the deletion. */
  receipt: string[];
  /** Keep asking the Plane while the host works. */
  poll: boolean;
  deleted: { label: string; key: ServerOwnerDeletionDeletedItem }[];
  kept: { label: string; key: ServerOwnerDeletionKeptItem }[];
}

const DELETED_ORDER: ServerOwnerDeletionDeletedItem[] = [
  "system_disk", "private_data_disk", "disk_snapshots", "host_backups", "server_export_copies", "runtime_binding",
];
const KEPT_ORDER: ServerOwnerDeletionKeptItem[] = ["account", "subscription", "billing_records", "app_conversations", "honcho_memory"];

export function serverOwnerDeletionModel(
  status: ServerOwnerDeletionStatus | null,
  copy: ServerOwnerDeletionCopy,
  formatDate: (iso: string) => string,
): ServerOwnerDeletionModel {
  // The lists follow what the Plane says, in a fixed order, each with its own label.
  const deletedKeys = new Set<string>(status?.consequences.deleted ?? []);
  const keptKeys = new Set<string>(status?.consequences.kept ?? []);
  const deleted = DELETED_ORDER.filter((key) => deletedKeys.has(key)).map((key) => ({ key, label: copy.items[key] }));
  const kept = KEPT_ORDER.filter((key) => keptKeys.has(key)).map((key) => ({ key, label: copy.items[key] }));
  const base = { deleted, kept, receipt: [] as string[] };
  if (!status) return { ...base, phase: "loading", status: null, tone: "muted", showForm: false, poll: false };
  const request = status.request;
  switch (request?.state) {
    case "requested":
      return { ...base, phase: "requested", status: copy.requested, tone: "amber", showForm: false, poll: true };
    case "running":
      return { ...base, phase: "running", status: copy.running, tone: "amber", showForm: false, poll: true };
    case "deleted": {
      const receipt: string[] = [];
      if (request.receipt) {
        receipt.push(copy.receipt(request.receipt.removedVolumes, request.receipt.removedFiles));
        if (request.receipt.remainingVolumes === 0 && request.receipt.remainingFiles === 0) receipt.push(copy.receiptClean);
      }
      receipt.push(copy.deletedNext);
      return {
        ...base,
        phase: "deleted",
        status: copy.deleted(formatDate(request.completedAt ?? request.requestedAt)),
        tone: "teal",
        showForm: false,
        poll: false,
        receipt,
      };
    }
    case "failed":
      return {
        ...base,
        phase: "failed",
        status: (request.failureCode && copy.failures[request.failureCode]) || copy.failed,
        tone: "coral",
        showForm: true,
        poll: false,
      };
    default:
      // No request, or one support superseded (a returning buyer got a new server): the preview.
      return { ...base, phase: "preview", status: null, tone: "muted", showForm: true, poll: false };
  }
}
