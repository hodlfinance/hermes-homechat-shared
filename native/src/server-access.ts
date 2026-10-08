import type { AppLocale } from "../core/index";
import type { ServerAccessView, ServerOwnerSshKeyListing } from "../core/types";

/**
 * HPD-1027 S4: the server Owner's "Server access" screen, shared by the app and
 * the web. Pure model and copy; the screens only render it.
 *
 * The Owner adds, lists and revokes SSH public keys, sees the ssh command once
 * root is on, the server's host key fingerprints and its facts, and whether
 * Hermes is switched off. Private key material is refused here before it is
 * ever sent; the Plane refuses it again.
 */

export interface ServerAccessCopy {
  title: string;
  intro: string;
  keysTitle: string;
  noKeys: string;
  addTitle: string;
  publicKeyLabel: string;
  publicKeyPlaceholder: string;
  keyLabelLabel: string;
  keyLabelPlaceholder: string;
  add: string;
  adding: string;
  revoke: string;
  revoking: string;
  /** Asked before a key is removed; its access ends at once. */
  revokeConfirm: string;
  revokeConfirmCancel: string;
  keyLimit: (max: number) => string;
  exportHint: string;
  statusOff: string;
  /** HPD-1098: one line for the Owner of a server whose SSH access the Plane deliberately withholds. */
  withheldNote: string;
  statusNoKeys: string;
  statusPending: string;
  statusApplied: string;
  statusBlocked: string;
  blockedReasons: Record<string, string>;
  endpoint: string;
  hostKeys: string;
  operatingSystem: string;
  kernel: string;
  bootedAt: string;
  uptime: string;
  checkedAt: string;
  hermesOff: string;
  loadFailed: string;
  errors: Record<string, string>;
  units: { day: string; hour: string; minute: string };
  blockingTitle: string;
  blockingIntro: string;
  blockingUnreadable: string;
  blockingSharedKey: string;
  blockingRemove: string;
  blockingRemoving: string;
  blockingRequested: string;
  blockingConfirm: (path: string) => string;
  blockingConfirmCancel: string;
}

const en: ServerAccessCopy = {
  title: "Server access (SSH)",
  intro: "You are the Owner of this server. Add your SSH public key to log in as root. Your private key never leaves your computer.",
  keysTitle: "Your SSH keys",
  noKeys: "No key added yet.",
  addTitle: "Add a public key",
  publicKeyLabel: "Public key",
  publicKeyPlaceholder: "ssh-ed25519 AAAA… you@laptop",
  keyLabelLabel: "Name (optional)",
  keyLabelPlaceholder: "Laptop",
  add: "Add key",
  adding: "Adding…",
  revoke: "Remove",
  revoking: "Removing…",
  revokeConfirm: "Remove key? Access with this key ends immediately.",
  revokeConfirmCancel: "Cancel",
  keyLimit: (max) => `At most ${max} keys.`,
  exportHint: "Add an ed25519 or RSA key: a full export of your server is encrypted to one of those.",
  statusOff: "Root access over SSH is not switched on for your server yet.",
  withheldNote: "Server access is not enabled for this server yet.",
  statusNoKeys: "Add a key to log in as root.",
  statusPending: "Your keys are being placed on your server. This takes a few minutes.",
  statusApplied: "Root login is ready.",
  statusBlocked: "Root login is not available yet.",
  blockedReasons: {
    shared_ai_key_on_guest: "Your server still holds our shared AI key. Root opens once it uses your own key.",
    customer_ai_key_missing: "Your server's own AI key is not ready yet. Root opens once it is.",
    per_customer_ai_keys_off: "Your server does not use its own AI key yet. Root opens once it does.",
    managed_fin_workspace: "This server is managed by Fin and has no root access.",
    guest_scan_incomplete: "The safety check of your server did not finish. It runs again shortly.",
    guest_scan_missing: "The safety check of your server has not run yet.",
    customer_root_off: "Root access over SSH is not switched on for your server yet.",
    shared_ai_key_not_revoked: "Our old shared AI key is not retired yet. Root opens once it is; nothing to do on your side.",
    runtime_not_fresh: "Your server needs one restart with its own AI key. Root opens after that.",
    guest_scan_stale: "The safety check of your server runs again shortly.",
  },
  endpoint: "Log in with",
  hostKeys: "Server key fingerprints",
  operatingSystem: "Operating system",
  kernel: "Kernel",
  bootedAt: "Running since",
  uptime: "Uptime",
  checkedAt: "Last checked",
  hermesOff: "Hermes is switched off on your server. Remove /etc/heyhermes/hermes-disabled and start it again to use the app chat.",
  loadFailed: "Server access could not be loaded. Try again.",
  errors: {
    private_key_material: "That is a private key. Never share it: paste the public key (the .pub file) instead.",
    invalid_public_key: "That is not a valid SSH public key.",
    unsupported_key_type: "This key type is not supported. Use ed25519, ECDSA or RSA.",
    weak_rsa_key: "RSA keys need at least 2048 bits.",
    invalid_label: "The name is too long or contains invalid characters.",
    ssh_key_limit_reached: "You already have the maximum number of keys. Remove one first.",
    ssh_key_not_found: "That key was already removed.",
    server_owner_required: "Only the server Owner can manage SSH keys.",
    firecracker_server_required: "SSH keys need your own Hey Hermes server.",
    blocking_path_not_found: "That file no longer blocks root. The list is up to date now.",
    generic: "That did not work. Try again.",
  },
  units: { day: "d", hour: "h", minute: "min" },
  blockingTitle: "What keeps root closed",
  blockingIntro: "Remove these files to open root login. The next safety check runs a few minutes later.",
  blockingUnreadable: "The safety check could not read this file.",
  blockingSharedKey: "This file still holds our shared AI key.",
  blockingRemove: "Remove",
  blockingRemoving: "Removing…",
  blockingRequested: "Removal requested. It happens with the next safety check.",
  blockingConfirm: (path) => `Delete ${path}? This cannot be undone.`,
  blockingConfirmCancel: "Cancel",
};

const de: ServerAccessCopy = {
  title: "Serverzugang (SSH)",
  intro: "Du bist Owner dieses Servers. Hinterlege Deinen öffentlichen SSH-Schlüssel, um Dich als root anzumelden. Dein privater Schlüssel verlässt nie Deinen Computer.",
  keysTitle: "Deine SSH-Schlüssel",
  noKeys: "Noch kein Schlüssel hinterlegt.",
  addTitle: "Öffentlichen Schlüssel hinzufügen",
  publicKeyLabel: "Öffentlicher Schlüssel",
  publicKeyPlaceholder: "ssh-ed25519 AAAA… du@laptop",
  keyLabelLabel: "Name (optional)",
  keyLabelPlaceholder: "Laptop",
  add: "Schlüssel hinzufügen",
  adding: "Wird hinzugefügt…",
  revoke: "Entfernen",
  revoking: "Wird entfernt…",
  revokeConfirm: "Schlüssel entfernen? Der Zugang mit diesem Schlüssel endet sofort.",
  revokeConfirmCancel: "Abbrechen",
  keyLimit: (max) => `Höchstens ${max} Schlüssel.`,
  exportHint: "Hinterlege einen ed25519- oder RSA-Schlüssel: Ein vollständiger Export Deines Servers wird für einen solchen verschlüsselt.",
  statusOff: "Der root-Zugang über SSH ist für Deinen Server noch nicht eingeschaltet.",
  withheldNote: "Serverzugang ist für diesen Server noch nicht freigeschaltet.",
  statusNoKeys: "Füge einen Schlüssel hinzu, um Dich als root anzumelden.",
  statusPending: "Deine Schlüssel werden auf Deinen Server gebracht. Das dauert ein paar Minuten.",
  statusApplied: "Die root-Anmeldung ist bereit.",
  statusBlocked: "Die root-Anmeldung ist noch nicht verfügbar.",
  blockedReasons: {
    shared_ai_key_on_guest: "Dein Server hat noch unseren gemeinsamen KI-Schlüssel. root öffnet sich, sobald er seinen eigenen nutzt.",
    customer_ai_key_missing: "Der eigene KI-Schlüssel Deines Servers ist noch nicht bereit. root öffnet sich, sobald er es ist.",
    per_customer_ai_keys_off: "Dein Server nutzt noch keinen eigenen KI-Schlüssel. root öffnet sich, sobald er es tut.",
    managed_fin_workspace: "Dieser Server wird von Fin verwaltet und hat keinen root-Zugang.",
    guest_scan_incomplete: "Die Sicherheitsprüfung Deines Servers wurde nicht fertig. Sie läuft gleich erneut.",
    guest_scan_missing: "Die Sicherheitsprüfung Deines Servers ist noch nicht gelaufen.",
    customer_root_off: "Der root-Zugang über SSH ist für Deinen Server noch nicht eingeschaltet.",
    shared_ai_key_not_revoked: "Unser alter gemeinsamer KI-Schlüssel ist noch nicht stillgelegt. root öffnet sich danach; Du musst nichts tun.",
    runtime_not_fresh: "Dein Server braucht einen Neustart mit seinem eigenen KI-Schlüssel. Danach öffnet sich root.",
    guest_scan_stale: "Die Sicherheitsprüfung Deines Servers läuft gleich erneut.",
  },
  endpoint: "Anmelden mit",
  hostKeys: "Fingerabdrücke der Serverschlüssel",
  operatingSystem: "Betriebssystem",
  kernel: "Kernel",
  bootedAt: "Läuft seit",
  uptime: "Laufzeit",
  checkedAt: "Zuletzt geprüft",
  hermesOff: "Hermes ist auf Deinem Server ausgeschaltet. Entferne /etc/heyhermes/hermes-disabled und starte es wieder, um den App-Chat zu nutzen.",
  loadFailed: "Der Serverzugang konnte nicht geladen werden. Versuche es noch einmal.",
  errors: {
    private_key_material: "Das ist ein privater Schlüssel. Gib ihn nie weiter: Füge den öffentlichen Schlüssel ein (die .pub-Datei).",
    invalid_public_key: "Das ist kein gültiger öffentlicher SSH-Schlüssel.",
    unsupported_key_type: "Dieser Schlüsseltyp wird nicht unterstützt. Nutze ed25519, ECDSA oder RSA.",
    weak_rsa_key: "RSA-Schlüssel brauchen mindestens 2048 Bit.",
    invalid_label: "Der Name ist zu lang oder enthält ungültige Zeichen.",
    ssh_key_limit_reached: "Du hast schon die Höchstzahl an Schlüsseln. Entferne zuerst einen.",
    ssh_key_not_found: "Dieser Schlüssel wurde schon entfernt.",
    server_owner_required: "Nur der Owner des Servers kann SSH-Schlüssel verwalten.",
    firecracker_server_required: "SSH-Schlüssel brauchen Deinen eigenen Hey-Hermes-Server.",
    blocking_path_not_found: "Diese Datei sperrt root nicht mehr. Die Liste ist jetzt aktuell.",
    generic: "Das hat nicht geklappt. Versuche es noch einmal.",
  },
  units: { day: "T", hour: "Std", minute: "Min" },
  blockingTitle: "Was den root-Zugang noch sperrt",
  blockingIntro: "Entferne diese Dateien, um die root-Anmeldung zu öffnen. Die nächste Sicherheitsprüfung läuft ein paar Minuten später.",
  blockingUnreadable: "Die Sicherheitsprüfung konnte diese Datei nicht lesen.",
  blockingSharedKey: "Diese Datei enthält noch unseren gemeinsamen KI-Schlüssel.",
  blockingRemove: "Entfernen",
  blockingRemoving: "Wird entfernt…",
  blockingRequested: "Entfernen angefordert. Es geschieht mit der nächsten Sicherheitsprüfung.",
  blockingConfirm: (path) => `${path} löschen? Das lässt sich nicht rückgängig machen.`,
  blockingConfirmCancel: "Abbrechen",
};

// The other app languages fall back to English until their copy is reviewed.
const byLocale: Partial<Record<AppLocale, ServerAccessCopy>> = { en, de };

// The key-removal confirm is safety copy, so every app language has it already.
const revokeConfirmByLocale: Record<AppLocale, Pick<ServerAccessCopy, "revoke" | "revokeConfirm" | "revokeConfirmCancel">> = {
  en: { revoke: en.revoke, revokeConfirm: en.revokeConfirm, revokeConfirmCancel: en.revokeConfirmCancel },
  de: { revoke: de.revoke, revokeConfirm: de.revokeConfirm, revokeConfirmCancel: de.revokeConfirmCancel },
  fr: { revoke: "Supprimer", revokeConfirm: "Supprimer la clé ? L’accès avec cette clé prend fin immédiatement.", revokeConfirmCancel: "Annuler" },
  es: { revoke: "Eliminar", revokeConfirm: "¿Eliminar la clave? El acceso con esta clave termina de inmediato.", revokeConfirmCancel: "Cancelar" },
  it: { revoke: "Rimuovi", revokeConfirm: "Rimuovere la chiave? L’accesso con questa chiave termina subito.", revokeConfirmCancel: "Annulla" },
  "pt-BR": { revoke: "Remover", revokeConfirm: "Remover a chave? O acesso com esta chave termina imediatamente.", revokeConfirmCancel: "Cancelar" },
  ja: { revoke: "削除", revokeConfirm: "鍵を削除しますか？この鍵によるアクセスはすぐに終了します。", revokeConfirmCancel: "キャンセル" },
  ko: { revoke: "삭제", revokeConfirm: "키를 삭제할까요? 이 키로 하는 접속은 즉시 종료됩니다.", revokeConfirmCancel: "취소" },
};

export function serverAccessCopy(locale: AppLocale): ServerAccessCopy {
  return { ...(byLocale[locale] ?? en), ...(revokeConfirmByLocale[locale] ?? {}) };
}

/** Same shapes the Plane refuses first (apps/api/src/server-owner-ssh-keys.ts). */
export function looksLikePrivateKey(text: string) {
  return /PRIVATE KEY|PuTTY-User-Key-File|-----BEGIN|-----END/i.test(text);
}

export function serverAccessErrorMessage(code: string | null | undefined, copy: ServerAccessCopy) {
  return (code && copy.errors[code]) || copy.errors.generic!;
}

export function formatServerUptime(seconds: number | null | undefined, copy: ServerAccessCopy) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return null;
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days} ${copy.units.day} ${hours} ${copy.units.hour}`;
  if (hours > 0) return `${hours} ${copy.units.hour} ${minutes} ${copy.units.minute}`;
  return `${minutes} ${copy.units.minute}`;
}

export type ServerAccessTone = "teal" | "amber" | "muted";

export function serverAccessStatus(
  access: Pick<ServerAccessView, "ssh"> | null,
  keys: Pick<ServerOwnerSshKeyListing, "delivery" | "deliveryReason"> | null,
  copy: ServerAccessCopy,
): { tone: ServerAccessTone; text: string } {
  const delivery = access?.ssh.delivery ?? keys?.delivery ?? "off";
  const reason = access?.ssh.deliveryReason ?? keys?.deliveryReason ?? null;
  switch (delivery) {
    case "applied":
      return { tone: "teal", text: copy.statusApplied };
    case "no_keys":
      return { tone: "muted", text: copy.statusNoKeys };
    case "pending":
      return { tone: "amber", text: copy.statusPending };
    case "blocked":
      return { tone: "amber", text: (reason && copy.blockedReasons[reason]) || copy.statusBlocked };
    default:
      return { tone: "muted", text: copy.statusOff };
  }
}

export interface ServerAccessRow {
  key: string;
  label: string;
  detail: string;
  monospace?: boolean;
}

/** The facts rows in display order; a fact the server has not reported is left out. */
export function serverAccessRows(
  access: ServerAccessView | null,
  copy: ServerAccessCopy,
  formatDate: (iso: string) => string,
): ServerAccessRow[] {
  if (!access) return [];
  const rows: ServerAccessRow[] = [];
  if (access.ssh.endpoint) rows.push({ key: "endpoint", label: copy.endpoint, detail: access.ssh.endpoint.command, monospace: true });
  for (const hostKey of access.ssh.hostKeys) {
    rows.push({ key: `hostkey-${hostKey.algorithm}`, label: `${copy.hostKeys} · ${hostKey.algorithm}`, detail: hostKey.fingerprintSha256, monospace: true });
  }
  if (access.server.operatingSystem) rows.push({ key: "os", label: copy.operatingSystem, detail: access.server.operatingSystem });
  if (access.server.kernel) rows.push({ key: "kernel", label: copy.kernel, detail: access.server.kernel, monospace: true });
  if (access.server.bootedAt) rows.push({ key: "booted", label: copy.bootedAt, detail: formatDate(access.server.bootedAt) });
  const uptime = formatServerUptime(access.server.uptimeSeconds, copy);
  if (uptime) rows.push({ key: "uptime", label: copy.uptime, detail: uptime });
  if (access.server.checkedAt) rows.push({ key: "checked", label: copy.checkedAt, detail: formatDate(access.server.checkedAt) });
  return rows;
}

/**
 * HPD-1027 S4: whether the server access screen shows at all. Only for the Owner, only while customer
 * SSH is switched on for the workspace (server-identity ownerAccessAvailable), and never once the
 * Plane says it is off (delivery "off" or the routes answer owner_access_unavailable).
 */
export function serverAccessVisible(identity: { serverOwner?: boolean; ownerAccessAvailable?: boolean } | null | undefined) {
  return identity?.serverOwner === true && identity.ownerAccessAvailable === true;
}

/**
 * HPD-1098: the Owner of a server the Plane deliberately keeps without customer SSH (a protected
 * workspace, server-identity ownerAccessWithheld) reads one honest line where the section would be,
 * instead of nothing.
 */
export function serverAccessWithheldVisible(
  identity: { serverOwner?: boolean; ownerAccessAvailable?: boolean; ownerAccessWithheld?: boolean } | null | undefined,
) {
  return identity?.serverOwner === true && identity.ownerAccessAvailable !== true && identity.ownerAccessWithheld === true;
}

export function serverAccessSwitchedOff(
  access: Pick<ServerAccessView, "ssh"> | null,
  keys: Pick<ServerOwnerSshKeyListing, "delivery"> | null,
  errorCode: string | null,
) {
  return errorCode === "owner_access_unavailable" || access?.ssh.delivery === "off" || keys?.delivery === "off";
}

export function serverHermesSwitchedOff(access: Pick<ServerAccessView, "hermes"> | null) {
  return access?.hermes.state === "disabled-by-owner";
}

export interface ServerBlockingRow {
  path: string;
  reason: string;
  pending: boolean;
}

/** HPD-1027 S4: before the first root grant, each blocking path with its reason and whether removal is requested. */
export function serverBlockingRows(access: Pick<ServerAccessView, "ssh"> | null, copy: ServerAccessCopy): ServerBlockingRow[] {
  const pending = new Set(access?.ssh.pendingRemovals ?? []);
  return (access?.ssh.blockingPaths ?? []).map((entry) => ({
    path: entry.path,
    reason: entry.why === "shared_ai_key" ? copy.blockingSharedKey : copy.blockingUnreadable,
    pending: pending.has(entry.path),
  }));
}
