import type { AppLocale } from "./types";

/**
 * HPD-1715 (Justus, 2026-10-25): an account on emergency or press access gets
 * a deadline (default 72 hours, started by the operator with
 * `press-access-cli convert`) to start a real store trial. While it runs, the
 * server puts `subscription.trialOffer.deadlineAt` on the subscription state
 * and every client shows this offer, although access is active. The button
 * leads to the normal App Store, Google Play or web checkout; the server swaps
 * the access for the store subscription on the same workspace.
 *
 * The same copy and rule live in the Hey Hermes repository (packages/core/src/trial-offer.ts)
 * for the web; keep the two files identical in words.
 */
export interface TrialOfferView {
  deadlineAt: string;
  title: string;
  body: string;
  cta: string;
}

type OfferCopy = { title: string; body: string; cta: string };

const copyByLocale: Record<AppLocale, OfferCopy> = {
  en: {
    title: "Keep Hey Hermes: start your free trial",
    body: "Your access ends on {date}. Start the free trial before then and everything stays as it is: same server, same memory, same chats.",
    cta: "Start free trial",
  },
  de: {
    title: "Hey Hermes behalten: Probezeit starten",
    body: "Dein Zugang endet am {date}. Starte vorher die Probezeit, dann bleibt alles, wie es ist: derselbe Server, dasselbe Gedächtnis, dieselben Chats.",
    cta: "Probezeit starten",
  },
  fr: {
    title: "Garder Hey Hermes : démarrer l’essai gratuit",
    body: "Ton accès se termine le {date}. Démarre l’essai gratuit avant, et tout reste comme avant : même serveur, même mémoire, mêmes conversations.",
    cta: "Démarrer l’essai gratuit",
  },
  es: {
    title: "Conserva Hey Hermes: empieza tu prueba gratuita",
    body: "Tu acceso termina el {date}. Empieza la prueba gratuita antes y todo sigue igual: el mismo servidor, la misma memoria, los mismos chats.",
    cta: "Empezar prueba gratuita",
  },
  it: {
    title: "Tieni Hey Hermes: avvia la prova gratuita",
    body: "Il tuo accesso termina il {date}. Avvia prima la prova gratuita e tutto resta com’è: stesso server, stessa memoria, stesse chat.",
    cta: "Avvia la prova gratuita",
  },
  "pt-BR": {
    title: "Fique com o Hey Hermes: comece o teste grátis",
    body: "Seu acesso termina em {date}. Comece o teste grátis antes disso e tudo continua como está: mesmo servidor, mesma memória, mesmas conversas.",
    cta: "Começar teste grátis",
  },
  ja: {
    title: "Hey Hermesを続ける：無料トライアルを開始",
    body: "アクセスは{date}に終了します。それまでに無料トライアルを開始すれば、サーバー、メモリ、チャットはそのまま引き継がれます。",
    cta: "無料トライアルを開始",
  },
  ko: {
    title: "Hey Hermes 계속 사용하기: 무료 체험 시작",
    body: "이용 권한이 {date}에 종료됩니다. 그 전에 무료 체험을 시작하면 서버, 메모리, 대화가 그대로 유지됩니다.",
    cta: "무료 체험 시작",
  },
};

/** The offer text for a locale (also used by copy checks). */
export function trialOfferCopy(locale: AppLocale): OfferCopy {
  return copyByLocale[locale] ?? copyByLocale.en;
}

/**
 * The offer a client shows, or null: absent on older servers, past its
 * deadline, or already taken (the server clears it then).
 */
export function trialOfferView(
  subscription: { trialOffer?: { deadlineAt: string } | null } | null | undefined,
  locale: AppLocale,
  formatDate: (value: string) => string,
  nowMs: number = Date.now(),
): TrialOfferView | null {
  const deadlineAt = subscription?.trialOffer?.deadlineAt;
  if (!deadlineAt || !Number.isFinite(Date.parse(deadlineAt)) || Date.parse(deadlineAt) <= nowMs) return null;
  const copy = trialOfferCopy(locale);
  return { deadlineAt, title: copy.title, body: copy.body.replace("{date}", formatDate(deadlineAt)), cta: copy.cta };
}

/**
 * The banner sells a Hey Hermes store trial, so only the Hey app (the standalone
 * host) may show it, and only on a build with a store. HODL, LiveQuote and Fin embed
 * this package as an external host; there the button could not buy anything.
 */
export function trialOfferBannerAllowed(input: { sessionMode: "standalone" | "external"; storePlatform: unknown }): boolean {
  return input.sessionMode === "standalone" && input.storePlatform !== null && input.storePlatform !== undefined;
}
