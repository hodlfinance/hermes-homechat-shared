import type { AppLocale } from "../core/index";

/**
 * Copy for the chat's approval and clarification cards, plus screen-reader
 * labels in the chat surface that used to be fixed English. Typed as a
 * complete Record so every locale must carry every key.
 */
export type MobileChatCardCopy = Readonly<{
  clarifyTitle: string;
  clarifyExpired: string;
  clarifySending: string;
  clarifyChoices: string;
  otherAnswer: string;
  sendAnswer: string;
  confirmationChoices: string;
  approvalTarget: string;
  approvalAction: string;
  approvalPermission: string;
  approvalDataLeaving: string;
  approvalCredentials: string;
  approvalExpired: string;
  approvalExpires: string;
  /** `{value}` is the exact word the user must type. */
  approvalTypeToApprove: string;
  table: string;
  suggestions: string;
}>;

const chatCardCopyByLocale: Record<AppLocale, MobileChatCardCopy> = {
  en: {
    clarifyTitle: "Hermes needs one detail",
    clarifyExpired: "This question has expired. Type your answer in the message field instead.",
    clarifySending: "Sending your answer…",
    clarifyChoices: "Clarification choices",
    otherAnswer: "Other answer",
    sendAnswer: "Send answer",
    confirmationChoices: "Confirmation choices",
    approvalTarget: "Target",
    approvalAction: "Action",
    approvalPermission: "Permission",
    approvalDataLeaving: "Data leaving workspace",
    approvalCredentials: "Credentials",
    approvalExpired: "This approval has expired.",
    approvalExpires: "Expires",
    approvalTypeToApprove: "Type {value} to approve",
    table: "Table",
    suggestions: "Suggestions",
  },
  de: {
    clarifyTitle: "Hermes braucht noch eine Angabe",
    clarifyExpired: "Diese Frage ist abgelaufen. Schreib Deine Antwort stattdessen ins Nachrichtenfeld.",
    clarifySending: "Deine Antwort wird gesendet…",
    clarifyChoices: "Antwortmöglichkeiten",
    otherAnswer: "Andere Antwort",
    sendAnswer: "Antwort senden",
    confirmationChoices: "Bestätigungsoptionen",
    approvalTarget: "Ziel",
    approvalAction: "Aktion",
    approvalPermission: "Berechtigung",
    approvalDataLeaving: "Daten, die den Workspace verlassen",
    approvalCredentials: "Zugangsdaten",
    approvalExpired: "Diese Freigabe ist abgelaufen.",
    approvalExpires: "Läuft ab",
    approvalTypeToApprove: "Zum Freigeben {value} eingeben",
    table: "Tabelle",
    suggestions: "Vorschläge",
  },
  fr: {
    clarifyTitle: "Hermes a besoin d’une précision",
    clarifyExpired: "Cette question a expiré. Saisissez plutôt votre réponse dans le champ de message.",
    clarifySending: "Envoi de votre réponse…",
    clarifyChoices: "Choix de réponse",
    otherAnswer: "Autre réponse",
    sendAnswer: "Envoyer la réponse",
    confirmationChoices: "Choix de confirmation",
    approvalTarget: "Cible",
    approvalAction: "Action",
    approvalPermission: "Autorisation",
    approvalDataLeaving: "Données qui quittent l’espace de travail",
    approvalCredentials: "Identifiants",
    approvalExpired: "Cette approbation a expiré.",
    approvalExpires: "Expire",
    approvalTypeToApprove: "Saisissez {value} pour approuver",
    table: "Tableau",
    suggestions: "Suggestions",
  },
  es: {
    clarifyTitle: "Hermes necesita un dato más",
    clarifyExpired: "Esta pregunta ha caducado. Escribe tu respuesta en el campo de mensaje.",
    clarifySending: "Enviando tu respuesta…",
    clarifyChoices: "Opciones de respuesta",
    otherAnswer: "Otra respuesta",
    sendAnswer: "Enviar respuesta",
    confirmationChoices: "Opciones de confirmación",
    approvalTarget: "Destino",
    approvalAction: "Acción",
    approvalPermission: "Permiso",
    approvalDataLeaving: "Datos que salen del espacio de trabajo",
    approvalCredentials: "Credenciales",
    approvalExpired: "Esta aprobación ha caducado.",
    approvalExpires: "Caduca",
    approvalTypeToApprove: "Escribe {value} para aprobar",
    table: "Tabla",
    suggestions: "Sugerencias",
  },
  it: {
    clarifyTitle: "Hermes ha bisogno di un dettaglio",
    clarifyExpired: "Questa domanda è scaduta. Scrivi invece la tua risposta nel campo del messaggio.",
    clarifySending: "Invio della risposta…",
    clarifyChoices: "Opzioni di risposta",
    otherAnswer: "Altra risposta",
    sendAnswer: "Invia risposta",
    confirmationChoices: "Opzioni di conferma",
    approvalTarget: "Destinazione",
    approvalAction: "Azione",
    approvalPermission: "Autorizzazione",
    approvalDataLeaving: "Dati che escono dallo spazio di lavoro",
    approvalCredentials: "Credenziali",
    approvalExpired: "Questa approvazione è scaduta.",
    approvalExpires: "Scade",
    approvalTypeToApprove: "Digita {value} per approvare",
    table: "Tabella",
    suggestions: "Suggerimenti",
  },
  "pt-BR": {
    clarifyTitle: "O Hermes precisa de mais um detalhe",
    clarifyExpired: "Esta pergunta expirou. Digite sua resposta no campo de mensagem.",
    clarifySending: "Enviando sua resposta…",
    clarifyChoices: "Opções de resposta",
    otherAnswer: "Outra resposta",
    sendAnswer: "Enviar resposta",
    confirmationChoices: "Opções de confirmação",
    approvalTarget: "Destino",
    approvalAction: "Ação",
    approvalPermission: "Permissão",
    approvalDataLeaving: "Dados que saem do espaço de trabalho",
    approvalCredentials: "Credenciais",
    approvalExpired: "Esta aprovação expirou.",
    approvalExpires: "Expira",
    approvalTypeToApprove: "Digite {value} para aprovar",
    table: "Tabela",
    suggestions: "Sugestões",
  },
  ja: {
    clarifyTitle: "Hermes から確認したいことが 1 つあります",
    clarifyExpired: "この質問は期限切れです。代わりにメッセージ欄に回答を入力してください。",
    clarifySending: "回答を送信中…",
    clarifyChoices: "回答の選択肢",
    otherAnswer: "その他の回答",
    sendAnswer: "回答を送信",
    confirmationChoices: "確認の選択肢",
    approvalTarget: "対象",
    approvalAction: "操作",
    approvalPermission: "権限",
    approvalDataLeaving: "ワークスペース外に送信されるデータ",
    approvalCredentials: "認証情報",
    approvalExpired: "この承認は期限切れです。",
    approvalExpires: "有効期限",
    approvalTypeToApprove: "承認するには {value} と入力してください",
    table: "表",
    suggestions: "提案",
  },
  ko: {
    clarifyTitle: "Hermes가 한 가지를 확인하려고 합니다",
    clarifyExpired: "이 질문은 만료되었습니다. 대신 메시지 입력란에 답변을 입력하세요.",
    clarifySending: "답변을 보내는 중…",
    clarifyChoices: "답변 선택지",
    otherAnswer: "다른 답변",
    sendAnswer: "답변 보내기",
    confirmationChoices: "확인 선택지",
    approvalTarget: "대상",
    approvalAction: "작업",
    approvalPermission: "권한",
    approvalDataLeaving: "워크스페이스 밖으로 나가는 데이터",
    approvalCredentials: "인증 정보",
    approvalExpired: "이 승인은 만료되었습니다.",
    approvalExpires: "만료",
    approvalTypeToApprove: "승인하려면 {value}을(를) 입력하세요",
    table: "표",
    suggestions: "제안",
  },
};

export function mobileChatCardCopy(locale: AppLocale): MobileChatCardCopy {
  return chatCardCopyByLocale[locale] ?? chatCardCopyByLocale.en;
}
