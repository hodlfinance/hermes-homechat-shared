import type { AppLocale } from "../core/index";
import type { ServerFullExportStatus } from "../core/types";

/**
 * HPD-1027 S5: the server Owner's full server archive, shared by the app and
 * the web. Pure model and copy; the screens only render it.
 *
 * It sits beside the partial export (files, memory, conversations as a zip),
 * which stays. The full archive is the whole server - system disk, private
 * disk, conversations and memory - with our own secrets removed, encrypted
 * with age to the Owner's ssh-ed25519 / ssh-rsa keys. Only the Owner's private
 * key opens it; the Owner downloads it with their own session for seven days.
 */

export const SERVER_FULL_EXPORT_DOWNLOAD_HREF = "/api/workspace/server/export/download";

export interface ServerFullExportCopy {
  title: string;
  intro: (days: number) => string;
  create: string;
  creating: string;
  download: string;
  noKey: string;
  requested: string;
  running: string;
  ready: (size: string, until: string) => string;
  openWith: string;
  expired: string;
  failed: string;
  failures: Record<string, string>;
  errors: Record<string, string>;
  loadFailed: string;
}

const en: ServerFullExportCopy = {
  title: "Full server archive (encrypted to your SSH key)",
  intro: (days) => `Your whole server - system, files, memory and conversations - in one file that only your SSH key can open. Our own keys are taken out first. The download works for ${days} days. The export above stays for a quick copy of your data.`,
  create: "Create full archive",
  creating: "Requesting…",
  download: "Download full archive",
  noKey: "Add an ed25519 or RSA key under Server access first. The archive is encrypted to it, so only you can open it.",
  requested: "Requested. Your server will be archived shortly; you can leave this page.",
  running: "Your server is being archived now. This can take a while; you can leave this page.",
  ready: (size, until) => `Ready: ${size}, download until ${until}.`,
  openWith: "Open it with: age -d -i ~/.ssh/id_ed25519 FILE | tar -x",
  expired: "Your last archive has expired. Create a new one when you need it.",
  failed: "The archive could not be created. Try again.",
  failures: {
    operator_key_unreachable: "Our safety check found one of our keys in a place it cannot clean, so nothing was exported. Please contact support.",
    stale: "Archiving took too long and was stopped. Try again.",
  },
  errors: {
    full_export_in_progress: "An archive is already being created.",
    full_export_no_eligible_key: "Add an ed25519 or RSA key under Server access first.",
    full_export_not_ready: "The archive is not ready (any more).",
    generic: "That did not work. Try again.",
  },
  loadFailed: "The full server archive could not be loaded. Try again.",
};

const de: ServerFullExportCopy = {
  title: "Server-Komplettarchiv (für Deinen SSH-Schlüssel verschlüsselt)",
  intro: (days) => `Dein ganzer Server - System, Dateien, Gedächtnis und Unterhaltungen - in einer Datei, die nur Dein SSH-Schlüssel öffnen kann. Unsere eigenen Schlüssel werden vorher entfernt. Der Download gilt ${days} Tage. Der Export oben bleibt für eine schnelle Kopie Deiner Daten.`,
  create: "Komplettarchiv erstellen",
  creating: "Wird angefordert…",
  download: "Komplettarchiv herunterladen",
  noKey: "Hinterlege zuerst unter Serverzugang einen ed25519- oder RSA-Schlüssel. Das Archiv wird dafür verschlüsselt, nur Du kannst es öffnen.",
  requested: "Angefordert. Dein Server wird gleich archiviert; Du kannst diese Seite verlassen.",
  running: "Dein Server wird gerade archiviert. Das kann dauern; Du kannst diese Seite verlassen.",
  ready: (size, until) => `Bereit: ${size}, Download bis ${until}.`,
  openWith: "Öffnen mit: age -d -i ~/.ssh/id_ed25519 DATEI | tar -x",
  expired: "Dein letztes Archiv ist abgelaufen. Erstelle ein neues, wenn Du es brauchst.",
  failed: "Das Archiv konnte nicht erstellt werden. Versuche es noch einmal.",
  failures: {
    operator_key_unreachable: "Unsere Sicherheitsprüfung hat einen unserer Schlüssel an einer Stelle gefunden, die sie nicht bereinigen kann; es wurde nichts exportiert. Bitte wende Dich an den Support.",
    stale: "Das Archivieren hat zu lange gedauert und wurde abgebrochen. Versuche es noch einmal.",
  },
  errors: {
    full_export_in_progress: "Es wird bereits ein Archiv erstellt.",
    full_export_no_eligible_key: "Hinterlege zuerst unter Serverzugang einen ed25519- oder RSA-Schlüssel.",
    full_export_not_ready: "Das Archiv ist nicht (mehr) bereit.",
    generic: "Das hat nicht geklappt. Versuche es noch einmal.",
  },
  loadFailed: "Das Server-Komplettarchiv konnte nicht geladen werden. Versuche es noch einmal.",
};

const fr: ServerFullExportCopy = {
  title: "Archive complète du serveur (chiffrée pour votre clé SSH)",
  intro: (days) => `Tout votre serveur - système, fichiers, mémoire et conversations - dans un seul fichier que seule votre clé SSH peut ouvrir. Nos propres clés en sont retirées d'abord. Le téléchargement reste disponible ${days} jours. L'export ci-dessus reste pour une copie rapide de vos données.`,
  create: "Créer l'archive complète",
  creating: "Demande en cours…",
  download: "Télécharger l'archive complète",
  noKey: "Ajoutez d'abord une clé ed25519 ou RSA dans Accès au serveur. L'archive est chiffrée pour elle : vous seul pouvez l'ouvrir.",
  requested: "Demandée. Votre serveur sera archivé sous peu ; vous pouvez quitter cette page.",
  running: "Votre serveur est en cours d'archivage. Cela peut prendre un moment ; vous pouvez quitter cette page.",
  ready: (size, until) => `Prête : ${size}, téléchargeable jusqu'au ${until}.`,
  openWith: "Ouvrez-la avec : age -d -i ~/.ssh/id_ed25519 FICHIER | tar -x",
  expired: "Votre dernière archive a expiré. Créez-en une nouvelle si besoin.",
  failed: "L'archive n'a pas pu être créée. Réessayez.",
  failures: {
    operator_key_unreachable: "Notre contrôle de sécurité a trouvé une de nos clés à un endroit qu'il ne peut pas nettoyer ; rien n'a été exporté. Contactez le support.",
    stale: "L'archivage a pris trop de temps et a été arrêté. Réessayez.",
  },
  errors: {
    full_export_in_progress: "Une archive est déjà en cours de création.",
    full_export_no_eligible_key: "Ajoutez d'abord une clé ed25519 ou RSA dans Accès au serveur.",
    full_export_not_ready: "L'archive n'est pas (plus) disponible.",
    generic: "Cela n'a pas fonctionné. Réessayez.",
  },
  loadFailed: "L'archive complète du serveur n'a pas pu être chargée. Réessayez.",
};

const es: ServerFullExportCopy = {
  title: "Archivo completo del servidor (cifrado para tu clave SSH)",
  intro: (days) => `Todo tu servidor - sistema, archivos, memoria y conversaciones - en un solo archivo que solo tu clave SSH puede abrir. Antes se eliminan nuestras propias claves. La descarga funciona durante ${days} días. La exportación de arriba sigue disponible para una copia rápida de tus datos.`,
  create: "Crear archivo completo",
  creating: "Solicitando…",
  download: "Descargar archivo completo",
  noKey: "Primero añade una clave ed25519 o RSA en Acceso al servidor. El archivo se cifra para ella, así que solo tú puedes abrirlo.",
  requested: "Solicitado. Tu servidor se archivará en breve; puedes salir de esta página.",
  running: "Tu servidor se está archivando ahora. Puede tardar; puedes salir de esta página.",
  ready: (size, until) => `Listo: ${size}, descarga hasta el ${until}.`,
  openWith: "Ábrelo con: age -d -i ~/.ssh/id_ed25519 ARCHIVO | tar -x",
  expired: "Tu último archivo ha caducado. Crea uno nuevo cuando lo necesites.",
  failed: "No se pudo crear el archivo. Inténtalo de nuevo.",
  failures: {
    operator_key_unreachable: "Nuestra comprobación de seguridad encontró una de nuestras claves en un lugar que no puede limpiar; no se exportó nada. Contacta con soporte.",
    stale: "El archivado tardó demasiado y se detuvo. Inténtalo de nuevo.",
  },
  errors: {
    full_export_in_progress: "Ya se está creando un archivo.",
    full_export_no_eligible_key: "Primero añade una clave ed25519 o RSA en Acceso al servidor.",
    full_export_not_ready: "El archivo no está (o ya no está) listo.",
    generic: "No ha funcionado. Inténtalo de nuevo.",
  },
  loadFailed: "No se pudo cargar el archivo completo del servidor. Inténtalo de nuevo.",
};

const it: ServerFullExportCopy = {
  title: "Archivio completo del server (cifrato per la tua chiave SSH)",
  intro: (days) => `Tutto il tuo server - sistema, file, memoria e conversazioni - in un unico file che solo la tua chiave SSH può aprire. Prima vengono rimosse le nostre chiavi. Il download funziona per ${days} giorni. L'esportazione qui sopra resta per una copia rapida dei tuoi dati.`,
  create: "Crea archivio completo",
  creating: "Richiesta in corso…",
  download: "Scarica archivio completo",
  noKey: "Aggiungi prima una chiave ed25519 o RSA in Accesso al server. L'archivio è cifrato per quella chiave, quindi solo tu puoi aprirlo.",
  requested: "Richiesto. Il tuo server verrà archiviato a breve; puoi lasciare questa pagina.",
  running: "Il tuo server è in fase di archiviazione. Può richiedere un po'; puoi lasciare questa pagina.",
  ready: (size, until) => `Pronto: ${size}, scaricabile fino al ${until}.`,
  openWith: "Aprilo con: age -d -i ~/.ssh/id_ed25519 FILE | tar -x",
  expired: "Il tuo ultimo archivio è scaduto. Creane uno nuovo quando ti serve.",
  failed: "Non è stato possibile creare l'archivio. Riprova.",
  failures: {
    operator_key_unreachable: "Il nostro controllo di sicurezza ha trovato una delle nostre chiavi in un punto che non può ripulire; non è stato esportato nulla. Contatta il supporto.",
    stale: "L'archiviazione ha richiesto troppo tempo ed è stata interrotta. Riprova.",
  },
  errors: {
    full_export_in_progress: "È già in corso la creazione di un archivio.",
    full_export_no_eligible_key: "Aggiungi prima una chiave ed25519 o RSA in Accesso al server.",
    full_export_not_ready: "L'archivio non è (più) disponibile.",
    generic: "Non ha funzionato. Riprova.",
  },
  loadFailed: "Non è stato possibile caricare l'archivio completo del server. Riprova.",
};

const ptBR: ServerFullExportCopy = {
  title: "Arquivo completo do servidor (criptografado para sua chave SSH)",
  intro: (days) => `Todo o seu servidor - sistema, arquivos, memória e conversas - em um único arquivo que só a sua chave SSH abre. Nossas próprias chaves são removidas antes. O download funciona por ${days} dias. A exportação acima continua para uma cópia rápida dos seus dados.`,
  create: "Criar arquivo completo",
  creating: "Solicitando…",
  download: "Baixar arquivo completo",
  noKey: "Primeiro adicione uma chave ed25519 ou RSA em Acesso ao servidor. O arquivo é criptografado para ela, então só você pode abri-lo.",
  requested: "Solicitado. Seu servidor será arquivado em breve; você pode sair desta página.",
  running: "Seu servidor está sendo arquivado agora. Isso pode levar um tempo; você pode sair desta página.",
  ready: (size, until) => `Pronto: ${size}, download até ${until}.`,
  openWith: "Abra com: age -d -i ~/.ssh/id_ed25519 ARQUIVO | tar -x",
  expired: "Seu último arquivo expirou. Crie um novo quando precisar.",
  failed: "Não foi possível criar o arquivo. Tente novamente.",
  failures: {
    operator_key_unreachable: "Nossa verificação de segurança encontrou uma de nossas chaves em um lugar que não consegue limpar; nada foi exportado. Fale com o suporte.",
    stale: "O arquivamento demorou demais e foi interrompido. Tente novamente.",
  },
  errors: {
    full_export_in_progress: "Um arquivo já está sendo criado.",
    full_export_no_eligible_key: "Primeiro adicione uma chave ed25519 ou RSA em Acesso ao servidor.",
    full_export_not_ready: "O arquivo não está (mais) pronto.",
    generic: "Não funcionou. Tente novamente.",
  },
  loadFailed: "Não foi possível carregar o arquivo completo do servidor. Tente novamente.",
};

const ja: ServerFullExportCopy = {
  title: "サーバーの完全アーカイブ（あなたの SSH 鍵で暗号化）",
  intro: (days) => `システム、ファイル、メモリ、会話を含むサーバー全体を、あなたの SSH 鍵でしか開けない 1 つのファイルにします。当社の鍵は事前に取り除かれます。ダウンロードは ${days} 日間有効です。上のエクスポートは、データを手早くコピーするために引き続き使えます。`,
  create: "完全アーカイブを作成",
  creating: "リクエスト中…",
  download: "完全アーカイブをダウンロード",
  noKey: "まず「サーバーアクセス」で ed25519 または RSA の鍵を追加してください。アーカイブはその鍵向けに暗号化されるため、開けるのはあなただけです。",
  requested: "リクエストしました。まもなくサーバーのアーカイブが始まります。このページを離れても大丈夫です。",
  running: "サーバーをアーカイブしています。時間がかかることがあります。このページを離れても大丈夫です。",
  ready: (size, until) => `準備完了：${size}、${until} までダウンロードできます。`,
  openWith: "開き方：age -d -i ~/.ssh/id_ed25519 ファイル | tar -x",
  expired: "前回のアーカイブは期限切れです。必要なときに新しく作成してください。",
  failed: "アーカイブを作成できませんでした。もう一度お試しください。",
  failures: {
    operator_key_unreachable: "安全チェックで、消去できない場所に当社の鍵が見つかったため、何もエクスポートしていません。サポートにお問い合わせください。",
    stale: "アーカイブに時間がかかりすぎたため中止しました。もう一度お試しください。",
  },
  errors: {
    full_export_in_progress: "すでにアーカイブを作成中です。",
    full_export_no_eligible_key: "まず「サーバーアクセス」で ed25519 または RSA の鍵を追加してください。",
    full_export_not_ready: "アーカイブは準備できていないか、すでに利用できません。",
    generic: "うまくいきませんでした。もう一度お試しください。",
  },
  loadFailed: "サーバーの完全アーカイブを読み込めませんでした。もう一度お試しください。",
};

const ko: ServerFullExportCopy = {
  title: "서버 전체 아카이브 (내 SSH 키로 암호화)",
  intro: (days) => `시스템, 파일, 메모리, 대화를 포함한 서버 전체를 내 SSH 키로만 열 수 있는 하나의 파일로 만듭니다. 저희 키는 먼저 제거됩니다. 다운로드는 ${days}일 동안 가능합니다. 위의 내보내기는 데이터를 빠르게 복사하는 용도로 그대로 남아 있습니다.`,
  create: "전체 아카이브 만들기",
  creating: "요청 중…",
  download: "전체 아카이브 다운로드",
  noKey: "먼저 서버 접근에서 ed25519 또는 RSA 키를 추가하세요. 아카이브는 그 키로 암호화되므로 나만 열 수 있습니다.",
  requested: "요청했습니다. 곧 서버 아카이브가 시작됩니다. 이 페이지를 떠나도 됩니다.",
  running: "서버를 아카이브하고 있습니다. 시간이 걸릴 수 있습니다. 이 페이지를 떠나도 됩니다.",
  ready: (size, until) => `준비됨: ${size}, ${until}까지 다운로드할 수 있습니다.`,
  openWith: "여는 방법: age -d -i ~/.ssh/id_ed25519 파일 | tar -x",
  expired: "지난 아카이브가 만료되었습니다. 필요할 때 새로 만드세요.",
  failed: "아카이브를 만들지 못했습니다. 다시 시도하세요.",
  failures: {
    operator_key_unreachable: "보안 검사에서 정리할 수 없는 위치에 저희 키가 있어 아무것도 내보내지 않았습니다. 지원팀에 문의하세요.",
    stale: "아카이브가 너무 오래 걸려 중단되었습니다. 다시 시도하세요.",
  },
  errors: {
    full_export_in_progress: "이미 아카이브를 만들고 있습니다.",
    full_export_no_eligible_key: "먼저 서버 접근에서 ed25519 또는 RSA 키를 추가하세요.",
    full_export_not_ready: "아카이브가 준비되지 않았거나 더 이상 사용할 수 없습니다.",
    generic: "실패했습니다. 다시 시도하세요.",
  },
  loadFailed: "서버 전체 아카이브를 불러오지 못했습니다. 다시 시도하세요.",
};

const byLocale: Record<AppLocale, ServerFullExportCopy> = { en, de, fr, es, it, "pt-BR": ptBR, ja, ko };

export function serverFullExportCopy(locale: AppLocale): ServerFullExportCopy {
  return byLocale[locale] ?? en;
}

/**
 * Whether the row shows at all: only for the server Owner, only while the full archive is switched
 * on for this workspace (server-identity fullExportAvailable; the Plane never sets it for a Fin
 * workspace).
 */
export function serverFullExportVisible(identity: { serverOwner?: boolean; fullExportAvailable?: boolean } | null | undefined) {
  return identity?.serverOwner === true && identity.fullExportAvailable === true;
}

export function serverFullExportErrorMessage(code: string | null | undefined, copy: ServerFullExportCopy) {
  return (code && copy.errors[code]) || copy.errors.generic!;
}

export function formatArchiveBytes(bytes: number, locale: AppLocale) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: unit === 0 ? 0 : 1 }).format(value)} ${units[unit]}`;
}

export type ServerFullExportAction = "create" | "download" | "none";

export interface ServerFullExportModel {
  /** The status line under the title, or null when there is nothing to say yet. */
  status: string | null;
  tone: "teal" | "amber" | "muted" | "coral";
  /** The one thing the Owner can do now. */
  action: ServerFullExportAction;
  actionLabel: string | null;
  /** A second line under the status (how to open a ready archive). */
  hint: string | null;
}

export function serverFullExportModel(
  status: ServerFullExportStatus | null,
  copy: ServerFullExportCopy,
  locale: AppLocale,
  formatDate: (iso: string) => string,
): ServerFullExportModel {
  if (!status) return { status: null, tone: "muted", action: "none", actionLabel: null, hint: null };
  const request = status.request;
  const create = status.eligible
    ? { action: "create" as const, actionLabel: copy.create }
    : { action: "none" as const, actionLabel: null };
  if (request?.state === "requested") return { status: copy.requested, tone: "amber", action: "none", actionLabel: null, hint: null };
  if (request?.state === "running") return { status: copy.running, tone: "amber", action: "none", actionLabel: null, hint: null };
  if (request?.state === "ready" && request.bytes !== null && request.expiresAt) {
    return {
      status: copy.ready(formatArchiveBytes(request.bytes, locale), formatDate(request.expiresAt)),
      tone: "teal",
      action: "download",
      actionLabel: copy.download,
      hint: copy.openWith,
    };
  }
  if (!status.eligible) return { status: copy.noKey, tone: "muted", action: "none", actionLabel: null, hint: null };
  if (request?.state === "failed") {
    return { status: (request.failureCode && copy.failures[request.failureCode]) || copy.failed, tone: "coral", ...create, hint: null };
  }
  if (request?.state === "expired") return { status: copy.expired, tone: "muted", ...create, hint: null };
  return { status: null, tone: "muted", ...create, hint: null };
}
