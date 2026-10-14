import type { AppLocale } from "../core/index";

/**
 * HPD-1243 F3: "Report this reply".
 *
 * Google Play's AI-generated content policy asks for an in-app way to report
 * an AI reply without leaving the app. On Android, with the launch switch on,
 * a long-press on a finished Hermes reply (or the bubble's accessibility
 * action) opens a small report sheet. The report goes through the existing
 * support route (`POST /support/requests`) as an ordinary support case: the
 * server adds account, workspace and receipt time from the signed-in session,
 * and the case is kept and deleted under the existing support rules.
 *
 * The report names the reply (message, conversation, run, reply time) and
 * carries the customer's reason and optional note. It never copies the reply
 * text or any other part of the conversation; the support mail states that no
 * chat content is attached, and that stays true.
 *
 * iOS never shows it, with the switch on or off.
 */
export const HEY_REPLY_REPORT_REASONS = ["offensive", "misleading", "other"] as const;
export type HeyReplyReportReason = (typeof HEY_REPLY_REPORT_REASONS)[number];
export const HEY_REPLY_REPORT_NOTE_MAX_LENGTH = 1_000;

export function heyReplyReportEnabled(os: string, androidLaunchEnabled: boolean | undefined): boolean {
  return os === "android" && androidLaunchEnabled === true;
}

/** A finished Hermes reply: not the customer's own message, not one still being written. */
export function heyReplyReportable(
  message: { role: string; optimistic?: boolean },
  interimMark: "working" | "stopped" | "interrupted" | null | undefined,
): boolean {
  return message.role === "assistant" && message.optimistic !== true && interimMark !== "working";
}

function boundedLine(value: string | null | undefined, maxLength: number) {
  const line = (value ?? "").replace(/[\u0000-\u001f\u007f]/gu, "").trim().slice(0, maxLength);
  return line || "unknown";
}

/** The support case text. Fixed English labels, read by support; no reply text. */
export function heyReplyReportProblem(input: {
  reason: HeyReplyReportReason;
  messageId: string;
  conversationId: string | null | undefined;
  runId: string | null | undefined;
  messageCreatedAt: string;
  note: string;
}): string {
  const note = input.note
    .replace(/\r\n?/gu, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/gu, "")
    .trim()
    .slice(0, HEY_REPLY_REPORT_NOTE_MAX_LENGTH)
    .trim();
  return [
    "Report of a Hermes reply (in-app report).",
    `Reason: ${input.reason}`,
    `Message: ${boundedLine(input.messageId, 160)}`,
    `Conversation: ${boundedLine(input.conversationId, 160)}`,
    `Run: ${boundedLine(input.runId, 160)}`,
    `Reply time: ${boundedLine(input.messageCreatedAt, 64)}`,
    `Note: ${note || "none"}`,
  ].join("\n");
}

export type HeyReplyReportCopy = Readonly<{
  action: string;
  reasonLabel: string;
  reasons: Readonly<Record<HeyReplyReportReason, string>>;
  noteLabel: string;
  boundary: string;
  send: string;
  cancel: string;
  sent: string;
  close: string;
}>;

const copyByLocale: Record<AppLocale, HeyReplyReportCopy> = {
  en: {
    action: "Report this reply",
    reasonLabel: "Why are you reporting it?",
    reasons: { offensive: "Offensive or harmful", misleading: "Wrong or misleading", other: "Something else" },
    noteLabel: "Note for support (optional)",
    boundary: "Hey Hermes support receives your reason, your note and a reference to this reply (its ID and time). The reply text and the rest of the chat are not sent.",
    send: "Send report",
    cancel: "Cancel",
    sent: "Thank you. Your report was sent to Hey Hermes support.",
    close: "Close",
  },
  de: {
    action: "Diese Antwort melden",
    reasonLabel: "Warum meldest du sie?",
    reasons: { offensive: "Beleidigend oder schädlich", misleading: "Falsch oder irreführend", other: "Etwas anderes" },
    noteLabel: "Notiz für den Support (optional)",
    boundary: "Der Hey-Hermes-Support erhält deinen Grund, deine Notiz und einen Verweis auf diese Antwort (ihre ID und Uhrzeit). Der Antworttext und der übrige Chat werden nicht gesendet.",
    send: "Meldung senden",
    cancel: "Abbrechen",
    sent: "Danke. Deine Meldung wurde an den Hey-Hermes-Support gesendet.",
    close: "Schließen",
  },
  fr: {
    action: "Signaler cette réponse",
    reasonLabel: "Pourquoi la signalez-vous ?",
    reasons: { offensive: "Offensante ou dangereuse", misleading: "Fausse ou trompeuse", other: "Autre chose" },
    noteLabel: "Note pour le support (facultatif)",
    boundary: "Le support Hey Hermes reçoit votre motif, votre note et une référence à cette réponse (son identifiant et son heure). Le texte de la réponse et le reste de la conversation ne sont pas envoyés.",
    send: "Envoyer le signalement",
    cancel: "Annuler",
    sent: "Merci. Votre signalement a été envoyé au support Hey Hermes.",
    close: "Fermer",
  },
  es: {
    action: "Reportar esta respuesta",
    reasonLabel: "¿Por qué la reportas?",
    reasons: { offensive: "Ofensiva o dañina", misleading: "Incorrecta o engañosa", other: "Otro motivo" },
    noteLabel: "Nota para soporte (opcional)",
    boundary: "El soporte de Hey Hermes recibe tu motivo, tu nota y una referencia a esta respuesta (su ID y hora). No se envían el texto de la respuesta ni el resto del chat.",
    send: "Enviar reporte",
    cancel: "Cancelar",
    sent: "Gracias. Tu reporte se envió al soporte de Hey Hermes.",
    close: "Cerrar",
  },
  it: {
    action: "Segnala questa risposta",
    reasonLabel: "Perché la segnali?",
    reasons: { offensive: "Offensiva o dannosa", misleading: "Errata o fuorviante", other: "Altro" },
    noteLabel: "Nota per il supporto (facoltativa)",
    boundary: "Il supporto di Hey Hermes riceve il motivo, la tua nota e un riferimento a questa risposta (ID e ora). Il testo della risposta e il resto della chat non vengono inviati.",
    send: "Invia segnalazione",
    cancel: "Annulla",
    sent: "Grazie. La tua segnalazione è stata inviata al supporto di Hey Hermes.",
    close: "Chiudi",
  },
  "pt-BR": {
    action: "Denunciar esta resposta",
    reasonLabel: "Por que você está denunciando?",
    reasons: { offensive: "Ofensiva ou prejudicial", misleading: "Errada ou enganosa", other: "Outro motivo" },
    noteLabel: "Observação para o suporte (opcional)",
    boundary: "O suporte do Hey Hermes recebe o motivo, sua observação e uma referência a esta resposta (ID e horário). O texto da resposta e o restante do chat não são enviados.",
    send: "Enviar denúncia",
    cancel: "Cancelar",
    sent: "Obrigado. Sua denúncia foi enviada ao suporte do Hey Hermes.",
    close: "Fechar",
  },
  ja: {
    action: "この返信を報告",
    reasonLabel: "報告する理由",
    reasons: { offensive: "不快または有害", misleading: "誤りまたは誤解を招く", other: "その他" },
    noteLabel: "サポートへのメモ（任意）",
    boundary: "Hey Hermes サポートには、理由、メモ、この返信への参照（IDと時刻）が送信されます。返信の本文と他のチャット内容は送信されません。",
    send: "報告を送信",
    cancel: "キャンセル",
    sent: "ありがとうございます。報告を Hey Hermes サポートに送信しました。",
    close: "閉じる",
  },
  ko: {
    action: "이 답변 신고",
    reasonLabel: "신고 사유",
    reasons: { offensive: "불쾌하거나 유해함", misleading: "틀리거나 오해의 소지가 있음", other: "기타" },
    noteLabel: "지원팀에 남길 메모(선택)",
    boundary: "Hey Hermes 지원팀에는 사유, 메모, 이 답변에 대한 참조(ID와 시간)가 전송됩니다. 답변 내용과 나머지 채팅은 전송되지 않습니다.",
    send: "신고 보내기",
    cancel: "취소",
    sent: "감사합니다. 신고가 Hey Hermes 지원팀에 전송되었습니다.",
    close: "닫기",
  },
};

export function heyReplyReportCopy(locale: AppLocale): HeyReplyReportCopy {
  return copyByLocale[locale] ?? copyByLocale.en;
}
