import type { AppLocale } from "../core/index";

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
