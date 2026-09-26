import type { AppLocale, ChatMessage, ConversationSession } from "../core/index";

/**
 * HPD-843. Every automation gets its own thread in the left menu.
 *
 * The plane makes a conversation for a job when it delivers the job's first
 * result and puts every later result there; `automationJobId` names that job.
 * The menu lists exactly these conversations -- never a sub thread or any
 * other chat, because the customer cannot start threads of his own.
 */

/** The conversation list loads at least this many, so no automation thread is cut off. */
export const automationThreadListLimit = 50;

const unreadMessagesCopy: Record<AppLocale, (count: number) => string> = {
  en: (count) => `${count} unread ${count === 1 ? "message" : "messages"}`,
  de: (count) => `${count} ungelesene ${count === 1 ? "Nachricht" : "Nachrichten"}`,
  fr: (count) => `${count} ${count === 1 ? "message non lu" : "messages non lus"}`,
  es: (count) => `${count} ${count === 1 ? "mensaje sin leer" : "mensajes sin leer"}`,
  it: (count) => `${count} ${count === 1 ? "messaggio non letto" : "messaggi non letti"}`,
  "pt-BR": (count) => `${count} ${count === 1 ? "mensagem não lida" : "mensagens não lidas"}`,
  ja: (count) => `未読メッセージ ${count} 件`,
  ko: (count) => `읽지 않은 메시지 ${count}개`,
};

/**
 * HPD-924. Use only the server's account-scoped unreadCount. An absent field
 * on an older plane means no badge, never a local estimate from messageCount.
 */
export function automationThreadUnreadBadge(
  title: string,
  unreadCount: unknown,
  locale: AppLocale,
): { count: number; label: string; accessibilityLabel: string } | null {
  if (!Number.isSafeInteger(unreadCount) || (unreadCount as number) <= 0) return null;
  const count = unreadCount as number;
  const label = count > 99 ? "99+" : String(count);
  const unread = (unreadMessagesCopy[locale] ?? unreadMessagesCopy.en)(count);
  return { count, label, accessibilityLabel: `${title}, ${unread}` };
}

function activityTime(session: ConversationSession) {
  const stamp = session.lastMessageAt ?? session.updatedAt ?? session.createdAt;
  const time = stamp ? Date.parse(stamp) : Number.NaN;
  return Number.isFinite(time) ? time : 0;
}

export function isAutomationThread(session: ConversationSession | null | undefined): session is ConversationSession {
  return Boolean(session && session.status === "active" && session.role !== "home" && session.automationJobId);
}

/** Active automation threads, newest activity first. */
export function automationThreads(sessions: readonly ConversationSession[]): ConversationSession[] {
  return sessions
    .filter(isAutomationThread)
    .map((session, index) => ({ session, index, time: activityTime(session) }))
    .sort((left, right) => right.time - left.time || left.index - right.index)
    .map((entry) => entry.session);
}

/** The open thread of one automation, or null while its next result will make one. */
export function automationThreadForJob(
  sessions: readonly ConversationSession[],
  jobId: string | null | undefined,
): ConversationSession | null {
  if (!jobId) return null;
  return automationThreads(sessions).find((session) => session.automationJobId === jobId) ?? null;
}

// The same sentences as the Hey web menu (apps/web/lib/automation-threads.ts).
const removalTranslations: Record<AppLocale, readonly [string, string, string, string, string, string]> = {
  en: ["Delete thread", "Cancel", "Delete {title}?", "Only this thread is deleted. The automation keeps running, and its next result opens a new thread.", "Could not delete this thread.", "Deleting…"],
  de: ["Thread löschen", "Abbrechen", "{title} löschen?", "Nur dieser Thread wird gelöscht. Die Automation läuft weiter, und ihr nächstes Ergebnis öffnet einen neuen Thread.", "Dieser Thread konnte nicht gelöscht werden.", "Wird gelöscht…"],
  fr: ["Supprimer le fil", "Annuler", "Supprimer {title} ?", "Seul ce fil est supprimé. L’automatisation continue, et son prochain résultat ouvre un nouveau fil.", "Impossible de supprimer ce fil.", "Suppression…"],
  es: ["Eliminar hilo", "Cancelar", "¿Eliminar {title}?", "Solo se elimina este hilo. La automatización sigue funcionando y su próximo resultado abre un hilo nuevo.", "No se pudo eliminar este hilo.", "Eliminando…"],
  it: ["Elimina thread", "Annulla", "Eliminare {title}?", "Viene eliminato solo questo thread. L’automazione continua e il suo prossimo risultato apre un nuovo thread.", "Impossibile eliminare questo thread.", "Eliminazione…"],
  "pt-BR": ["Excluir conversa", "Cancelar", "Excluir {title}?", "Somente esta conversa é excluída. A automação continua e o próximo resultado abre uma nova conversa.", "Não foi possível excluir esta conversa.", "Excluindo…"],
  ja: ["スレッドを削除", "キャンセル", "{title}を削除しますか？", "このスレッドのみ削除されます。自動化は継続し、次の結果で新しいスレッドが作成されます。", "このスレッドを削除できませんでした。", "削除中…"],
  ko: ["스레드 삭제", "취소", "{title} 스레드를 삭제할까요?", "이 스레드만 삭제됩니다. 자동화는 계속 실행되며 다음 결과가 새 스레드를 엽니다.", "이 스레드를 삭제하지 못했습니다.", "삭제 중…"],
};

// HPD-898, Justus' words: English "View all automations", German "Alle
// Automationen anzeigen"; the other six carry the same meaning.
const viewAllAutomations: Record<AppLocale, string> = {
  en: "View all automations",
  de: "Alle Automationen anzeigen",
  fr: "Voir toutes les automatisations",
  es: "Ver todas las automatizaciones",
  it: "Mostra tutte le automazioni",
  "pt-BR": "Ver todas as automações",
  ja: "すべての自動化を表示",
  ko: "모든 자동화 보기",
};

/** HPD-898: the entry in an automation thread's menu that opens the automations screen. */
export function automationThreadViewAllLabel(locale: AppLocale) {
  return viewAllAutomations[locale] ?? viewAllAutomations.en;
}

export function automationThreadRemovalCopy(locale: AppLocale, title: string) {
  const [remove, cancel, question, message, failed, pending] = removalTranslations[locale] ?? removalTranslations.en;
  return { remove, cancel, title: question.replace("{title}", title), message, failed, pending };
}

// HPD-924: the accessible name of the top-right button that replaces Help in
// an open automation thread and holds View all automations and Delete.
const threadOptions: Record<AppLocale, string> = {
  en: "Thread options",
  de: "Thread-Optionen",
  fr: "Options du fil",
  es: "Opciones del hilo",
  it: "Opzioni del thread",
  "pt-BR": "Opções da conversa",
  ja: "スレッドのオプション",
  ko: "스레드 옵션",
};

export function automationThreadOptionsLabel(locale: AppLocale) {
  return threadOptions[locale] ?? threadOptions.en;
}

/**
 * HPD-924: the left menu's order. Automation threads stand before Pages,
 * New App or Page follows the Pages, and Suggestions -- only on a surface
 * that already has it -- is last, after New App or Page.
 */
export type MobileDrawerSection = "primary" | "connectGmail" | "automationThreads" | "pages" | "newPage" | "suggestions";

export function mobileDrawerSections(input: { suggestions: boolean; connectGmail: boolean }): MobileDrawerSection[] {
  const sections: MobileDrawerSection[] = ["primary"];
  if (input.connectGmail) sections.push("connectGmail");
  sections.push("automationThreads", "pages", "newPage");
  if (input.suggestions) sections.push("suggestions");
  return sections;
}

/**
 * HPD-924: which message, if any, the client may acknowledge as read now.
 *
 * Only the automation thread on screen, only while the app and its host are in
 * front, and only the newest message of that conversation the client has
 * actually rendered -- never a copy drawn before the server answered. A plane
 * that states no unreadCount has no read cursor, so nothing is sent to it.
 * The same message is acknowledged once; a later rendered message is a new
 * acknowledgement.
 */
export function automationThreadReadTarget(input: {
  session: ConversationSession | null | undefined;
  activeConversationId: string | null | undefined;
  inFront: boolean;
  renderedMessages: readonly Pick<ChatMessage, "id" | "conversationSessionId" | "optimistic" | "createdAt">[];
  acknowledgedMessageId: string | null | undefined;
}): { conversationId: string; messageId: string } | null {
  const { session } = input;
  if (!input.inFront || !isAutomationThread(session)) return null;
  if (session.id !== input.activeConversationId) return null;
  if (!Number.isSafeInteger(session.unreadCount)) return null;
  // Newest by its stored time; on a tie or an unreadable time, the later one
  // in the transcript.
  let newest: string | null = null;
  let newestTime = Number.NEGATIVE_INFINITY;
  for (const message of input.renderedMessages) {
    if (message.optimistic || !message.id || message.conversationSessionId !== session.id) continue;
    const parsed = Date.parse(message.createdAt);
    const time = Number.isFinite(parsed) ? parsed : newestTime;
    if (time >= newestTime) {
      newest = message.id;
      newestTime = time;
    }
  }
  if (!newest || newest === input.acknowledgedMessageId) return null;
  return { conversationId: session.id, messageId: newest };
}

/**
 * HPD-924: applies the plane's answer to one read acknowledgement. Two
 * acknowledgements for the same thread can overlap; only the answer to the
 * one still current may set the count, so an older answer arriving last
 * cannot put back a badge the newer one cleared.
 */
export function applyAutomationThreadReadAnswer(
  sessions: ConversationSession[],
  updated: Pick<ConversationSession, "id" | "unreadCount">,
  acknowledgement: { messageId: string; acknowledgedMessageId: string | null | undefined },
): ConversationSession[] {
  if (acknowledgement.acknowledgedMessageId !== acknowledgement.messageId) return sessions;
  return sessions.map((session) => (
    session.id === updated.id ? { ...session, unreadCount: updated.unreadCount ?? 0 } : session
  ));
}
