import type { AppLocale } from "../core/index";

/**
 * HPD-1090: the screen between a confirmed purchase and a ready Hermes, in the
 * paywall's design. Shown on the web and in the app instead of a chat whose
 * input is locked without explanation; both switch to chat by themselves as
 * soon as the server reports the runtime ready. The ready email is sent by the
 * server (HPD-1063), so the body promises it only while the account's email
 * notifications are on (heyPreparingBody). `titleAccent` is a substring
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
  /** HPD-1090: the same without the email promise, for accounts that turned email notifications off. */
  bodyNoEmail: string;
  appBodyNoEmail: string;
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
    bodyNoEmail: "This usually takes 2–3 minutes — you can close this page and come back later.",
    appBodyNoEmail: "This usually takes 2–3 minutes — you can close the app and come back later.",
    progress: "Setting up your private server…",
    checkAgain: "Check again",
  },
  de: {
    eyebrow: "Hey Hermes Personal",
    title: "Dein Hermes wird eingerichtet",
    titleAccent: "wird eingerichtet",
    body: "Das dauert meist 2–3 Minuten. Wir schicken dir eine E-Mail, sobald er bereit ist – du kannst diese Seite schließen.",
    appBody: "Das dauert meist 2–3 Minuten. Wir schicken dir eine E-Mail, sobald er bereit ist – du kannst die App schließen.",
    bodyNoEmail: "Das dauert meist 2–3 Minuten – du kannst diese Seite schließen und später wiederkommen.",
    appBodyNoEmail: "Das dauert meist 2–3 Minuten – du kannst die App schließen und später wiederkommen.",
    progress: "Dein privater Server wird eingerichtet …",
    checkAgain: "Erneut prüfen",
  },
  fr: {
    eyebrow: "Hey Hermes Personal",
    title: "Votre Hermes est en cours de configuration",
    titleAccent: "en cours de configuration",
    body: "Cela prend généralement 2 à 3 minutes. Nous vous enverrons un e-mail dès qu’il sera prêt — vous pouvez fermer cette page.",
    appBody: "Cela prend généralement 2 à 3 minutes. Nous vous enverrons un e-mail dès qu’il sera prêt — vous pouvez fermer l’app.",
    bodyNoEmail: "Cela prend généralement 2 à 3 minutes — vous pouvez fermer cette page et revenir plus tard.",
    appBodyNoEmail: "Cela prend généralement 2 à 3 minutes — vous pouvez fermer l’app et revenir plus tard.",
    progress: "Configuration de votre serveur privé…",
    checkAgain: "Vérifier à nouveau",
  },
  es: {
    eyebrow: "Hey Hermes Personal",
    title: "Tu Hermes se está configurando",
    titleAccent: "se está configurando",
    body: "Suele tardar 2–3 minutos. Te enviaremos un correo cuando esté listo; puedes cerrar esta página.",
    appBody: "Suele tardar 2–3 minutos. Te enviaremos un correo cuando esté listo; puedes cerrar la app.",
    bodyNoEmail: "Suele tardar 2–3 minutos; puedes cerrar esta página y volver más tarde.",
    appBodyNoEmail: "Suele tardar 2–3 minutos; puedes cerrar la app y volver más tarde.",
    progress: "Configurando tu servidor privado…",
    checkAgain: "Comprobar de nuevo",
  },
  it: {
    eyebrow: "Hey Hermes Personal",
    title: "Il tuo Hermes è in configurazione",
    titleAccent: "in configurazione",
    body: "Di solito servono 2–3 minuti. Ti invieremo un’email quando sarà pronto: puoi chiudere questa pagina.",
    appBody: "Di solito servono 2–3 minuti. Ti invieremo un’email quando sarà pronto: puoi chiudere l’app.",
    bodyNoEmail: "Di solito servono 2–3 minuti: puoi chiudere questa pagina e tornare più tardi.",
    appBodyNoEmail: "Di solito servono 2–3 minuti: puoi chiudere l’app e tornare più tardi.",
    progress: "Configurazione del tuo server privato…",
    checkAgain: "Controlla di nuovo",
  },
  "pt-BR": {
    eyebrow: "Hey Hermes Personal",
    title: "Seu Hermes está sendo configurado",
    titleAccent: "sendo configurado",
    body: "Isso costuma levar 2–3 minutos. Enviaremos um e-mail quando estiver pronto — você pode fechar esta página.",
    appBody: "Isso costuma levar 2–3 minutos. Enviaremos um e-mail quando estiver pronto — você pode fechar o app.",
    bodyNoEmail: "Isso costuma levar 2–3 minutos — você pode fechar esta página e voltar mais tarde.",
    appBodyNoEmail: "Isso costuma levar 2–3 minutos — você pode fechar o app e voltar mais tarde.",
    progress: "Configurando seu servidor privado…",
    checkAgain: "Verificar novamente",
  },
  ja: {
    eyebrow: "Hey Hermes Personal",
    title: "Hermes を設定しています",
    titleAccent: "設定しています",
    body: "通常 2〜3 分で完了します。準備ができしだいメールでお知らせします。このページは閉じてもかまいません。",
    appBody: "通常 2〜3 分で完了します。準備ができしだいメールでお知らせします。アプリは閉じてもかまいません。",
    bodyNoEmail: "通常 2〜3 分で完了します。このページを閉じて、あとで戻ってきてもかまいません。",
    appBodyNoEmail: "通常 2〜3 分で完了します。アプリを閉じて、あとで戻ってきてもかまいません。",
    progress: "専用サーバーを設定しています…",
    checkAgain: "もう一度確認",
  },
  ko: {
    eyebrow: "Hey Hermes Personal",
    title: "Hermes를 설정하고 있습니다",
    titleAccent: "설정하고 있습니다",
    body: "보통 2~3분 정도 걸립니다. 준비되면 이메일로 알려 드립니다. 이 페이지를 닫으셔도 됩니다.",
    appBody: "보통 2~3분 정도 걸립니다. 준비되면 이메일로 알려 드립니다. 앱을 닫으셔도 됩니다.",
    bodyNoEmail: "보통 2~3분 정도 걸립니다. 이 페이지를 닫고 나중에 다시 오셔도 됩니다.",
    appBodyNoEmail: "보통 2~3분 정도 걸립니다. 앱을 닫고 나중에 다시 오셔도 됩니다.",
    progress: "개인 서버를 설정하고 있습니다…",
    checkAgain: "다시 확인",
  },
};

/** HPD-1090: the preparing screen's words for iOS and the web. */
export function heyPreparingCopy(locale: AppLocale): HeyPreparingCopy {
  return preparingCopyByLocale[locale] ?? preparingCopyByLocale.en;
}

/**
 * HPD-1090: the body for one surface. The ready email is sent only while the
 * account's email notifications are on, so only then is it promised.
 */
export function heyPreparingBody(locale: AppLocale, input: { surface: "web" | "app"; email: boolean }): string {
  const copy = heyPreparingCopy(locale);
  if (input.surface === "app") return input.email ? copy.appBody : copy.appBodyNoEmail;
  return input.email ? copy.body : copy.bodyNoEmail;
}

/** HPD-1090: whether the ready email will be sent; unknown preferences promise nothing. */
export function heyReadyEmailPromised(snapshot: { notificationPreferences?: { emailEnabled?: boolean } | null }): boolean {
  return snapshot.notificationPreferences?.emailEnabled === true;
}

/**
 * HPD-1090: an account that never paid has nothing being set up. It sees this
 * instead of the preparing screen: no progress, no email promise.
 */
export type HeyNoAccessCopy = { eyebrow: string; title: string; body: string; checkAgain: string };

const noAccessCopyByLocale: Record<AppLocale, HeyNoAccessCopy> = {
  en: { eyebrow: "Hey Hermes Personal", title: "No active plan on this account", body: "This account doesn’t have Hey Hermes Personal yet. As soon as a plan is active, your Hermes is set up here.", checkAgain: "Check again" },
  de: { eyebrow: "Hey Hermes Personal", title: "Kein aktiver Plan auf diesem Konto", body: "Dieses Konto hat noch kein Hey Hermes Personal. Sobald ein Plan aktiv ist, wird dein Hermes hier eingerichtet.", checkAgain: "Erneut prüfen" },
  fr: { eyebrow: "Hey Hermes Personal", title: "Aucun forfait actif sur ce compte", body: "Ce compte n’a pas encore Hey Hermes Personal. Dès qu’un forfait est actif, votre Hermes est configuré ici.", checkAgain: "Vérifier à nouveau" },
  es: { eyebrow: "Hey Hermes Personal", title: "Esta cuenta no tiene un plan activo", body: "Esta cuenta aún no tiene Hey Hermes Personal. En cuanto haya un plan activo, tu Hermes se configurará aquí.", checkAgain: "Comprobar de nuevo" },
  it: { eyebrow: "Hey Hermes Personal", title: "Nessun piano attivo su questo account", body: "Questo account non ha ancora Hey Hermes Personal. Appena un piano è attivo, il tuo Hermes viene configurato qui.", checkAgain: "Controlla di nuovo" },
  "pt-BR": { eyebrow: "Hey Hermes Personal", title: "Nenhum plano ativo nesta conta", body: "Esta conta ainda não tem o Hey Hermes Personal. Assim que um plano estiver ativo, seu Hermes será configurado aqui.", checkAgain: "Verificar novamente" },
  ja: { eyebrow: "Hey Hermes Personal", title: "このアカウントに有効なプランはありません", body: "このアカウントにはまだ Hey Hermes Personal がありません。プランが有効になりしだい、ここで Hermes を設定します。", checkAgain: "もう一度確認" },
  ko: { eyebrow: "Hey Hermes Personal", title: "이 계정에 활성 요금제가 없습니다", body: "이 계정에는 아직 Hey Hermes Personal이 없습니다. 요금제가 활성화되면 여기에서 Hermes를 설정합니다.", checkAgain: "다시 확인" },
};

export function heyNoAccessCopy(locale: AppLocale): HeyNoAccessCopy {
  return noAccessCopyByLocale[locale] ?? noAccessCopyByLocale.en;
}

/**
 * HPD-1102: an account without a plan only reaches the purchase or the
 * preparing screen. Apple 5.1.1(v) requires account deletion to stay
 * reachable, so both screens (app and web) carry a quiet "Account" entry. It
 * opens a panel with Sign out and the existing deletion flow, nothing else.
 */
export type HeyPaywallAccountCopy = { entry: string; title: string; body: string; signedInAs: string; back: string };

const paywallAccountCopyByLocale: Record<AppLocale, HeyPaywallAccountCopy> = {
  en: { entry: "Account", title: "Your account", body: "You can sign out or delete your account here. Hey Hermes itself needs an active plan.", signedInAs: "Signed in as {email}", back: "Back" },
  de: { entry: "Konto", title: "Dein Konto", body: "Hier kannst du dich abmelden oder dein Konto löschen. Hey Hermes selbst braucht einen aktiven Plan.", signedInAs: "Angemeldet als {email}", back: "Zurück" },
  fr: { entry: "Compte", title: "Votre compte", body: "Vous pouvez vous déconnecter ou supprimer votre compte ici. Hey Hermes lui-même nécessite un forfait actif.", signedInAs: "Connecté en tant que {email}", back: "Retour" },
  es: { entry: "Cuenta", title: "Tu cuenta", body: "Aquí puedes cerrar sesión o eliminar tu cuenta. Hey Hermes en sí requiere un plan activo.", signedInAs: "Sesión iniciada como {email}", back: "Volver" },
  it: { entry: "Account", title: "Il tuo account", body: "Qui puoi uscire o eliminare il tuo account. Hey Hermes richiede un piano attivo.", signedInAs: "Accesso effettuato come {email}", back: "Indietro" },
  "pt-BR": { entry: "Conta", title: "Sua conta", body: "Aqui você pode sair ou excluir sua conta. O Hey Hermes em si precisa de um plano ativo.", signedInAs: "Conectado como {email}", back: "Voltar" },
  ja: { entry: "アカウント", title: "あなたのアカウント", body: "ここでサインアウトやアカウントの削除ができます。Hey Hermes 本体のご利用には有効なプランが必要です。", signedInAs: "{email} でサインイン中", back: "戻る" },
  ko: { entry: "계정", title: "내 계정", body: "여기에서 로그아웃하거나 계정을 삭제할 수 있습니다. Hey Hermes 자체를 이용하려면 활성 요금제가 필요합니다.", signedInAs: "{email}(으)로 로그인됨", back: "뒤로" },
};

export function heyPaywallAccountCopy(locale: AppLocale): HeyPaywallAccountCopy {
  return paywallAccountCopyByLocale[locale] ?? paywallAccountCopyByLocale.en;
}
