import type { AppLocale } from "../core/index";
const copy: Record<AppLocale, readonly [string, string, string]> = {
  en: ["New app or page", "What kind of page or app would you like me to build for you?", "Close"],
  de: ["Neue App oder Seite", "Was für eine neue Seite oder App soll ich dir bauen?", "Schließen"],
  fr: ["Nouvelle application ou page", "Quel type de page ou d’application souhaitez-vous que je crée pour vous ?", "Fermer"],
  es: ["Nueva aplicación o página", "¿Qué tipo de página o aplicación quieres que te cree?", "Cerrar"],
  it: ["Nuova app o pagina", "Che tipo di pagina o app vorresti che ti creassi?", "Chiudi"],
  "pt-BR": ["Novo aplicativo ou página", "Que tipo de página ou aplicativo você gostaria que eu criasse para você?", "Fechar"],
  ja: ["新しいアプリまたはページ", "どのようなページやアプリを作りましょうか？", "閉じる"],
  ko: ["새 앱 또는 페이지", "어떤 새 페이지나 앱을 만들어 드릴까요?", "닫기"],
};
const contextCopy: Record<AppLocale, readonly [string, string]> = {
  en: ["New page/app request", "Your draft is unchanged. Send or clear it, then choose New app or page again to start a page request."],
  de: ["Neue Seite/App erstellen", "Dein Entwurf bleibt unverändert. Sende oder leere ihn und wähle danach erneut Neue App oder Seite, um einen Seitenauftrag zu starten."],
  fr: ["Créer une page/application", "Votre brouillon reste inchangé. Envoyez-le ou effacez-le, puis choisissez à nouveau Nouvelle application ou page."],
  es: ["Crear una página/aplicación", "Tu borrador no cambia. Envíalo o bórralo y después elige de nuevo Nueva aplicación o página."],
  it: ["Crea una pagina/app", "La bozza resta invariata. Inviala o svuotala, poi scegli di nuovo Nuova app o pagina."],
  "pt-BR": ["Criar página/aplicativo", "Seu rascunho permanece inalterado. Envie ou limpe-o e escolha Novo aplicativo ou página novamente."],
  ja: ["新しいページ・アプリの作成依頼", "下書きは変更されません。送信または消去してから、新しいアプリまたはページをもう一度選んでください。"],
  ko: ["새 페이지/앱 만들기 요청", "초안은 변경되지 않습니다. 보내거나 비운 후 새 앱 또는 페이지를 다시 선택하세요."],
};
export function pageStarterCopy(locale: AppLocale) {
  const [label, question, close] = copy[locale];
  const [context, draftNotice] = contextCopy[locale];
  return { label, question, close, context, draftNotice };
}
