import type { AppLocale } from "../core/types";

export type NativeLiveVoicePhase = "idle" | "connecting" | "listening" | "waiting" | "speaking" | "ending" | "error";
/** HPD-1041: the voice time limit that ended or refused a call. */
export type NativeLiveVoiceLimit = "call_limit" | "daily_limit";
export type NativeLiveVoiceState = { phase: NativeLiveVoicePhase; endedReason?: NativeLiveVoiceLimit };
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
  type Operation = { abort: AbortController; handle: NativeLiveVoiceHandle | null;
    opening: Promise<void>; closing: Promise<void> | null; terminal: NativeLiveVoiceState };
  let operation: Operation | null = null;
  const listeners = new Set<(state: NativeLiveVoiceState) => void>();
  const publish = (next: NativeLiveVoiceState) => { state = next; for (const listener of listeners) listener(next); };
  const close = (current: Operation, terminal: NativeLiveVoiceState) => {
    current.terminal = terminal;
    current.abort.abort();
    if (current.closing) return current.closing;
    publish({ phase: "ending" });
    current.closing = (async () => {
      // A cancelled handshake can still return a handle. Keep ownership until
      // that handle and its cleanup have finished, before permitting Start.
      await current.opening;
      await current.handle?.end().catch(() => { current.terminal = { phase: "error" }; });
      current.handle = null;
      if (operation === current) { operation = null; publish(current.terminal); }
    })();
    return current.closing;
  };
  const end = () => operation ? close(operation, { phase: "idle" }) : Promise.resolve();
  return {
    state: () => state,
    subscribe(listener: (state: NativeLiveVoiceState) => void) {
      listeners.add(listener); listener(state); return () => { listeners.delete(listener); };
    },
    end,
    async start(input: { token: string; conversationId: string; onConversationChanged(): void }) {
      if (!port || operation || liveVoiceActive(state.phase)) return;
      const current: Operation = { abort: new AbortController(), handle: null,
        opening: Promise.resolve(), closing: null, terminal: { phase: "idle" } };
      operation = current;
      publish({ phase: "connecting" });
      // Defer port entry so even a synchronous terminal callback observes the
      // assigned opening promise and cannot release ownership too early.
      current.opening = Promise.resolve().then(async () => {
        try {
          if (current.abort.signal.aborted) return;
          current.handle = await port.start({
            ...input, signal: current.abort.signal,
            onState(next) {
              if (operation !== current || current.abort.signal.aborted) return;
              if (next.phase === "error" || next.phase === "idle") {
                void close(current, next);
              } else publish(next);
            },
            onConversationChanged() { if (operation === current && !current.abort.signal.aborted) input.onConversationChanged(); },
          });
          if (!current.abort.signal.aborted && operation === current && state.phase === "connecting") publish({ phase: "listening" });
        } catch (error) {
          // HPD-1041: a start refused by the daily voice limit says so.
          const limit = (error as { limit?: unknown } | null)?.limit;
          const reason = limit === "daily_limit" || limit === "call_limit" ? { endedReason: limit as NativeLiveVoiceLimit } : {};
          if (operation === current && !current.abort.signal.aborted) void close(current, { phase: "error", ...reason });
        }
      });
      await current.opening;
      await current.closing;
    },
  };
}

const copy = {
  en: ["Start live voice", "End voice", "Connecting…", "Listening", "Hermes is working", "Speaking", "Voice could not connect. You can keep typing or try again.", "Ending…"],
  de: ["Live-Gespräch starten", "Gespräch beenden", "Verbinden…", "Ich höre zu", "Hermes arbeitet", "Spricht", "Das Sprachgespräch ist nicht verfügbar. Du kannst schreiben oder es erneut versuchen.", "Beenden…"],
  fr: ["Démarrer la conversation vocale", "Terminer", "Connexion…", "À l’écoute", "Hermes travaille", "Parle", "La conversation vocale est indisponible. Vous pouvez écrire ou réessayer.", "Fermeture…"],
  es: ["Iniciar conversación de voz", "Terminar", "Conectando…", "Escuchando", "Hermes está trabajando", "Hablando", "La voz no está disponible. Puedes escribir o volver a intentarlo.", "Terminando…"],
  it: ["Avvia conversazione vocale", "Termina", "Connessione…", "In ascolto", "Hermes sta lavorando", "Parla", "La voce non è disponibile. Puoi scrivere o riprovare.", "Chiusura…"],
  "pt-BR": ["Iniciar conversa por voz", "Encerrar", "Conectando…", "Ouvindo", "Hermes está trabalhando", "Falando", "A voz está indisponível. Você pode escrever ou tentar novamente.", "Encerrando…"],
  ja: ["音声会話を開始", "終了", "接続中…", "聞いています", "Hermesが作業中", "話しています", "音声会話を利用できません。入力するか、もう一度お試しください。", "終了中…"],
  ko: ["음성 대화 시작", "종료", "연결 중…", "듣고 있어요", "Hermes가 작업 중이에요", "말하고 있어요", "음성 대화를 사용할 수 없습니다. 입력하거나 다시 시도하세요.", "종료 중…"],
} satisfies Record<AppLocale, string[]>;

// HPD-1041: [call limit reached, daily voice time used up].
const limitCopy = {
  en: ["The voice call reached its time limit. You can keep typing or start a new call.", "Today's voice time is used up. You can keep typing; voice is available again tomorrow."],
  de: ["Das Sprachgespräch hat sein Zeitlimit erreicht. Du kannst schreiben oder ein neues Gespräch starten.", "Die Sprachzeit für heute ist aufgebraucht. Du kannst weiter schreiben; morgen geht Sprache wieder."],
  fr: ["La conversation vocale a atteint sa durée maximale. Vous pouvez écrire ou en démarrer une nouvelle.", "Le temps vocal du jour est épuisé. Vous pouvez continuer à écrire ; la voix revient demain."],
  es: ["La conversación de voz alcanzó su límite de tiempo. Puedes escribir o iniciar una nueva.", "El tiempo de voz de hoy se ha agotado. Puedes seguir escribiendo; la voz vuelve mañana."],
  it: ["La conversazione vocale ha raggiunto il limite di tempo. Puoi scrivere o avviarne una nuova.", "Il tempo vocale di oggi è esaurito. Puoi continuare a scrivere; la voce torna domani."],
  "pt-BR": ["A conversa por voz atingiu o limite de tempo. Você pode escrever ou iniciar uma nova.", "O tempo de voz de hoje acabou. Você pode continuar escrevendo; a voz volta amanhã."],
  ja: ["音声会話が時間の上限に達しました。入力を続けるか、新しい会話を開始できます。", "今日の音声時間を使い切りました。入力は引き続き使えます。音声は明日また使えます。"],
  ko: ["음성 대화가 시간 제한에 도달했습니다. 계속 입력하거나 새 대화를 시작할 수 있어요.", "오늘의 음성 시간을 모두 사용했습니다. 계속 입력할 수 있고, 음성은 내일 다시 사용할 수 있어요."],
} satisfies Record<AppLocale, string[]>;

/** The notice shown under the composer after a call, or null. */
export function liveVoiceNotice(locale: AppLocale, state: NativeLiveVoiceState): string | null {
  if (state.endedReason) return limitCopy[locale][state.endedReason === "daily_limit" ? 1 : 0]!;
  return state.phase === "error" ? liveVoiceCopy(locale, "error").status : null;
}

export function liveVoiceCopy(locale: AppLocale, phase: NativeLiveVoicePhase) {
  const text = copy[locale];
  const index = { idle: 3, connecting: 2, listening: 3, waiting: 4, speaking: 5, ending: 7, error: 6 }[phase];
  return { start: text[0]!, end: text[1]!, status: text[index]! };
}
