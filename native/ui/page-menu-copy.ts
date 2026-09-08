import type { AppLocale } from "../core/index";

// HPD-619: removal is only bookmark archival, never app or file deletion.
const translations: Record<AppLocale, readonly [string, string, string, string, string, string]> = {
  en: ["Remove from menu", "Cancel", "Remove {title} from the menu?", "Only the menu entry is removed. Files, the app and automations remain unchanged.", "Could not remove this entry.", "Removing…"],
  de: ["Aus Menü entfernen", "Abbrechen", "{title} aus dem Menü entfernen?", "Nur der Menüeintrag wird entfernt. Dateien, App und Automationen bleiben erhalten.", "Dieser Eintrag konnte nicht entfernt werden.", "Wird entfernt…"],
  fr: ["Retirer du menu", "Annuler", "Retirer {title} du menu ?", "Seule l’entrée du menu est retirée. Les fichiers, l’application et les automatisations sont conservés.", "Impossible de retirer cette entrée.", "Suppression…"],
  es: ["Quitar del menú", "Cancelar", "¿Quitar {title} del menú?", "Solo se quita la entrada del menú. Los archivos, la aplicación y las automatizaciones se conservan.", "No se pudo quitar esta entrada.", "Quitando…"],
  it: ["Rimuovi dal menu", "Annulla", "Rimuovere {title} dal menu?", "Viene rimossa solo la voce del menu. File, app e automazioni restano invariati.", "Impossibile rimuovere questa voce.", "Rimozione…"],
  "pt-BR": ["Remover do menu", "Cancelar", "Remover {title} do menu?", "Somente a entrada do menu é removida. Arquivos, aplicativo e automações são preservados.", "Não foi possível remover esta entrada.", "Removendo…"],
  ja: ["メニューから削除", "キャンセル", "{title}をメニューから削除しますか？", "メニュー項目のみ削除します。ファイル、アプリ、自動化はそのまま保持されます。", "この項目を削除できませんでした。", "削除中…"],
  ko: ["메뉴에서 제거", "취소", "{title} 항목을 메뉴에서 제거할까요?", "메뉴 항목만 제거됩니다. 파일, 앱 및 자동화는 그대로 유지됩니다.", "이 항목을 제거하지 못했습니다.", "제거 중…"],
};

export function pageMenuRemovalCopy(locale: AppLocale, title: string) {
  const [remove, cancel, question, message, failed, pending] = translations[locale];
  return { remove, cancel, title: question.replace("{title}", title), message, failed, pending };
}
