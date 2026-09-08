import { defaultAppLocale, type AppLocale } from "./types";

const en = {
  title: "Secure secret entry",
  explanation: "This value goes directly to encrypted storage. It is never added to chat or shown to Hermes.",
  value: "Secret value",
  placeholder: "Enter once, then save securely",
  saving: "Saving…",
  save: "Save securely",
  cancel: "Cancel",
};

const copy: Record<AppLocale, typeof en> = {
  en,
  de: { title: "Sichere Eingabe", explanation: "Dieser Wert wird direkt verschlüsselt gespeichert. Er wird weder zum Chat hinzugefügt noch Hermes angezeigt.", value: "Geheimer Wert", placeholder: "Einmal eingeben, dann sicher speichern", saving: "Wird gespeichert…", save: "Sicher speichern", cancel: "Abbrechen" },
  fr: { title: "Saisie sécurisée", explanation: "Cette valeur est directement stockée sous forme chiffrée. Elle n’est jamais ajoutée au chat ni montrée à Hermes.", value: "Valeur secrète", placeholder: "Saisissez une fois, puis enregistrez en toute sécurité", saving: "Enregistrement…", save: "Enregistrer en toute sécurité", cancel: "Annuler" },
  es: { title: "Entrada segura", explanation: "Este valor se guarda directamente de forma cifrada. Nunca se añade al chat ni se muestra a Hermes.", value: "Valor secreto", placeholder: "Introduce una vez y guarda de forma segura", saving: "Guardando…", save: "Guardar de forma segura", cancel: "Cancelar" },
  it: { title: "Inserimento sicuro", explanation: "Questo valore viene archiviato direttamente in forma crittografata. Non viene mai aggiunto alla chat né mostrato a Hermes.", value: "Valore segreto", placeholder: "Inserisci una volta, poi salva in sicurezza", saving: "Salvataggio…", save: "Salva in sicurezza", cancel: "Annulla" },
  "pt-BR": { title: "Entrada segura", explanation: "Este valor é armazenado diretamente de forma criptografada. Ele nunca é adicionado ao chat nem mostrado ao Hermes.", value: "Valor secreto", placeholder: "Insira uma vez e salve com segurança", saving: "Salvando…", save: "Salvar com segurança", cancel: "Cancelar" },
  ja: { title: "安全な秘密情報の入力", explanation: "この値は直接暗号化して保存されます。チャットに追加されたり、Hermesに表示されたりすることはありません。", value: "秘密の値", placeholder: "一度入力して安全に保存", saving: "保存中…", save: "安全に保存", cancel: "キャンセル" },
  ko: { title: "안전한 비밀 정보 입력", explanation: "이 값은 직접 암호화되어 저장됩니다. 채팅에 추가되거나 Hermes에 표시되지 않습니다.", value: "비밀 값", placeholder: "한 번 입력한 후 안전하게 저장하세요", saving: "저장 중…", save: "안전하게 저장", cancel: "취소" },
};

export function secureSecretEntryCopy(locale: AppLocale = defaultAppLocale) {
  return copy[locale] ?? copy[defaultAppLocale];
}
