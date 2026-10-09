import { appLocales, type AppLocale } from "../core/index";

/**
 * HPD-1105: the signed-out screen in the HPD-1085 paywall design. Dragon,
 * eyebrow, a calm headline with one blue accent, one line of benefit, then
 * one big primary action (the email sign-in link). Apple and Google follow as
 * equal buttons; the password form stays behind a small link (HPD-1087).
 * `titleAccent` / `createTitleAccent` are substrings of their titles; the
 * product name carries a no-break space so it never splits across lines.
 */
export type HeySignInCopy = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  body: string;
  createTitle: string;
  createTitleAccent: string;
  createBody: string;
  emailPlaceholder: string;
  sendLink: string;
  linkHint: string;
  or: string;
  newHere: string;
  createLink: string;
  haveAccount: string;
  signInLink: string;
};

const signInCopyByLocale: Record<AppLocale, HeySignInCopy> = {
  en: {
    eyebrow: "Hey Hermes",
    title: "Welcome to Hey\u00a0Hermes",
    titleAccent: "Hey\u00a0Hermes",
    body: "Your private assistant, ready when you are.",
    createTitle: "Create your account",
    createTitleAccent: "your account",
    createBody: "An AI that works for you, on your own private server.",
    emailPlaceholder: "Your email address",
    sendLink: "Send sign-in link",
    linkHint: "No password needed. We’ll email you a link.",
    or: "or",
    newHere: "New to Hey Hermes?",
    createLink: "Create account",
    haveAccount: "Already have an account?",
    signInLink: "Sign in",
  },
  de: {
    eyebrow: "Hey Hermes",
    title: "Willkommen bei Hey\u00a0Hermes",
    titleAccent: "Hey\u00a0Hermes",
    body: "Dein privater Assistent, bereit, wenn du es bist.",
    createTitle: "Konto erstellen",
    createTitleAccent: "Konto",
    createBody: "Eine KI, die für dich arbeitet – auf deinem eigenen Server.",
    emailPlaceholder: "Deine E-Mail-Adresse",
    sendLink: "Anmeldelink senden",
    linkHint: "Kein Passwort nötig – wir schicken dir einen Link.",
    or: "oder",
    newHere: "Neu bei Hey Hermes?",
    createLink: "Konto erstellen",
    haveAccount: "Schon ein Konto?",
    signInLink: "Anmelden",
  },
  fr: {
    eyebrow: "Hey Hermes",
    title: "Bienvenue sur Hey\u00a0Hermes",
    titleAccent: "Hey\u00a0Hermes",
    body: "Votre assistant privé, prêt quand vous l’êtes.",
    createTitle: "Créer votre compte",
    createTitleAccent: "votre compte",
    createBody: "Une IA qui travaille pour vous, sur votre propre serveur privé.",
    emailPlaceholder: "Votre adresse e-mail",
    sendLink: "Envoyer le lien de connexion",
    linkHint: "Aucun mot de passe. Nous vous envoyons un lien par e-mail.",
    or: "ou",
    newHere: "Nouveau sur Hey Hermes ?",
    createLink: "Créer un compte",
    haveAccount: "Vous avez déjà un compte ?",
    signInLink: "Se connecter",
  },
  es: {
    eyebrow: "Hey Hermes",
    title: "Te damos la bienvenida a Hey\u00a0Hermes",
    titleAccent: "Hey\u00a0Hermes",
    body: "Tu asistente privado, listo cuando tú lo estés.",
    createTitle: "Crea tu cuenta",
    createTitleAccent: "tu cuenta",
    createBody: "Una IA que trabaja para ti, en tu propio servidor privado.",
    emailPlaceholder: "Tu correo electrónico",
    sendLink: "Enviar enlace de acceso",
    linkHint: "Sin contraseña. Te enviamos un enlace por correo.",
    or: "o",
    newHere: "¿Primera vez en Hey Hermes?",
    createLink: "Crear cuenta",
    haveAccount: "¿Ya tienes una cuenta?",
    signInLink: "Iniciar sesión",
  },
  it: {
    eyebrow: "Hey Hermes",
    title: "Ti diamo il benvenuto in Hey\u00a0Hermes",
    titleAccent: "Hey\u00a0Hermes",
    body: "Il tuo assistente privato, pronto quando lo sei tu.",
    createTitle: "Crea il tuo account",
    createTitleAccent: "il tuo account",
    createBody: "Un’IA che lavora per te, sul tuo server privato.",
    emailPlaceholder: "Il tuo indirizzo email",
    sendLink: "Invia link di accesso",
    linkHint: "Nessuna password. Ti inviamo un link via email.",
    or: "oppure",
    newHere: "Prima volta su Hey Hermes?",
    createLink: "Crea un account",
    haveAccount: "Hai già un account?",
    signInLink: "Accedi",
  },
  "pt-BR": {
    eyebrow: "Hey Hermes",
    title: "Boas-vindas ao Hey\u00a0Hermes",
    titleAccent: "Hey\u00a0Hermes",
    body: "Seu assistente particular, pronto quando você estiver.",
    createTitle: "Crie sua conta",
    createTitleAccent: "sua conta",
    createBody: "Uma IA que trabalha para você, no seu próprio servidor privado.",
    emailPlaceholder: "Seu e-mail",
    sendLink: "Enviar link de acesso",
    linkHint: "Sem senha. Enviamos um link por e-mail.",
    or: "ou",
    newHere: "Primeira vez no Hey Hermes?",
    createLink: "Criar conta",
    haveAccount: "Já tem uma conta?",
    signInLink: "Entrar",
  },
  ja: {
    eyebrow: "Hey Hermes",
    title: "Hey\u00a0Hermes へようこそ",
    titleAccent: "Hey\u00a0Hermes",
    body: "あなた専用のアシスタントが、いつでも待っています。",
    createTitle: "アカウントを作成",
    createTitleAccent: "アカウント",
    createBody: "あなたのために働くAIを、あなた専用のサーバーで。",
    emailPlaceholder: "メールアドレス",
    sendLink: "ログインリンクを送信",
    linkHint: "パスワードは不要です。リンクをメールでお送りします。",
    or: "または",
    newHere: "Hey Hermes は初めてですか？",
    createLink: "アカウントを作成",
    haveAccount: "アカウントをお持ちですか？",
    signInLink: "サインイン",
  },
  ko: {
    eyebrow: "Hey Hermes",
    title: "Hey\u00a0Hermes에 오신 것을 환영합니다",
    titleAccent: "Hey\u00a0Hermes",
    body: "나만의 비서가 언제든 준비되어 있습니다.",
    createTitle: "계정 만들기",
    createTitleAccent: "계정",
    createBody: "나를 위해 일하는 AI, 나만의 개인 서버에서.",
    emailPlaceholder: "이메일 주소",
    sendLink: "로그인 링크 보내기",
    linkHint: "비밀번호가 필요 없습니다. 이메일로 링크를 보내 드립니다.",
    or: "또는",
    newHere: "Hey Hermes가 처음이신가요?",
    createLink: "계정 만들기",
    haveAccount: "이미 계정이 있으신가요?",
    signInLink: "로그인",
  },
};

export function heySignInCopy(locale: AppLocale): HeySignInCopy {
  return signInCopyByLocale[locale] ?? signInCopyByLocale.en;
}

/** HPD-1105: the headline and benefit line for the selected mode. */
export function heySignInHeadline(locale: AppLocale, mode: "sign_in" | "create_account"): { title: string; titleAccent: string; body: string } {
  const copy = heySignInCopy(locale);
  return mode === "create_account"
    ? { title: copy.createTitle, titleAccent: copy.createTitleAccent, body: copy.createBody }
    : { title: copy.title, titleAccent: copy.titleAccent, body: copy.body };
}

/**
 * HPD-1105: the signed-out screen speaks the device language. Before sign-in
 * there is no account preference yet, so the screen used to be English for
 * everyone. Maps a BCP 47 tag ("de-DE", "pt-BR", "pt-PT", "ja-JP") to one of
 * the eight app locales; Portuguese of any region reads Brazilian Portuguese.
 */
export function appLocaleFromDeviceTag(tag: string | null | undefined): AppLocale {
  const language = String(tag ?? "").trim().replace(/_/g, "-").split("-")[0]?.toLowerCase() ?? "";
  if (language === "pt") return "pt-BR";
  return (appLocales as readonly string[]).includes(language) ? (language as AppLocale) : "en";
}

/** HPD-1105: the device's current locale, read through Intl; English when unavailable. */
export function deviceAppLocale(): AppLocale {
  try {
    return appLocaleFromDeviceTag(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return "en";
  }
}
