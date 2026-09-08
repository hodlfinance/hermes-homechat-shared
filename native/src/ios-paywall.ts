import { HEY_LEGAL_LINKS } from "../core/index";
import type { AppLocale, EntitlementStatus, WorkspaceRuntimeAccess } from "../core/index";
import type { MobilePurchasePlan } from "./revenuecat-purchases";

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

function fill(template: string, price: string) {
  return template.replace("{price}", price);
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

export function shouldShowIosPaywallOnboarding(input: {
  comped: boolean;
  entitlementStatus: EntitlementStatus;
  runtimeAccess: WorkspaceRuntimeAccess;
}) {
  if (input.comped || input.runtimeAccess === "enabled") return false;
  return !["active", "trialing", "grace_period"].includes(input.entitlementStatus);
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
