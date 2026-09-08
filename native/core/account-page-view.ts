import type { AppLocale, Entitlement, PromotionalGrantAccess } from "./types";

export type PersonalAccessState = "none" | "grant" | "trial" | "paid";
export type PersonalAccessTiming = "none" | "no_end" | "unknown_end" | "ends" | "trial_ends" | "renews" | "payment_retry";
export type PersonalAccessAction = "start_on_iphone" | "no_action" | "manage_subscription";

export type PersonalAccessView = Readonly<{
  state: PersonalAccessState;
  timing: PersonalAccessTiming;
  at: string | null;
  action: PersonalAccessAction;
}>;

export type AccountPageCopy = Readonly<{
  linkedAccountsTitle: string;
  linkedAccountsDetail: string;
  privacyTitle: string;
  privacyPromise: string;
  privacyDetailsTitle: string;
  privacySentence: string;
  accessHistoryTitle: string;
  access: Readonly<Record<PersonalAccessState, Readonly<{
    label: string;
    explanation: string;
  }>>>;
  paymentIssueLabel: string;
  subscriptionEndingLabel: string;
  paidGraceExplanation: string;
  paidEndingExplanation: string;
  noCurrentAccess: string;
  noEndDate: string;
  ends: (date: string) => string;
  trialEnds: (date: string) => string;
  trialEndUnavailable: string;
  renews: (date: string) => string;
  renewalUnavailable: string;
  paymentRetryUntil: (date: string) => string;
  paymentRetryInProgress: string;
  paidEnds: (date: string) => string;
  paidEndUnavailable: string;
}>;

export type PersonalAccessPresentation = PersonalAccessView & Readonly<{
  label: string;
  explanation: string;
  timingLabel: string;
}>;

function isPromotionalGrant(entitlement: Entitlement) {
  return entitlement.status === "active" &&
    entitlement.storeProductId?.toLowerCase().startsWith("rc_promo") === true;
}

/**
 * Read-only projection of existing server truth. A paid/trial entitlement
 * continues to outrank a promotional grant. The supplemental grant is needed
 * only when invite provisioning left an active manual base entitlement in
 * front of the independently stored, time-bounded grant.
 */
export function personalAccessView(
  entitlement: Entitlement | null,
  promotionalGrant: PromotionalGrantAccess | null = null,
): PersonalAccessView {
  if (!entitlement || entitlement.status === "expired") {
    return { state: "none", timing: "none", at: null, action: "start_on_iphone" };
  }
  if (entitlement.status === "trialing") {
    return {
      state: "trial",
      timing: "trial_ends",
      at: entitlement.trialEndsAt ?? entitlement.expiresAt,
      action: "manage_subscription",
    };
  }
  if (
    entitlement.status === "active" &&
    (entitlement.comped === true || isPromotionalGrant(entitlement) || entitlement.provider === "manual")
  ) {
    const grantExpiry = entitlement.provider === "manual" && entitlement.comped !== true
      ? promotionalGrant?.expiresAt ?? entitlement.expiresAt
      : entitlement.expiresAt;
    return {
      state: "grant",
      // Missing expiry is not proof of unlimited access. The current display
      // contract carries no explicit indefinite evidence, even for manual/comped.
      timing: grantExpiry ? "ends" : "unknown_end",
      at: grantExpiry,
      action: "no_action",
    };
  }
  if (["active", "grace_period", "cancelled"].includes(entitlement.status)) {
    if (entitlement.status === "grace_period") {
      return {
        state: "paid",
        timing: "payment_retry",
        at: entitlement.gracePeriodEndsAt,
        action: "manage_subscription",
      };
    }
    if (entitlement.status === "cancelled" || entitlement.cancelledAt) {
      return {
        state: "paid",
        timing: "ends",
        at: entitlement.expiresAt,
        action: "manage_subscription",
      };
    }
    return {
      state: "paid",
      timing: "renews",
      at: entitlement.renewsAt,
      action: "manage_subscription",
    };
  }
  return { state: "none", timing: "none", at: null, action: "start_on_iphone" };
}

const en: AccountPageCopy = {
  linkedAccountsTitle: "Linked accounts",
  linkedAccountsDetail: "Apple and Google are identities linked to this Hey account. Matching email addresses never link accounts.",
  privacyTitle: "Privacy",
  privacyPromise: "Your data sits on your own server and belongs to you.",
  privacyDetailsTitle: "What that means",
  privacySentence: "Hey Hermes keeps your server running — updates, restarts, backups. Your conversations, tasks, files and personal data remain private. What you grant yourself is listed below, with date, scope and duration.",
  accessHistoryTitle: "Access history",
  access: {
    none: { label: "No active plan", explanation: "You don’t currently have access to Hey Hermes Personal." },
    grant: { label: "Complimentary access", explanation: "Your complimentary access is active. You will not be charged." },
    trial: { label: "Free trial", explanation: "Your App Store free trial is active." },
    paid: { label: "Active subscription", explanation: "Your Hey Hermes Personal subscription is active." },
  },
  paymentIssueLabel: "Payment issue",
  subscriptionEndingLabel: "Subscription ending",
  paidGraceExplanation: "Your Hey Hermes Personal subscription has a payment issue.",
  paidEndingExplanation: "Your Hey Hermes Personal subscription remains active until the end date shown.",
  noCurrentAccess: "No current access.",
  noEndDate: "No expiration date.",
  ends: (date) => `Ends ${date}.`,
  trialEnds: (date) => `Trial ends ${date}.`,
  trialEndUnavailable: "The trial end date is not available.",
  renews: (date) => `Renews ${date}.`,
  renewalUnavailable: "The renewal date is not available.",
  paymentRetryUntil: (date) => `Payment retry until ${date}.`,
  paymentRetryInProgress: "Payment retry is in progress.",
  paidEnds: (date) => `Ends ${date}.`,
  paidEndUnavailable: "The end date is not available.",
};

const copyByLocale: Record<AppLocale, AccountPageCopy> = {
  en,
  de: {
    linkedAccountsTitle: "Verknüpfte Konten",
    linkedAccountsDetail: "Apple und Google sind Identitäten, die mit diesem Hey-Account verknüpft sind. Übereinstimmende E-Mail-Adressen verknüpfen keine Accounts.",
    privacyTitle: "Datenschutz",
    privacyPromise: "Deine Daten liegen auf deinem eigenen Server und gehören dir.",
    privacyDetailsTitle: "Was das bedeutet",
    privacySentence: "Hey Hermes hält deinen Server am Laufen — Updates, Neustarts, Backups. Deine Gespräche, Aufgaben, Dateien und persönlichen Daten bleiben privat. Was du selbst freigibst, ist unten mit Datum, Umfang und Dauer aufgeführt.",
    accessHistoryTitle: "Zugriffshistorie",
    access: {
      none: { label: "Kein aktiver Plan", explanation: "Du hast derzeit keinen Zugang zu Hey Hermes Personal." },
      grant: { label: "Kostenloser Zugang", explanation: "Dein kostenloser Zugang ist aktiv. Dir wird nichts berechnet." },
      trial: { label: "Kostenlose Testphase", explanation: "Deine kostenlose App-Store-Testphase ist aktiv." },
      paid: { label: "Aktives Abonnement", explanation: "Dein Hey-Hermes-Personal-Abonnement ist aktiv." },
    },
    paymentIssueLabel: "Zahlungsproblem",
    subscriptionEndingLabel: "Abonnement endet",
    paidGraceExplanation: "Bei deinem Hey-Hermes-Personal-Abonnement besteht ein Zahlungsproblem.",
    paidEndingExplanation: "Dein Hey-Hermes-Personal-Abonnement bleibt bis zum angezeigten Enddatum aktiv.",
    noCurrentAccess: "Derzeit kein Zugang.",
    noEndDate: "Kein Ablaufdatum.",
    ends: (date) => `Endet am ${date}.`,
    trialEnds: (date) => `Die Testphase endet am ${date}.`,
    trialEndUnavailable: "Das Enddatum der Testphase ist nicht verfügbar.",
    renews: (date) => `Verlängert sich am ${date}.`,
    renewalUnavailable: "Das Verlängerungsdatum ist nicht verfügbar.",
    paymentRetryUntil: (date) => `Zahlungswiederholung bis ${date}.`,
    paymentRetryInProgress: "Die Zahlungswiederholung läuft.",
    paidEnds: (date) => `Endet am ${date}.`,
    paidEndUnavailable: "Das Enddatum ist nicht verfügbar.",
  },
  fr: {
    linkedAccountsTitle: "Comptes liés",
    linkedAccountsDetail: "Apple et Google sont des identités liées à ce compte Hey. Des adresses e-mail identiques ne lient jamais les comptes.",
    privacyTitle: "Confidentialité",
    privacyPromise: "Vos données se trouvent sur votre propre serveur et vous appartiennent.",
    privacyDetailsTitle: "Ce que cela signifie",
    privacySentence: "Hey Hermes maintient votre serveur en fonctionnement — mises à jour, redémarrages, sauvegardes. Vos conversations, tâches, fichiers et données personnelles restent privés. Ce que vous accordez vous-même est indiqué ci-dessous, avec la date, la portée et la durée.",
    accessHistoryTitle: "Historique des accès",
    access: {
      none: { label: "Aucun forfait actif", explanation: "Vous n’avez actuellement pas accès à Hey Hermes Personal." },
      grant: { label: "Accès offert", explanation: "Votre accès offert est actif. Aucun montant ne vous sera facturé." },
      trial: { label: "Essai gratuit", explanation: "Votre essai gratuit sur l’App Store est actif." },
      paid: { label: "Abonnement actif", explanation: "Votre abonnement Hey Hermes Personal est actif." },
    },
    paymentIssueLabel: "Problème de paiement",
    subscriptionEndingLabel: "Fin de l’abonnement",
    paidGraceExplanation: "Votre abonnement Hey Hermes Personal présente un problème de paiement.",
    paidEndingExplanation: "Votre abonnement Hey Hermes Personal reste actif jusqu’à la date de fin indiquée.",
    noCurrentAccess: "Aucun accès actuel.",
    noEndDate: "Aucune date d’expiration.",
    ends: (date) => `Se termine le ${date}.`,
    trialEnds: (date) => `L’essai se termine le ${date}.`,
    trialEndUnavailable: "La date de fin de l’essai n’est pas disponible.",
    renews: (date) => `Se renouvelle le ${date}.`,
    renewalUnavailable: "La date de renouvellement n’est pas disponible.",
    paymentRetryUntil: (date) => `Nouvelle tentative de paiement jusqu’au ${date}.`,
    paymentRetryInProgress: "Une nouvelle tentative de paiement est en cours.",
    paidEnds: (date) => `Se termine le ${date}.`,
    paidEndUnavailable: "La date de fin n’est pas disponible.",
  },
  es: {
    linkedAccountsTitle: "Cuentas vinculadas",
    linkedAccountsDetail: "Apple y Google son identidades vinculadas a esta cuenta de Hey. Las direcciones de correo iguales nunca vinculan cuentas.",
    privacyTitle: "Privacidad",
    privacyPromise: "Tus datos están en tu propio servidor y te pertenecen.",
    privacyDetailsTitle: "Qué significa",
    privacySentence: "Hey Hermes mantiene tu servidor en funcionamiento — actualizaciones, reinicios y copias de seguridad. Tus conversaciones, tareas, archivos y datos personales siguen siendo privados. Lo que tú mismo autorizas aparece abajo con fecha, alcance y duración.",
    accessHistoryTitle: "Historial de acceso",
    access: {
      none: { label: "Sin plan activo", explanation: "Actualmente no tienes acceso a Hey Hermes Personal." },
      grant: { label: "Acceso gratuito", explanation: "Tu acceso gratuito está activo. No se te cobrará." },
      trial: { label: "Prueba gratuita", explanation: "Tu prueba gratuita del App Store está activa." },
      paid: { label: "Suscripción activa", explanation: "Tu suscripción a Hey Hermes Personal está activa." },
    },
    paymentIssueLabel: "Problema de pago",
    subscriptionEndingLabel: "La suscripción finaliza",
    paidGraceExplanation: "Tu suscripción a Hey Hermes Personal tiene un problema de pago.",
    paidEndingExplanation: "Tu suscripción a Hey Hermes Personal sigue activa hasta la fecha de finalización indicada.",
    noCurrentAccess: "Sin acceso actual.",
    noEndDate: "Sin fecha de caducidad.",
    ends: (date) => `Termina el ${date}.`,
    trialEnds: (date) => `La prueba termina el ${date}.`,
    trialEndUnavailable: "La fecha de finalización de la prueba no está disponible.",
    renews: (date) => `Se renueva el ${date}.`,
    renewalUnavailable: "La fecha de renovación no está disponible.",
    paymentRetryUntil: (date) => `Reintento de pago hasta el ${date}.`,
    paymentRetryInProgress: "Hay un reintento de pago en curso.",
    paidEnds: (date) => `Termina el ${date}.`,
    paidEndUnavailable: "La fecha de finalización no está disponible.",
  },
  it: {
    linkedAccountsTitle: "Account collegati",
    linkedAccountsDetail: "Apple e Google sono identità collegate a questo account Hey. Indirizzi e-mail uguali non collegano mai gli account.",
    privacyTitle: "Privacy",
    privacyPromise: "I tuoi dati si trovano sul tuo server e appartengono a te.",
    privacyDetailsTitle: "Cosa significa",
    privacySentence: "Hey Hermes mantiene operativo il tuo server — aggiornamenti, riavvii e backup. Le tue conversazioni, attività, file e dati personali restano privati. Ciò che autorizzi personalmente è elencato qui sotto con data, ambito e durata.",
    accessHistoryTitle: "Cronologia degli accessi",
    access: {
      none: { label: "Nessun piano attivo", explanation: "Al momento non hai accesso a Hey Hermes Personal." },
      grant: { label: "Accesso gratuito", explanation: "Il tuo accesso gratuito è attivo. Non ti verrà addebitato alcun costo." },
      trial: { label: "Prova gratuita", explanation: "La tua prova gratuita su App Store è attiva." },
      paid: { label: "Abbonamento attivo", explanation: "Il tuo abbonamento a Hey Hermes Personal è attivo." },
    },
    paymentIssueLabel: "Problema di pagamento",
    subscriptionEndingLabel: "Abbonamento in scadenza",
    paidGraceExplanation: "Il tuo abbonamento a Hey Hermes Personal presenta un problema di pagamento.",
    paidEndingExplanation: "Il tuo abbonamento a Hey Hermes Personal resta attivo fino alla data di fine indicata.",
    noCurrentAccess: "Nessun accesso attuale.",
    noEndDate: "Nessuna data di scadenza.",
    ends: (date) => `Termina il ${date}.`,
    trialEnds: (date) => `La prova termina il ${date}.`,
    trialEndUnavailable: "La data di fine della prova non è disponibile.",
    renews: (date) => `Si rinnova il ${date}.`,
    renewalUnavailable: "La data di rinnovo non è disponibile.",
    paymentRetryUntil: (date) => `Nuovo tentativo di pagamento fino al ${date}.`,
    paymentRetryInProgress: "È in corso un nuovo tentativo di pagamento.",
    paidEnds: (date) => `Termina il ${date}.`,
    paidEndUnavailable: "La data di fine non è disponibile.",
  },
  "pt-BR": {
    linkedAccountsTitle: "Contas vinculadas",
    linkedAccountsDetail: "Apple e Google são identidades vinculadas a esta conta Hey. Endereços de e-mail iguais nunca vinculam contas.",
    privacyTitle: "Privacidade",
    privacyPromise: "Seus dados ficam no seu próprio servidor e pertencem a você.",
    privacyDetailsTitle: "O que isso significa",
    privacySentence: "O Hey Hermes mantém seu servidor funcionando — atualizações, reinicializações e backups. Suas conversas, tarefas, arquivos e dados pessoais permanecem privados. O que você mesmo concede está listado abaixo, com data, escopo e duração.",
    accessHistoryTitle: "Histórico de acesso",
    access: {
      none: { label: "Nenhum plano ativo", explanation: "No momento, você não tem acesso ao Hey Hermes Personal." },
      grant: { label: "Acesso gratuito", explanation: "Seu acesso gratuito está ativo. Você não será cobrado." },
      trial: { label: "Teste grátis", explanation: "Seu teste grátis da App Store está ativo." },
      paid: { label: "Assinatura ativa", explanation: "Sua assinatura do Hey Hermes Personal está ativa." },
    },
    paymentIssueLabel: "Problema de pagamento",
    subscriptionEndingLabel: "Assinatura terminando",
    paidGraceExplanation: "Sua assinatura do Hey Hermes Personal está com um problema de pagamento.",
    paidEndingExplanation: "Sua assinatura do Hey Hermes Personal permanece ativa até a data de término exibida.",
    noCurrentAccess: "Nenhum acesso atual.",
    noEndDate: "Sem data de expiração.",
    ends: (date) => `Termina em ${date}.`,
    trialEnds: (date) => `O teste termina em ${date}.`,
    trialEndUnavailable: "A data de término do teste não está disponível.",
    renews: (date) => `Renova em ${date}.`,
    renewalUnavailable: "A data de renovação não está disponível.",
    paymentRetryUntil: (date) => `Nova tentativa de cobrança até ${date}.`,
    paymentRetryInProgress: "Uma nova tentativa de cobrança está em andamento.",
    paidEnds: (date) => `Termina em ${date}.`,
    paidEndUnavailable: "A data de término não está disponível.",
  },
  ja: {
    linkedAccountsTitle: "連携済みアカウント",
    linkedAccountsDetail: "Apple と Google は、この Hey アカウントに連携された本人確認情報です。同じメールアドレスだけでアカウントが連携されることはありません。",
    privacyTitle: "プライバシー",
    privacyPromise: "データはあなた自身のサーバーに保存され、あなたに帰属します。",
    privacyDetailsTitle: "その意味",
    privacySentence: "Hey Hermes は、アップデート、再起動、バックアップを行い、あなたのサーバーを稼働させ続けます。会話、タスク、ファイル、個人データは非公開のままです。あなた自身が許可した内容は、日付、範囲、期間とともに下に表示されます。",
    accessHistoryTitle: "アクセス履歴",
    access: {
      none: { label: "有効なプランなし", explanation: "現在 Hey Hermes Personal へのアクセスはありません。" },
      grant: { label: "無償アクセス", explanation: "無償アクセスが有効です。料金は請求されません。" },
      trial: { label: "無料体験", explanation: "App Store の無料体験が有効です。" },
      paid: { label: "有効なサブスクリプション", explanation: "Hey Hermes Personal のサブスクリプションが有効です。" },
    },
    paymentIssueLabel: "支払いの問題",
    subscriptionEndingLabel: "サブスクリプション終了予定",
    paidGraceExplanation: "Hey Hermes Personal のサブスクリプションに支払いの問題があります。",
    paidEndingExplanation: "Hey Hermes Personal のサブスクリプションは表示された終了日まで有効です。",
    noCurrentAccess: "現在アクセスはありません。",
    noEndDate: "有効期限はありません。",
    ends: (date) => `${date} に終了します。`,
    trialEnds: (date) => `無料体験は ${date} に終了します。`,
    trialEndUnavailable: "無料体験の終了日は確認できません。",
    renews: (date) => `${date} に更新されます。`,
    renewalUnavailable: "更新日は確認できません。",
    paymentRetryUntil: (date) => `${date} まで支払いを再試行します。`,
    paymentRetryInProgress: "支払いの再試行中です。",
    paidEnds: (date) => `${date} に終了します。`,
    paidEndUnavailable: "終了日は確認できません。",
  },
  ko: {
    linkedAccountsTitle: "연결된 계정",
    linkedAccountsDetail: "Apple과 Google은 이 Hey 계정에 연결된 신원 정보입니다. 이메일 주소가 같다는 이유만으로 계정이 연결되지는 않습니다.",
    privacyTitle: "개인정보 보호",
    privacyPromise: "데이터는 본인의 서버에 저장되며 본인에게 속합니다.",
    privacyDetailsTitle: "이 의미",
    privacySentence: "Hey Hermes는 업데이트, 재시작, 백업을 수행하며 서버가 계속 작동하도록 관리합니다. 대화, 작업, 파일 및 개인 데이터는 비공개로 유지됩니다. 직접 부여한 권한은 날짜, 범위, 기간과 함께 아래에 표시됩니다.",
    accessHistoryTitle: "접근 기록",
    access: {
      none: { label: "활성 플랜 없음", explanation: "현재 Hey Hermes Personal을 이용할 수 없습니다." },
      grant: { label: "무료 제공 액세스", explanation: "무료 제공 액세스가 활성화되어 있습니다. 요금은 청구되지 않습니다." },
      trial: { label: "무료 체험", explanation: "App Store 무료 체험이 활성화되어 있습니다." },
      paid: { label: "활성 구독", explanation: "Hey Hermes Personal 구독이 활성화되어 있습니다." },
    },
    paymentIssueLabel: "결제 문제",
    subscriptionEndingLabel: "구독 종료 예정",
    paidGraceExplanation: "Hey Hermes Personal 구독에 결제 문제가 있습니다.",
    paidEndingExplanation: "Hey Hermes Personal 구독은 표시된 종료일까지 활성 상태입니다.",
    noCurrentAccess: "현재 액세스 없음.",
    noEndDate: "만료일 없음.",
    ends: (date) => `${date}에 종료됩니다.`,
    trialEnds: (date) => `무료 체험은 ${date}에 종료됩니다.`,
    trialEndUnavailable: "무료 체험 종료일을 확인할 수 없습니다.",
    renews: (date) => `${date}에 갱신됩니다.`,
    renewalUnavailable: "갱신일을 확인할 수 없습니다.",
    paymentRetryUntil: (date) => `${date}까지 결제를 다시 시도합니다.`,
    paymentRetryInProgress: "결제를 다시 시도하고 있습니다.",
    paidEnds: (date) => `${date}에 종료됩니다.`,
    paidEndUnavailable: "종료일을 확인할 수 없습니다.",
  },
};

export function accountPageCopy(locale: AppLocale): AccountPageCopy {
  return copyByLocale[locale] ?? en;
}

function timingLabel(view: PersonalAccessView, copy: AccountPageCopy, formatDate: (value: string) => string) {
  if (view.timing === "none") return copy.noCurrentAccess;
  if (view.timing === "no_end") return copy.noEndDate;
  if (view.timing === "unknown_end") return copy.paidEndUnavailable;
  if (view.timing === "trial_ends") return view.at ? copy.trialEnds(formatDate(view.at)) : copy.trialEndUnavailable;
  if (view.timing === "renews") return view.at ? copy.renews(formatDate(view.at)) : copy.renewalUnavailable;
  if (view.timing === "payment_retry") return view.at ? copy.paymentRetryUntil(formatDate(view.at)) : copy.paymentRetryInProgress;
  if (view.state === "paid") return view.at ? copy.paidEnds(formatDate(view.at)) : copy.paidEndUnavailable;
  return view.at ? copy.ends(formatDate(view.at)) : copy.noEndDate;
}

export function personalAccessPresentation(
  entitlement: Entitlement | null,
  locale: AppLocale,
  formatDate: (value: string) => string = (value) => new Date(value).toLocaleDateString(locale),
  promotionalGrant: PromotionalGrantAccess | null = null,
): PersonalAccessPresentation {
  const view = personalAccessView(entitlement, promotionalGrant);
  const copy = accountPageCopy(locale);
  const stateCopy = copy.access[view.state];
  const label = view.state === "paid" && view.timing === "payment_retry"
    ? copy.paymentIssueLabel
    : view.state === "paid" && view.timing === "ends"
      ? copy.subscriptionEndingLabel
      : stateCopy.label;
  const explanation = view.state === "paid" && view.timing === "payment_retry"
    ? copy.paidGraceExplanation
    : view.state === "paid" && view.timing === "ends"
      ? copy.paidEndingExplanation
      : stateCopy.explanation;
  return {
    ...view,
    label,
    explanation,
    timingLabel: timingLabel(view, copy, formatDate),
  };
}
