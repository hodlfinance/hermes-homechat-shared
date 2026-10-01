import type { AppLocale } from "../core/types";

export type NativeLiveVoicePhase = "idle" | "connecting" | "listening" | "waiting" | "speaking" | "error";
export type NativeLiveVoiceState = { phase: NativeLiveVoicePhase };
export type NativeLiveVoiceHandle = { end(): Promise<void> };
/** Optional product service. Shared owns presentation, not audio or provider authority. */
export type NativeLiveVoicePort = {
  start(input: {
    token: string;
    conversationId: string;
    signal: AbortSignal;
    onState(state: NativeLiveVoiceState): void;
    onConversationChanged(): void;
  }): Promise<NativeLiveVoiceHandle>;
};

export function liveVoiceStartVisible(text: string, supported: boolean, phase: NativeLiveVoicePhase) {
  return supported && !text.trim() && (phase === "idle" || phase === "error");
}
export function liveVoiceActive(phase: NativeLiveVoicePhase) {
  return phase !== "idle" && phase !== "error";
}

export function createMobileLiveVoiceController(port: NativeLiveVoicePort | undefined) {
  let state: NativeLiveVoiceState = { phase: "idle" };
  let generation = 0;
  let abort: AbortController | null = null;
  let handle: NativeLiveVoiceHandle | null = null;
  const listeners = new Set<(state: NativeLiveVoiceState) => void>();
  const publish = (next: NativeLiveVoiceState) => { state = next; for (const listener of listeners) listener(next); };
  const end = async () => {
    generation += 1;
    abort?.abort();
    abort = null;
    const closing = handle;
    handle = null;
    publish({ phase: "idle" });
    await closing?.end().catch(() => undefined);
  };
  return {
    state: () => state,
    subscribe(listener: (state: NativeLiveVoiceState) => void) {
      listeners.add(listener); listener(state); return () => { listeners.delete(listener); };
    },
    end,
    async start(input: { token: string; conversationId: string; onConversationChanged(): void }) {
      if (!port || liveVoiceActive(state.phase)) return;
      const current = ++generation;
      const operation = new AbortController();
      abort = operation;
      publish({ phase: "connecting" });
      try {
        const connected = await port.start({
          ...input, signal: operation.signal,
          onState(next) {
            if (current !== generation || operation.signal.aborted) return;
            if (next.phase === "error" || next.phase === "idle") {
              operation.abort(); const closing = handle; handle = null;
              void closing?.end().catch(() => undefined);
            }
            publish(next);
          },
          onConversationChanged() { if (current === generation && !operation.signal.aborted) input.onConversationChanged(); },
        });
        if (current !== generation || operation.signal.aborted) { await connected.end(); return; }
        if (state.phase === "error" || state.phase === "idle") {
          await connected.end(); abort = null; return;
        }
        handle = connected;
        if (state.phase === "connecting") publish({ phase: "listening" });
      } catch {
        if (current !== generation || operation.signal.aborted) return;
        operation.abort(); abort = null; handle = null;
        publish({ phase: "error" });
      }
    },
  };
}

const copy = {
  en: ["Start live voice", "End voice", "Connecting…", "Listening", "Hermes is working", "Speaking", "Voice could not connect. You can keep typing or try again."],
  de: ["Live-Gespräch starten", "Gespräch beenden", "Verbinden…", "Ich höre zu", "Hermes arbeitet", "Spricht", "Das Sprachgespräch ist nicht verfügbar. Du kannst schreiben oder es erneut versuchen."],
  fr: ["Démarrer la conversation vocale", "Terminer", "Connexion…", "À l’écoute", "Hermes travaille", "Parle", "La conversation vocale est indisponible. Vous pouvez écrire ou réessayer."],
  es: ["Iniciar conversación de voz", "Terminar", "Conectando…", "Escuchando", "Hermes está trabajando", "Hablando", "La voz no está disponible. Puedes escribir o volver a intentarlo."],
  it: ["Avvia conversazione vocale", "Termina", "Connessione…", "In ascolto", "Hermes sta lavorando", "Parla", "La voce non è disponibile. Puoi scrivere o riprovare."],
  "pt-BR": ["Iniciar conversa por voz", "Encerrar", "Conectando…", "Ouvindo", "Hermes está trabalhando", "Falando", "A voz está indisponível. Você pode escrever ou tentar novamente."],
  ja: ["音声会話を開始", "終了", "接続中…", "聞いています", "Hermesが作業中", "話しています", "音声会話を利用できません。入力するか、もう一度お試しください。"],
  ko: ["음성 대화 시작", "종료", "연결 중…", "듣고 있어요", "Hermes가 작업 중이에요", "말하고 있어요", "음성 대화를 사용할 수 없습니다. 입력하거나 다시 시도하세요."],
} satisfies Record<AppLocale, string[]>;

export function liveVoiceCopy(locale: AppLocale, phase: NativeLiveVoicePhase) {
  const text = copy[locale];
  const index = { idle: 3, connecting: 2, listening: 3, waiting: 4, speaking: 5, error: 6 }[phase];
  return { start: text[0]!, end: text[1]!, status: text[index]! };
}
