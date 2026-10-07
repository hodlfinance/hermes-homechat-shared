import { HEY_LEGAL_LINKS } from "../core/index";
import type { AppLocale, EntitlementStatus, WorkspaceRuntimeAccess } from "../core/index";
import type { MobilePurchasePlan } from "./revenuecat-purchases";
import { hasValidMobileProductAccess } from "./mobile-product-access";
import type { HeyHermesSalesStatus } from "../core/hermes-api";

export const IOS_APP_STORE_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";

// SH-TRUST remains a publish gate. The approved copy is source-complete below,
// but cannot become visible until a later, evidence-bound source change flips it.
export const IOS_PAYWALL_TRUST_CLAIMS_PUBLISHABLE = false;

export const IOS_PAYWALL_POLICY = {
  ageMinimum: 16,
  allowedPackageIds: ["personal_monthly"],
  allowedProductIds: ["app.heyhermes.personal.monthly.v3"],
  billingPeriod: "P1M",
  publicPlan: "personal",
} as const;

export type IosPaywallCopy = {
  heroTitle: string;
  heroBody: string;
  planName: string;
  monthlyAccess: string;
  monthlyFallbackPrice: string;
  purchase: string;
  loadingPrice: string;
  unavailablePrice: string;
  restore: string;
  restoring: string;
  /** HPD-1043: RevenueCat refused because the receipt is bound to another Hey account. */
  receiptInUse: string;
  manage: string;
  eligibleTrial: string;
  ineligibleTrial: string;
  unavailableTrial: string;
  unknownTrial: string;
  renewal: string;
  age: string;
  accountBoundary: string;
  complimentaryOverlap: string;
  manageError: string;
  privacy: string;
  terms: string;
  // Plan pill. Driven by the entitlement the account actually holds, never by
  // the plan slug: the slug says "trial" for accounts that have no trial.
  planActive: string;
  planTrialing: string;
  planGrace: string;
  planCancelled: string;
  planComplimentary: string;
  planNone: string;
  trust: readonly string[];
};

const en: IosPaywallCopy = {
  heroTitle: "Give it a direction. It sets the goals and runs.",
  heroBody: "Hey Hermes turns your intent into work across your private workspace.",
  planName: "Hey Hermes Personal",
  monthlyAccess: "One monthly iPhone subscription. No annual plan.",
  monthlyFallbackPrice: "USD 29/month",
  purchase: "Continue for {price}/month",
  loadingPrice: "Checking the App Store price...",
  unavailablePrice: "The App Store price is unavailable right now.",
  restore: "Restore Purchases",
  restoring: "Restoring...",
  receiptInUse: "This Apple ID's subscription already belongs to another Hey account. Sign in with the Hey account that bought it, or contact Hey Support.",
  manage: "Manage Subscription",
  eligibleTrial: "Apple confirms you are eligible: 7 days free, then {price}/month.",
  ineligibleTrial: "No trial applies. Billing starts immediately at {price}/month.",
  unavailableTrial: "No trial is available. Billing starts immediately at {price}/month.",
  unknownTrial: "Apple will confirm eligibility in the purchase sheet. If eligible, 7 days are free; otherwise billing starts immediately.",
  renewal: "The subscription renews monthly at Apple's displayed price until cancelled in App Store settings.",
  age: "For ages 16 and over. Guardian consent is required where local law says so.",
  accountBoundary: "Purchase and Restore stay tied to this signed-in Hey account.",
  complimentaryOverlap: "Complimentary access is separate. Starting an Apple trial or subscription can overlap with it; time does not stack.",
  manageError: "App Store subscription management could not be opened.",
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  planActive: "Personal",
  planTrialing: "Trial",
  planGrace: "Payment retry",
  planCancelled: "Ends at period end",
  planComplimentary: "Complimentary",
  planNone: "No active plan",
  trust: ["Private runtime", "You hold the keys", "Hosted in Europe", "Never used for training"],
};

const copyByLocale: Record<AppLocale, IosPaywallCopy> = {
  en,
  de: {
    heroTitle: "Gib eine Richtung vor. Er setzt die Ziele und legt los.",
    heroBody: "Hey Hermes verwandelt deine Absicht in Arbeit in deinem privaten Workspace.",
    planName: "Hey Hermes Personal",
    monthlyAccess: "Ein monatliches iPhone-Abo. Kein Jahresabo.",
    monthlyFallbackPrice: "USD 29/Monat",
    purchase: "Weiter für {price}/Monat",
    loadingPrice: "App-Store-Preis wird geprüft...",
    unavailablePrice: "Der App-Store-Preis ist derzeit nicht verfügbar.",
    restore: "Käufe wiederherstellen",
    restoring: "Wiederherstellung...",
    receiptInUse: "Das Abo dieser Apple-ID gehört bereits zu einem anderen Hey-Konto. Melde dich mit dem Hey-Konto an, mit dem es gekauft wurde, oder wende dich an den Hey-Support.",
    manage: "Abo verwalten",
    eligibleTrial: "Apple bestätigt deine Berechtigung: 7 Tage kostenlos, danach {price}/Monat.",
    ineligibleTrial: "Es gilt keine Testphase. Die Abrechnung beginnt sofort mit {price}/Monat.",
    unavailableTrial: "Es ist keine Testphase verfügbar. Die Abrechnung beginnt sofort mit {price}/Monat.",
    unknownTrial: "Apple bestätigt die Berechtigung im Kaufdialog. Bei Berechtigung sind 7 Tage kostenlos, sonst beginnt die Abrechnung sofort.",
    renewal: "Das Abo verlängert sich monatlich zum von Apple angezeigten Preis, bis du es in den App-Store-Einstellungen kündigst.",
    age: "Ab 16 Jahren. Wo gesetzlich vorgeschrieben, ist die Zustimmung einer erziehungsberechtigten Person erforderlich.",
    accountBoundary: "Kauf und Wiederherstellung bleiben an diesen angemeldeten Hey-Account gebunden.",
    complimentaryOverlap: "Kostenloser Zugang ist getrennt. Eine Apple-Testphase oder ein Abo kann sich damit überschneiden; Zeit wird nicht addiert.",
    manageError: "Die App-Store-Abonnementverwaltung konnte nicht geöffnet werden.",
    privacy: "Datenschutzerklärung",
    terms: "Nutzungsbedingungen",
    planActive: "Personal",
    planTrialing: "Testphase",
    planGrace: "Zahlung wird wiederholt",
    planCancelled: "Endet zum Laufzeitende",
    planComplimentary: "Kostenlos freigeschaltet",
    planNone: "Kein aktiver Plan",
    trust: ["Private Laufzeit", "Du hältst die Schlüssel", "In Europa gehostet", "Nie zum Training genutzt"],
  },
  fr: {
    heroTitle: "Donne-lui une direction. Il fixe les objectifs et avance.",
    heroBody: "Hey Hermes transforme ton intention en travail dans ton espace privé.",
    planName: "Hey Hermes Personal",
    monthlyAccess: "Un seul abonnement iPhone mensuel. Aucun forfait annuel.",
    monthlyFallbackPrice: "29 USD/mois",
    purchase: "Continuer pour {price}/mois",
    loadingPrice: "Vérification du prix App Store...",
    unavailablePrice: "Le prix App Store est indisponible pour le moment.",
    restore: "Restaurer les achats",
    restoring: "Restauration...",
    receiptInUse: "L'abonnement de cet identifiant Apple appartient déjà à un autre compte Hey. Connecte-toi avec le compte Hey qui l'a acheté, ou contacte le support Hey.",
    manage: "Gérer l'abonnement",
    eligibleTrial: "Apple confirme ton éligibilité : 7 jours gratuits, puis {price}/mois.",
    ineligibleTrial: "Aucun essai ne s'applique. La facturation commence immédiatement à {price}/mois.",
    unavailableTrial: "Aucun essai n'est disponible. La facturation commence immédiatement à {price}/mois.",
    unknownTrial: "Apple confirmera l'éligibilité dans la feuille d'achat. Si tu es éligible, 7 jours sont gratuits ; sinon la facturation commence immédiatement.",
    renewal: "L'abonnement se renouvelle chaque mois au prix affiché par Apple jusqu’à son annulation dans les réglages App Store.",
    age: "Réservé aux personnes de 16 ans et plus. Le consentement d'un responsable légal est requis lorsque la loi locale l'impose.",
    accountBoundary: "L'achat et la restauration restent liés à ce compte Hey connecté.",
    complimentaryOverlap: "L’accès offert est distinct. Un essai ou abonnement Apple peut le chevaucher ; les durées ne s'additionnent pas.",
    manageError: "La gestion des abonnements App Store n'a pas pu être ouverte.",
    privacy: "Politique de confidentialité",
    terms: "Conditions d'utilisation",
    planActive: "Personal",
    planTrialing: "Essai",
    planGrace: "Nouvelle tentative de paiement",
    planCancelled: "Se termine à la fin de la période",
    planComplimentary: "Accès offert",
    planNone: "Aucun forfait actif",
    trust: ["Exécution privée", "Tu détiens les clés", "Hébergé en Europe", "Jamais utilisé pour l'entraînement"],
  },
  es: {
    heroTitle: "Dale una dirección. Fija los objetivos y se pone en marcha.",
    heroBody: "Hey Hermes convierte tu intención en trabajo dentro de tu espacio privado.",
    planName: "Hey Hermes Personal",
    monthlyAccess: "Una única suscripción mensual para iPhone. Sin plan anual.",
    monthlyFallbackPrice: "29 USD/mes",
    purchase: "Continuar por {price}/mes",
    loadingPrice: "Consultando el precio del App Store...",
    unavailablePrice: "El precio del App Store no está disponible ahora mismo.",
    restore: "Restaurar compras",
    restoring: "Restaurando...",
    receiptInUse: "La suscripción de este Apple ID ya pertenece a otra cuenta de Hey. Inicia sesión con la cuenta de Hey que la compró o contacta con el soporte de Hey.",
    manage: "Gestionar suscripción",
    eligibleTrial: "Apple confirma que cumples los requisitos: 7 días gratis y después {price}/mes.",
    ineligibleTrial: "No se aplica ninguna prueba. La facturación comienza de inmediato a {price}/mes.",
    unavailableTrial: "No hay prueba disponible. La facturación comienza de inmediato a {price}/mes.",
    unknownTrial: "Apple confirmará los requisitos en la hoja de compra. Si cumples, tendrás 7 días gratis; si no, la facturación comienza de inmediato.",
    renewal: "La suscripción se renueva cada mes al precio mostrado por Apple hasta que la canceles en los ajustes del App Store.",
    age: "Para mayores de 16 años. Se requiere consentimiento del tutor cuando la ley local lo exija.",
    accountBoundary: "La compra y la restauración quedan vinculadas a esta cuenta de Hey.",
    complimentaryOverlap: "El acceso gratuito es independiente. Una prueba o suscripción de Apple puede solaparse; el tiempo no se acumula.",
    manageError: "No se pudo abrir la gestión de suscripciones del App Store.",
    privacy: "Política de privacidad",
    terms: "Términos del servicio",
    planActive: "Personal",
    planTrialing: "Prueba",
    planGrace: "Reintento de pago",
    planCancelled: "Termina al final del periodo",
    planComplimentary: "Acceso gratuito",
    planNone: "Sin plan activo",
    trust: ["Entorno privado", "Tú tienes las llaves", "Alojado en Europa", "Nunca usado para entrenar"],
  },
  it: {
    heroTitle: "Dagli una direzione. Fissa gli obiettivi e parte.",
    heroBody: "Hey Hermes trasforma il tuo intento in lavoro nel tuo spazio privato.",
    planName: "Hey Hermes Personal",
    monthlyAccess: "Un solo abbonamento mensile per iPhone. Nessun piano annuale.",
    monthlyFallbackPrice: "29 USD/mese",
    purchase: "Continua a {price}/mese",
    loadingPrice: "Verifica del prezzo App Store...",
    unavailablePrice: "Il prezzo App Store non è disponibile in questo momento.",
    restore: "Ripristina acquisti",
    restoring: "Ripristino...",
    receiptInUse: "L'abbonamento di questo ID Apple appartiene già a un altro account Hey. Accedi con l'account Hey che l'ha acquistato oppure contatta l'assistenza Hey.",
    manage: "Gestisci abbonamento",
    eligibleTrial: "Apple conferma la tua idoneità: 7 giorni gratis, poi {price}/mese.",
    ineligibleTrial: "Non si applica alcuna prova. La fatturazione inizia subito a {price}/mese.",
    unavailableTrial: "Non è disponibile alcuna prova. La fatturazione inizia subito a {price}/mese.",
    unknownTrial: "Apple confermerà l'idoneità nella schermata di acquisto. Se idoneo, avrai 7 giorni gratis; altrimenti la fatturazione inizia subito.",
    renewal: "L'abbonamento si rinnova ogni mese al prezzo mostrato da Apple finché non lo annulli nelle impostazioni App Store.",
    age: "Per utenti dai 16 anni in su. Serve il consenso di un tutore quando richiesto dalla legge locale.",
    accountBoundary: "Acquisto e ripristino restano legati a questo account Hey.",
    complimentaryOverlap: "L'accesso gratuito è separato. Una prova o un abbonamento Apple può sovrapporsi; il tempo non si somma.",
    manageError: "Impossibile aprire la gestione degli abbonamenti App Store.",
    privacy: "Informativa sulla privacy",
    terms: "Termini di servizio",
    planActive: "Personal",
    planTrialing: "Prova",
    planGrace: "Nuovo tentativo di pagamento",
    planCancelled: "Termina a fine periodo",
    planComplimentary: "Accesso gratuito",
    planNone: "Nessun piano attivo",
    trust: ["Runtime privato", "Le chiavi le tieni tu", "Ospitato in Europa", "Mai usato per l'addestramento"],
  },
  "pt-BR": {
    heroTitle: "Dê uma direção. Ele define as metas e executa.",
    heroBody: "Hey Hermes transforma sua intenção em trabalho no seu espaço privado.",
    planName: "Hey Hermes Personal",
    monthlyAccess: "Uma única assinatura mensal para iPhone. Sem plano anual.",
    monthlyFallbackPrice: "US$ 29/mês",
    purchase: "Continuar por {price}/mês",
    loadingPrice: "Consultando o preço da App Store...",
    unavailablePrice: "O preço da App Store está indisponível no momento.",
    restore: "Restaurar compras",
    restoring: "Restaurando...",
    receiptInUse: "A assinatura deste ID Apple já pertence a outra conta Hey. Entre com a conta Hey que fez a compra ou fale com o suporte do Hey.",
    manage: "Gerenciar assinatura",
    eligibleTrial: "A Apple confirma sua elegibilidade: 7 dias grátis, depois {price}/mês.",
    ineligibleTrial: "Nenhum teste se aplica. A cobrança começa imediatamente em {price}/mês.",
    unavailableTrial: "Nenhum teste está disponível. A cobrança começa imediatamente em {price}/mês.",
    unknownTrial: "A Apple confirmará a elegibilidade na tela de compra. Se elegível, são 7 dias grátis; caso contrário, a cobrança começa imediatamente.",
    renewal: "A assinatura é renovada mensalmente pelo preço exibido pela Apple até ser cancelada nos ajustes da App Store.",
    age: "Para maiores de 16 anos. O consentimento de um responsável é exigido quando a lei local determinar.",
    accountBoundary: "A compra e a restauração ficam vinculadas a esta conta Hey.",
    complimentaryOverlap: "O acesso gratuito é separado. Um teste ou assinatura da Apple pode se sobrepor; o tempo não é acumulado.",
    manageError: "Não foi possível abrir o gerenciamento de assinaturas da App Store.",
    privacy: "Política de privacidade",
    terms: "Termos de serviço",
    planActive: "Personal",
    planTrialing: "Teste",
    planGrace: "Nova tentativa de cobrança",
    planCancelled: "Termina no fim do período",
    planComplimentary: "Acesso gratuito",
    planNone: "Sem plano ativo",
    trust: ["Runtime privado", "Você tem as chaves", "Hospedado na Europa", "Nunca usado em treinamento"],
  },
  ja: {
    heroTitle: "方向を示すだけ。あとは目標を決めて動きます。",
    heroBody: "Hey Hermes があなたの意図を、プライベートなワークスペースでの作業に変えます。",
    planName: "Hey Hermes Personal",
    monthlyAccess: "iPhone向けの月額プランは1つだけです。年額プランはありません。",
    monthlyFallbackPrice: "月額29米ドル",
    purchase: "月額{price}で続ける",
    loadingPrice: "App Storeの価格を確認中...",
    unavailablePrice: "App Storeの価格を現在取得できません。",
    restore: "購入を復元",
    restoring: "復元中...",
    receiptInUse: "このApple IDのサブスクリプションは、すでに別のHeyアカウントに紐づいています。購入したHeyアカウントでサインインするか、Heyサポートにお問い合わせください。",
    manage: "サブスクリプションを管理",
    eligibleTrial: "Appleが対象であることを確認しました。7日間無料、その後は月額{price}です。",
    ineligibleTrial: "無料体験は適用されません。月額{price}の請求がすぐに始まります。",
    unavailableTrial: "無料体験はありません。月額{price}の請求がすぐに始まります。",
    unknownTrial: "購入画面でAppleが対象かどうかを確認します。対象なら7日間無料、対象外なら請求がすぐに始まります。",
    renewal: "App Storeの設定で解約するまで、Appleが表示する価格で毎月自動更新されます。",
    age: "16歳以上が対象です。現地法で必要な場合は保護者の同意が必要です。",
    accountBoundary: "購入と復元は、現在サインインしているHeyアカウントにのみ紐づきます。",
    complimentaryOverlap: "無償アクセスは別枠です。Appleの無料体験やサブスクリプションと重なる場合があり、期間は合算されません。",
    manageError: "App Storeのサブスクリプション管理を開けませんでした。",
    privacy: "プライバシーポリシー",
    terms: "利用規約",
    planActive: "Personal",
    planTrialing: "無料体験中",
    planGrace: "支払い再試行中",
    planCancelled: "期間終了で停止",
    planComplimentary: "無償アクセス",
    planNone: "有効なプランなし",
    trust: ["プライベートな実行環境", "鍵を握るのはあなた", "ヨーロッパでホスティング", "学習に使われない"],
  },
  ko: {
    heroTitle: "방향만 알려주세요. 목표를 세우고 실행합니다.",
    heroBody: "Hey Hermes가 당신의 의도를 비공개 워크스페이스의 작업으로 바꿉니다.",
    planName: "Hey Hermes Personal",
    monthlyAccess: "iPhone 월간 구독은 하나뿐입니다. 연간 요금제는 없습니다.",
    monthlyFallbackPrice: "월 USD 29",
    purchase: "월 {price}에 계속",
    loadingPrice: "App Store 가격 확인 중...",
    unavailablePrice: "지금은 App Store 가격을 가져올 수 없습니다.",
    restore: "구매 복원",
    restoring: "복원 중...",
    receiptInUse: "이 Apple ID의 구독은 이미 다른 Hey 계정에 연결되어 있습니다. 구독을 구매한 Hey 계정으로 로그인하거나 Hey 지원팀에 문의하세요.",
    manage: "구독 관리",
    eligibleTrial: "Apple이 대상임을 확인했습니다. 7일 무료 후 월 {price}입니다.",
    ineligibleTrial: "무료 체험이 적용되지 않습니다. 월 {price} 결제가 즉시 시작됩니다.",
    unavailableTrial: "무료 체험이 없습니다. 월 {price} 결제가 즉시 시작됩니다.",
    unknownTrial: "구매 화면에서 Apple이 대상 여부를 확인합니다. 대상이면 7일 무료이며, 아니면 결제가 즉시 시작됩니다.",
    renewal: "App Store 설정에서 취소할 때까지 Apple에 표시된 가격으로 매월 자동 갱신됩니다.",
    age: "만 16세 이상만 이용할 수 있습니다. 현지 법률상 필요한 경우 보호자 동의가 필요합니다.",
    accountBoundary: "구매와 복원은 현재 로그인한 Hey 계정에만 연결됩니다.",
    complimentaryOverlap: "무료 제공 액세스는 별도입니다. Apple 체험이나 구독과 겹칠 수 있으며 기간은 합산되지 않습니다.",
    manageError: "App Store 구독 관리를 열 수 없습니다.",
    privacy: "개인정보 처리방침",
    terms: "서비스 이용약관",
    planActive: "Personal",
    planTrialing: "무료 체험",
    planGrace: "결제 재시도",
    planCancelled: "기간 종료 시 해지",
    planComplimentary: "무료 제공",
    planNone: "활성 플랜 없음",
    trust: ["비공개 런타임", "열쇠는 당신이", "유럽 호스팅", "학습에 사용 안 함"],
  },
};

/**
 * HPD-1085: the purchase screen's offer, shared by iOS and the web. The trial
 * headline and button appear only when the store confirms eligibility; the
 * benefits come from the landing page. `titleAccent` is a substring of its
 * title that the screen paints in the brand blue.
 */
export type HeyPaywallOfferCopy = {
  eyebrow: string;
  trialTitle: string;
  trialTitleAccent: string;
  planTitle: string;
  planTitleAccent: string;
  benefits: readonly (readonly [lead: string, rest: string])[];
  trialCta: string;
  subscribeCta: string;
  trialThen: string;
  subscribeThen: string;
  /** Apple 3.1.2: price, period, auto-renewal and trial terms next to the button. */
  trialTerms: string;
  subscribeTerms: string;
};

const offerCopyByLocale: Record<AppLocale, HeyPaywallOfferCopy> = {
  en: {
    eyebrow: "Hey Hermes Personal",
    trialTitle: "Try Hey Hermes free for 7 days",
    trialTitleAccent: "free for 7 days",
    planTitle: "An AI that works for you. And belongs to you.",
    planTitleAccent: "And belongs to you.",
    benefits: [
      ["Your own private server.", " You hold the keys."],
      ["Chat and voice,", " on iPhone and the web."],
      ["Automations", " that run while you are away."],
      ["A memory", " that gets better every day."],
    ],
    trialCta: "Start your free week",
    subscribeCta: "Subscribe for {price}/month",
    trialThen: "then {price} per month · cancel anytime",
    subscribeThen: "Monthly · cancel anytime",
    trialTerms: "7 days free, then {price}/month. Renews automatically each month until you cancel in your App Store settings at least 24 hours before the period ends.",
    subscribeTerms: "{price}/month. Renews automatically each month until you cancel in your App Store settings at least 24 hours before the period ends.",
  },
  de: {
    eyebrow: "Hey Hermes Personal",
    trialTitle: "Teste Hey Hermes 7 Tage gratis",
    trialTitleAccent: "7 Tage gratis",
    planTitle: "Eine KI, die für dich arbeitet. Und dir gehört.",
    planTitleAccent: "Und dir gehört.",
    benefits: [
      ["Dein eigener privater Server.", " Die Schlüssel liegen bei dir."],
      ["Chat und Sprache,", " auf dem iPhone und im Web."],
      ["Automationen,", " die laufen, während du weg bist."],
      ["Ein Gedächtnis,", " das jeden Tag besser wird."],
    ],
    trialCta: "Gratiswoche starten",
    subscribeCta: "Abonnieren für {price}/Monat",
    trialThen: "danach {price} pro Monat · jederzeit kündbar",
    subscribeThen: "Monatlich · jederzeit kündbar",
    trialTerms: "7 Tage gratis, danach {price}/Monat. Verlängert sich automatisch jeden Monat, bis du spätestens 24 Stunden vor Ablauf in den App-Store-Einstellungen kündigst.",
    subscribeTerms: "{price}/Monat. Verlängert sich automatisch jeden Monat, bis du spätestens 24 Stunden vor Ablauf in den App-Store-Einstellungen kündigst.",
  },
  fr: {
    eyebrow: "Hey Hermes Personal",
    trialTitle: "Essaie Hey Hermes gratuitement pendant 7 jours",
    trialTitleAccent: "gratuitement pendant 7 jours",
    planTitle: "Une IA qui travaille pour toi. Et qui t’appartient.",
    planTitleAccent: "Et qui t’appartient.",
    benefits: [
      ["Ton propre serveur privé.", " C’est toi qui as les clés."],
      ["Chat et voix,", " sur iPhone et sur le web."],
      ["Des automatisations", " qui tournent pendant ton absence."],
      ["Une mémoire", " qui s’améliore chaque jour."],
    ],
    trialCta: "Commencer ma semaine gratuite",
    subscribeCta: "S’abonner pour {price}/mois",
    trialThen: "puis {price} par mois · résiliable à tout moment",
    subscribeThen: "Mensuel · résiliable à tout moment",
    trialTerms: "7 jours gratuits, puis {price}/mois. Renouvellement automatique chaque mois jusqu’à ce que tu résilies dans les réglages de l’App Store, au moins 24 heures avant la fin de la période.",
    subscribeTerms: "{price}/mois. Renouvellement automatique chaque mois jusqu’à ce que tu résilies dans les réglages de l’App Store, au moins 24 heures avant la fin de la période.",
  },
  es: {
    eyebrow: "Hey Hermes Personal",
    trialTitle: "Prueba Hey Hermes gratis durante 7 días",
    trialTitleAccent: "gratis durante 7 días",
    planTitle: "Una IA que trabaja para ti. Y que es tuya.",
    planTitleAccent: "Y que es tuya.",
    benefits: [
      ["Tu propio servidor privado.", " Las llaves las tienes tú."],
      ["Chat y voz,", " en el iPhone y en la web."],
      ["Automatizaciones", " que funcionan mientras no estás."],
      ["Una memoria", " que mejora cada día."],
    ],
    trialCta: "Empezar mi semana gratis",
    subscribeCta: "Suscribirme por {price}/mes",
    trialThen: "después {price} al mes · cancela cuando quieras",
    subscribeThen: "Mensual · cancela cuando quieras",
    trialTerms: "7 días gratis, después {price}/mes. Se renueva automáticamente cada mes hasta que canceles en los ajustes del App Store al menos 24 horas antes de que termine el periodo.",
    subscribeTerms: "{price}/mes. Se renueva automáticamente cada mes hasta que canceles en los ajustes del App Store al menos 24 horas antes de que termine el periodo.",
  },
  it: {
    eyebrow: "Hey Hermes Personal",
    trialTitle: "Prova Hey Hermes gratis per 7 giorni",
    trialTitleAccent: "gratis per 7 giorni",
    planTitle: "Un’IA che lavora per te. E che ti appartiene.",
    planTitleAccent: "E che ti appartiene.",
    benefits: [
      ["Il tuo server privato.", " Le chiavi le hai tu."],
      ["Chat e voce,", " su iPhone e sul web."],
      ["Automazioni", " che lavorano mentre non ci sei."],
      ["Una memoria", " che migliora ogni giorno."],
    ],
    trialCta: "Inizia la settimana gratuita",
    subscribeCta: "Abbonati a {price}/mese",
    trialThen: "poi {price} al mese · disdici quando vuoi",
    subscribeThen: "Mensile · disdici quando vuoi",
    trialTerms: "7 giorni gratis, poi {price}/mese. Si rinnova automaticamente ogni mese finché non disdici nelle impostazioni dell’App Store almeno 24 ore prima della fine del periodo.",
    subscribeTerms: "{price}/mese. Si rinnova automaticamente ogni mese finché non disdici nelle impostazioni dell’App Store almeno 24 ore prima della fine del periodo.",
  },
  "pt-BR": {
    eyebrow: "Hey Hermes Personal",
    trialTitle: "Experimente o Hey Hermes grátis por 7 dias",
    trialTitleAccent: "grátis por 7 dias",
    planTitle: "Uma IA que trabalha para você. E que é sua.",
    planTitleAccent: "E que é sua.",
    benefits: [
      ["Seu próprio servidor privado.", " As chaves ficam com você."],
      ["Chat e voz,", " no iPhone e na web."],
      ["Automações", " que rodam enquanto você está fora."],
      ["Uma memória", " que melhora a cada dia."],
    ],
    trialCta: "Começar minha semana grátis",
    subscribeCta: "Assinar por {price}/mês",
    trialThen: "depois {price} por mês · cancele quando quiser",
    subscribeThen: "Mensal · cancele quando quiser",
    trialTerms: "7 dias grátis, depois {price}/mês. Renova automaticamente todo mês até você cancelar nos ajustes da App Store pelo menos 24 horas antes do fim do período.",
    subscribeTerms: "{price}/mês. Renova automaticamente todo mês até você cancelar nos ajustes da App Store pelo menos 24 horas antes do fim do período.",
  },
  ja: {
    eyebrow: "Hey Hermes Personal",
    trialTitle: "Hey Hermesを7日間無料でお試し",
    trialTitleAccent: "7日間無料",
    planTitle: "あなたのために働くAI。そして、あなたのもの。",
    planTitleAccent: "そして、あなたのもの。",
    benefits: [
      ["あなた専用のプライベートサーバー。", "鍵を持つのはあなたです。"],
      ["チャットと音声。", "iPhoneでもWebでも。"],
      ["自動化。", "あなたが不在の間も動きます。"],
      ["記憶。", "毎日少しずつ賢くなります。"],
    ],
    trialCta: "無料の1週間を始める",
    subscribeCta: "月額{price}で登録",
    trialThen: "その後は月額{price} · いつでも解約可能",
    subscribeThen: "月額 · いつでも解約可能",
    trialTerms: "7日間無料、その後は月額{price}。期間終了の24時間前までにApp Storeの設定で解約しない限り、毎月自動更新されます。",
    subscribeTerms: "月額{price}。期間終了の24時間前までにApp Storeの設定で解約しない限り、毎月自動更新されます。",
  },
  ko: {
    eyebrow: "Hey Hermes Personal",
    trialTitle: "Hey Hermes 7일 무료 체험",
    trialTitleAccent: "7일 무료",
    planTitle: "당신을 위해 일하는 AI. 그리고 당신의 것.",
    planTitleAccent: "그리고 당신의 것.",
    benefits: [
      ["나만의 비공개 서버.", " 열쇠는 당신이 가집니다."],
      ["채팅과 음성,", " iPhone과 웹에서."],
      ["자동화,", " 자리를 비운 동안에도 실행됩니다."],
      ["기억,", " 매일 더 좋아집니다."],
    ],
    trialCta: "무료 1주일 시작하기",
    subscribeCta: "월 {price}에 구독하기",
    trialThen: "이후 월 {price} · 언제든 해지 가능",
    subscribeThen: "월간 · 언제든 해지 가능",
    trialTerms: "7일 무료, 이후 월 {price}. 기간 종료 24시간 전까지 App Store 설정에서 해지하지 않으면 매월 자동 갱신됩니다.",
    subscribeTerms: "월 {price}. 기간 종료 24시간 전까지 App Store 설정에서 해지하지 않으면 매월 자동 갱신됩니다.",
  },
};

/** HPD-1085: the offer words for iOS and the web purchase screen. */
export function heyPaywallOfferCopy(locale: AppLocale): HeyPaywallOfferCopy {
  return offerCopyByLocale[locale] ?? offerCopyByLocale.en;
}

/**
 * HPD-1090: the screen between a confirmed purchase and a ready Hermes, in the
 * paywall's design. Shown on the web and in the app instead of a chat whose
 * input is locked without explanation; both switch to chat by themselves as
 * soon as the server reports the runtime ready. The ready email is sent by the
 * server (HPD-1063), so the body may promise it. `titleAccent` is a substring
 * of `title`, painted in the brand blue like the paywall headline.
 */
export type HeyPreparingCopy = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  /** Web wording: "you can close this page". */
  body: string;
  /** App wording: "you can close the app". */
  appBody: string;
  progress: string;
  checkAgain: string;
};

const preparingCopyByLocale: Record<AppLocale, HeyPreparingCopy> = {
  en: {
    eyebrow: "Hey Hermes Personal",
    title: "Your Hermes is being set up",
    titleAccent: "being set up",
    body: "This usually takes 2–3 minutes. We’ll email you when it’s ready — you can close this page.",
    appBody: "This usually takes 2–3 minutes. We’ll email you when it’s ready — you can close the app.",
    progress: "Setting up your private server…",
    checkAgain: "Check again",
  },
  de: {
    eyebrow: "Hey Hermes Personal",
    title: "Dein Hermes wird eingerichtet",
    titleAccent: "wird eingerichtet",
    body: "Das dauert meist 2–3 Minuten. Wir schicken dir eine E-Mail, sobald er bereit ist – du kannst diese Seite schließen.",
    appBody: "Das dauert meist 2–3 Minuten. Wir schicken dir eine E-Mail, sobald er bereit ist – du kannst die App schließen.",
    progress: "Dein privater Server wird eingerichtet …",
    checkAgain: "Erneut prüfen",
  },
  fr: {
    eyebrow: "Hey Hermes Personal",
    title: "Votre Hermes est en cours de configuration",
    titleAccent: "en cours de configuration",
    body: "Cela prend généralement 2 à 3 minutes. Nous vous enverrons un e-mail dès qu’il sera prêt — vous pouvez fermer cette page.",
    appBody: "Cela prend généralement 2 à 3 minutes. Nous vous enverrons un e-mail dès qu’il sera prêt — vous pouvez fermer l’app.",
    progress: "Configuration de votre serveur privé…",
    checkAgain: "Vérifier à nouveau",
  },
  es: {
    eyebrow: "Hey Hermes Personal",
    title: "Tu Hermes se está configurando",
    titleAccent: "se está configurando",
    body: "Suele tardar 2–3 minutos. Te enviaremos un correo cuando esté listo; puedes cerrar esta página.",
    appBody: "Suele tardar 2–3 minutos. Te enviaremos un correo cuando esté listo; puedes cerrar la app.",
    progress: "Configurando tu servidor privado…",
    checkAgain: "Comprobar de nuevo",
  },
  it: {
    eyebrow: "Hey Hermes Personal",
    title: "Il tuo Hermes è in configurazione",
    titleAccent: "in configurazione",
    body: "Di solito servono 2–3 minuti. Ti invieremo un’email quando sarà pronto: puoi chiudere questa pagina.",
    appBody: "Di solito servono 2–3 minuti. Ti invieremo un’email quando sarà pronto: puoi chiudere l’app.",
    progress: "Configurazione del tuo server privato…",
    checkAgain: "Controlla di nuovo",
  },
  "pt-BR": {
    eyebrow: "Hey Hermes Personal",
    title: "Seu Hermes está sendo configurado",
    titleAccent: "sendo configurado",
    body: "Isso costuma levar 2–3 minutos. Enviaremos um e-mail quando estiver pronto — você pode fechar esta página.",
    appBody: "Isso costuma levar 2–3 minutos. Enviaremos um e-mail quando estiver pronto — você pode fechar o app.",
    progress: "Configurando seu servidor privado…",
    checkAgain: "Verificar novamente",
  },
  ja: {
    eyebrow: "Hey Hermes Personal",
    title: "Hermes を設定しています",
    titleAccent: "設定しています",
    body: "通常 2〜3 分で完了します。準備ができしだいメールでお知らせします。このページは閉じてもかまいません。",
    appBody: "通常 2〜3 分で完了します。準備ができしだいメールでお知らせします。アプリは閉じてもかまいません。",
    progress: "専用サーバーを設定しています…",
    checkAgain: "もう一度確認",
  },
  ko: {
    eyebrow: "Hey Hermes Personal",
    title: "Hermes를 설정하고 있습니다",
    titleAccent: "설정하고 있습니다",
    body: "보통 2~3분 정도 걸립니다. 준비되면 이메일로 알려 드립니다. 이 페이지를 닫으셔도 됩니다.",
    appBody: "보통 2~3분 정도 걸립니다. 준비되면 이메일로 알려 드립니다. 앱을 닫으셔도 됩니다.",
    progress: "개인 서버를 설정하고 있습니다…",
    checkAgain: "다시 확인",
  },
};

/** HPD-1090: the preparing screen's words for iOS and the web. */
export function heyPreparingCopy(locale: AppLocale): HeyPreparingCopy {
  return preparingCopyByLocale[locale] ?? preparingCopyByLocale.en;
}

function fill(template: string, price: string) {
  return template.replaceAll("{price}", price);
}

function trialText(copy: IosPaywallCopy, plan: MobilePurchasePlan | null, price: string) {
  switch (plan?.trialEligibility) {
    case "eligible":
      return fill(copy.eligibleTrial, price);
    case "ineligible":
      return fill(copy.ineligibleTrial, price);
    case "unavailable":
      return fill(copy.unavailableTrial, price);
    default:
      return copy.unknownTrial;
  }
}

/**
 * The purchase screen's own words, so a copy check can read them directly
 * instead of reconstructing them from one rendered view.
 */
export function iosPaywallCopy(locale: AppLocale): IosPaywallCopy {
  return copyByLocale[locale] ?? en;
}

/**
 * HPD-1043: the purchase or restore was refused because this Apple ID's
 * receipt is bound to another Hey account. Plain words instead of the SDK's
 * "There is already another active subscriber using the same receipt."
 */
export function iosReceiptInUseMessage(locale: AppLocale): string {
  // No restore hint: Restore Purchases fails with this very error.
  return iosPaywallCopy(locale).receiptInUse;
}

export function shouldShowIosPaywallOnboarding(input: {
  comped: boolean;
  entitlementStatus: EntitlementStatus;
  runtimeAccess: WorkspaceRuntimeAccess;
}) {
  // Runtime access defaults to enabled even for accounts that have never bought.
  return !hasValidMobileProductAccess({ status: input.entitlementStatus, comped: input.comped });
}

/** What the Store itself is doing, so the price line never claims progress that stopped. */
export type IosPaywallStoreState = "loading" | "ready" | "unavailable";

function planLabel(copy: IosPaywallCopy, input: { comped: boolean; entitlementStatus: EntitlementStatus }) {
  if (input.entitlementStatus === "trialing") return copy.planTrialing;
  if (input.entitlementStatus === "active") return copy.planActive;
  if (input.entitlementStatus === "grace_period") return copy.planGrace;
  if (input.entitlementStatus === "cancelled") return copy.planCancelled;
  // Complimentary access is real access, but it is not a purchased plan and it
  // is not a trial. It only reads as the plan once no entitlement outranks it.
  if (input.comped) return copy.planComplimentary;
  return copy.planNone;
}

export type HeyPaywallOfferView = {
  kind: "trial" | "subscribe";
  eyebrow: string;
  title: string;
  titleAccent: string;
  /** At capacity the button becomes the waitlist; the free week is not offered there. */
  waitlistTitle: string;
  waitlistTitleAccent: string;
  benefits: readonly (readonly [string, string])[];
  ctaLabel: string;
  ctaSubline: string;
  termsText: string;
};

function offerView(
  locale: AppLocale,
  plan: MobilePurchasePlan | null,
  price: string,
  storeLabel: string | null,
  copy: IosPaywallCopy,
): HeyPaywallOfferView {
  const offer = heyPaywallOfferCopy(locale);
  const trial = plan?.trialEligibility === "eligible";
  return {
    kind: trial ? "trial" : "subscribe",
    eyebrow: offer.eyebrow,
    title: trial ? offer.trialTitle : offer.planTitle,
    titleAccent: trial ? offer.trialTitleAccent : offer.planTitleAccent,
    waitlistTitle: offer.planTitle,
    waitlistTitleAccent: offer.planTitleAccent,
    benefits: offer.benefits,
    ctaLabel: storeLabel ?? (trial ? offer.trialCta : fill(offer.subscribeCta, price)),
    ctaSubline: fill(trial ? offer.trialThen : offer.subscribeThen, price),
    // Without a Store package there is no price to state, so Apple's renewal
    // words stand alone. An unconfirmed eligibility keeps Apple's own wording:
    // the sheet decides. The full age line (with guardian consent) closes it.
    termsText: [
      !plan ? copy.renewal : fill(trial ? offer.trialTerms : offer.subscribeTerms, price),
      !trial && (!plan || plan.trialEligibility === "unknown") ? copy.unknownTrial : null,
      copy.age,
    ].filter(Boolean).join(" "),
  };
}

export function iosPaywallView(input: {
  locale: AppLocale;
  plan: MobilePurchasePlan | null;
  comped: boolean;
  entitlementStatus: EntitlementStatus;
  runtimeAccess: WorkspaceRuntimeAccess;
  storeState?: IosPaywallStoreState;
  trustClaimsProven?: boolean;
}) {
  const copy = copyByLocale[input.locale] ?? en;
  if (input.plan && input.plan.packageId !== "personal_monthly") {
    throw new Error("The iOS paywall received a non-monthly or unapproved package.");
  }
  const price = input.plan?.priceString || copy.monthlyFallbackPrice;
  const trustClaimsVisible = input.trustClaimsProven === true && IOS_PAYWALL_TRUST_CLAIMS_PUBLISHABLE;

  return {
    showOnboarding: shouldShowIosPaywallOnboarding(input),
    heroTitle: copy.heroTitle,
    heroBody: copy.heroBody,
    planName: copy.planName,
    monthlyAccess: copy.monthlyAccess,
    price,
    planLabel: planLabel(copy, input),
    // Fail closed: only an actively loading Store may claim it is still
    // checking. A Store that returned no package is unavailable, not pending -
    // otherwise the button says "checking" forever and never becomes buyable.
    purchaseLabel: input.plan
      ? fill(copy.purchase, price)
      : input.storeState === "loading"
        ? copy.loadingPrice
        : copy.unavailablePrice,
    trialText: trialText(copy, input.plan, price),
    // HPD-1085: the offer. Only an eligibility the Store confirmed may promise
    // the free week; unknown or ineligible shows the plan and its price.
    offer: offerView(input.locale, input.plan, price, input.plan
      ? null
      : input.storeState === "loading"
        ? copy.loadingPrice
        : copy.unavailablePrice, copy),
    renewalText: copy.renewal,
    ageText: copy.age,
    accountBoundaryText: copy.accountBoundary,
    complimentaryOverlapText: input.comped ? copy.complimentaryOverlap : null,
    restoreLabel: copy.restore,
    restoringLabel: copy.restoring,
    manageLabel: copy.manage,
    manageError: copy.manageError,
    trustClaims: trustClaimsVisible ? copy.trust : [],
    // Apple requires the purchase surface itself to carry functional Privacy and
    // Terms links. The hrefs stay owned by the canonical pack constants in
    // @hermes/core; only the labels are local.
    legalLinks: [
      { key: "privacy", label: copy.privacy, url: HEY_LEGAL_LINKS.privacy },
      { key: "terms", label: copy.terms, url: HEY_LEGAL_LINKS.terms },
    ],
    actions: {
      purchasePackageId: input.plan?.packageId ?? null,
      restore: true,
      manageUrl: IOS_APP_STORE_SUBSCRIPTIONS_URL,
    },
  } as const;
}

export async function openIosSubscriptionManagement(openUrl: (url: string) => Promise<unknown>) {
  await openUrl(IOS_APP_STORE_SUBSCRIPTIONS_URL);
  return IOS_APP_STORE_SUBSCRIPTIONS_URL;
}

// HPD-1063: the plane refuses to sell while the host has no free place. These
// words replace the purchase button only when the server says so; an unknown
// sales status (old server, network error) keeps the purchase exactly as before.
export type IosPaywallWaitlistCopy = {
  joinWaitlist: string;
  joiningWaitlist: string;
  waitlistIntro: string;
  waitlistJoined: string;
  waitlistPosition: string;
  waitlistError: string;
  invitationReserved: string;
};

const waitlistCopyByLocale: Record<AppLocale, IosPaywallWaitlistCopy> = {
  en: {
    joinWaitlist: "Join the waitlist",
    joiningWaitlist: "Joining…",
    waitlistIntro: "We're at capacity right now. Join the waitlist and we'll email you as soon as a place is free.",
    waitlistJoined: "You're on the waitlist. We'll email you as soon as a place is free.",
    waitlistPosition: "Your position: {position}",
    waitlistError: "We couldn't add you to the waitlist. Please try again.",
    invitationReserved: "A place is reserved for you until {time}.",
  },
  de: {
    joinWaitlist: "Auf die Warteliste",
    joiningWaitlist: "Wird eingetragen…",
    waitlistIntro: "Gerade sind alle Plätze belegt. Trag Dich auf die Warteliste ein – wir schicken Dir eine E-Mail, sobald ein Platz frei ist.",
    waitlistJoined: "Du stehst auf der Warteliste. Wir schicken Dir eine E-Mail, sobald ein Platz frei ist.",
    waitlistPosition: "Deine Position: {position}",
    waitlistError: "Wir konnten Dich nicht auf die Warteliste setzen. Bitte versuche es noch einmal.",
    invitationReserved: "Ein Platz ist bis {time} für Dich reserviert.",
  },
  fr: {
    joinWaitlist: "Rejoindre la liste d’attente",
    joiningWaitlist: "Inscription…",
    waitlistIntro: "Nous sommes complets pour le moment. Rejoignez la liste d’attente et nous vous écrirons dès qu’une place se libère.",
    waitlistJoined: "Vous êtes sur la liste d’attente. Nous vous écrirons dès qu’une place se libère.",
    waitlistPosition: "Votre position : {position}",
    waitlistError: "Impossible de vous inscrire sur la liste d’attente. Veuillez réessayer.",
    invitationReserved: "Une place vous est réservée jusqu’à {time}.",
  },
  es: {
    joinWaitlist: "Unirme a la lista de espera",
    joiningWaitlist: "Uniéndote…",
    waitlistIntro: "Ahora mismo no hay plazas libres. Únete a la lista de espera y te escribiremos en cuanto haya una plaza.",
    waitlistJoined: "Estás en la lista de espera. Te escribiremos en cuanto haya una plaza libre.",
    waitlistPosition: "Tu posición: {position}",
    waitlistError: "No pudimos añadirte a la lista de espera. Inténtalo de nuevo.",
    invitationReserved: "Tienes una plaza reservada hasta {time}.",
  },
  it: {
    joinWaitlist: "Iscriviti alla lista d’attesa",
    joiningWaitlist: "Iscrizione…",
    waitlistIntro: "Al momento non ci sono posti liberi. Iscriviti alla lista d’attesa e ti scriveremo non appena si libera un posto.",
    waitlistJoined: "Sei nella lista d’attesa. Ti scriveremo non appena si libera un posto.",
    waitlistPosition: "La tua posizione: {position}",
    waitlistError: "Non è stato possibile iscriverti alla lista d’attesa. Riprova.",
    invitationReserved: "Un posto è riservato per te fino alle {time}.",
  },
  "pt-BR": {
    joinWaitlist: "Entrar na lista de espera",
    joiningWaitlist: "Entrando…",
    waitlistIntro: "No momento não há vagas. Entre na lista de espera e enviaremos um e-mail assim que houver uma vaga.",
    waitlistJoined: "Você está na lista de espera. Enviaremos um e-mail assim que houver uma vaga.",
    waitlistPosition: "Sua posição: {position}",
    waitlistError: "Não foi possível colocar você na lista de espera. Tente novamente.",
    invitationReserved: "Uma vaga está reservada para você até {time}.",
  },
  ja: {
    joinWaitlist: "ウェイトリストに登録",
    joiningWaitlist: "登録しています…",
    waitlistIntro: "現在、空きがありません。ウェイトリストに登録いただくと、空きが出しだいメールでお知らせします。",
    waitlistJoined: "ウェイトリストに登録しました。空きが出しだいメールでお知らせします。",
    waitlistPosition: "あなたの順番: {position}",
    waitlistError: "ウェイトリストに登録できませんでした。もう一度お試しください。",
    invitationReserved: "{time}まであなたの枠を確保しています。",
  },
  ko: {
    joinWaitlist: "대기자 명단에 등록",
    joiningWaitlist: "등록 중…",
    waitlistIntro: "지금은 자리가 없습니다. 대기자 명단에 등록하시면 자리가 나는 대로 이메일로 알려 드립니다.",
    waitlistJoined: "대기자 명단에 등록되었습니다. 자리가 나는 대로 이메일로 알려 드립니다.",
    waitlistPosition: "내 순서: {position}",
    waitlistError: "대기자 명단에 등록하지 못했습니다. 다시 시도해 주세요.",
    invitationReserved: "{time}까지 자리가 예약되어 있습니다.",
  },
};

export function iosPaywallWaitlistCopy(locale: AppLocale): IosPaywallWaitlistCopy {
  return waitlistCopyByLocale[locale] ?? waitlistCopyByLocale.en;
}

/**
 * HPD-1063 decision: purchase unless the server explicitly refuses. Null
 * (unknown) and mayPurchase=true keep the purchase; an invitation always
 * allows the purchase.
 */
export function iosPaywallSalesDecision(status: HeyHermesSalesStatus | null): "purchase" | "waitlist" {
  if (!status) return "purchase";
  if (status.invitation) return "purchase";
  return status.mayPurchase ? "purchase" : "waitlist";
}

export type IosPaywallSalesView = {
  mode: "purchase" | "waitlist";
  /** True once the account is on the waitlist (waiting); the join button then hides. */
  joined: boolean;
  joinLabel: string;
  joiningLabel: string;
  lines: string[];
};

export function iosPaywallSalesView(input: {
  locale: AppLocale;
  status: HeyHermesSalesStatus | null;
  formatTime: (iso: string) => string;
}): IosPaywallSalesView {
  const copy = iosPaywallWaitlistCopy(input.locale);
  const mode = iosPaywallSalesDecision(input.status);
  const lines: string[] = [];
  const status = input.status;
  if (status?.invitation) {
    lines.push(copy.invitationReserved.replace("{time}", input.formatTime(status.invitation.expiresAt)));
  }
  const joined = mode === "waitlist" && status?.waitlist?.status === "waiting";
  if (mode === "waitlist") {
    lines.push(joined ? copy.waitlistJoined : copy.waitlistIntro);
    const position = status?.waitlist?.position;
    if (joined && typeof position === "number") lines.push(copy.waitlistPosition.replace("{position}", String(position)));
  }
  return { mode, joined, joinLabel: copy.joinWaitlist, joiningLabel: copy.joiningWaitlist, lines };
}
