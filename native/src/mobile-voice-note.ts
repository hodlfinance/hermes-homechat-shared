export type MobileVoiceNotePhase =
  | "idle"
  | "recording"
  | "transcribing"
  | "transcription_failed"
  | "review"
  | "sending"
  | "send_failed";

export type MobileVoiceNoteSendAttempt = {
  content: string;
  idempotencyKey: string;
};

export type MobileVoiceNoteState = {
  error: string | null;
  phase: MobileVoiceNotePhase;
  recordingUri: string | null;
  sendAttempt: MobileVoiceNoteSendAttempt | null;
  transcript: string;
};

export type MobileVoiceNoteSendResult = "sent" | "queued" | "failed" | "ignored";

export type MobileVoiceNoteComposerAppendResult = {
  composerText: string;
  state: MobileVoiceNoteState;
};

export const initialMobileVoiceNoteState: MobileVoiceNoteState = Object.freeze({
  error: null,
  phase: "idle",
  recordingUri: null,
  sendAttempt: null,
  transcript: "",
});

export function mobileVoiceNoteRecordingStarted(): MobileVoiceNoteState {
  return {
    error: null,
    phase: "recording",
    recordingUri: null,
    sendAttempt: null,
    transcript: "",
  };
}

export function mobileVoiceNoteTranscriptionStarted(
  state: MobileVoiceNoteState,
  recordingUri: string,
): MobileVoiceNoteState {
  const uri = recordingUri.trim();
  if (!uri) {
    return {
      ...state,
      error: "No voice note audio was saved.",
      phase: "transcription_failed",
    };
  }
  return {
    ...state,
    error: null,
    phase: "transcribing",
    recordingUri: uri,
  };
}

export function mobileVoiceNoteTranscriptionRequested(
  state: MobileVoiceNoteState,
): MobileVoiceNoteState {
  return {
    ...state,
    error: null,
    phase: "transcribing",
  };
}

export function mobileVoiceNoteTranscriptionSucceeded(
  state: MobileVoiceNoteState,
  transcript: string,
): MobileVoiceNoteState {
  const text = transcript.trim();
  if (!text) {
    return mobileVoiceNoteTranscriptionFailed(state, "No speech was detected.");
  }
  return {
    ...state,
    error: null,
    phase: "review",
    sendAttempt: null,
    transcript: text,
  };
}

export function mobileVoiceNoteTranscriptionAppended(
  state: MobileVoiceNoteState,
  transcript: string,
  composerText: string,
): MobileVoiceNoteComposerAppendResult {
  if (state.phase !== "transcribing") return { composerText, state };

  const transcribed = mobileVoiceNoteTranscriptionSucceeded(state, transcript);
  if (transcribed.phase !== "review") return { composerText, state: transcribed };

  const separator = composerText && !/\s$/u.test(composerText) ? " " : "";
  return {
    composerText: `${composerText}${separator}${transcribed.transcript}`,
    state: initialMobileVoiceNoteState,
  };
}

/** @deprecated Retained only until the shared MobileApp hookup adopts composer append. */
export function mobileVoiceNoteTranscriptionSendStarted(
  state: MobileVoiceNoteState,
  transcript: string,
  contentForTranscript: (transcript: string) => string,
  createIdempotencyKey: () => string,
): { request: MobileVoiceNoteSendAttempt | null; state: MobileVoiceNoteState } {
  if (state.phase !== "transcribing") return { request: null, state };

  const transcribed = mobileVoiceNoteTranscriptionSucceeded(state, transcript);
  if (transcribed.phase !== "review") return { request: null, state: transcribed };

  return mobileVoiceNoteSendStarted(
    transcribed,
    contentForTranscript(transcribed.transcript),
    createIdempotencyKey,
  );
}

export function mobileVoiceNoteTranscriptionFailed(
  state: MobileVoiceNoteState,
  error: string,
): MobileVoiceNoteState {
  return {
    ...state,
    error: error.trim() || "Voice note could not be transcribed.",
    phase: "transcription_failed",
  };
}

export function mobileVoiceNoteTranscriptEdited(
  state: MobileVoiceNoteState,
  transcript: string,
): MobileVoiceNoteState {
  if (state.phase === "recording" || state.phase === "transcribing" || state.phase === "sending") {
    return state;
  }
  return {
    ...state,
    error: null,
    phase: transcript.trim() ? "review" : "transcription_failed",
    sendAttempt: null,
    transcript,
  };
}

export function mobileVoiceNoteSendStarted(
  state: MobileVoiceNoteState,
  content: string,
  createIdempotencyKey: () => string,
): { request: MobileVoiceNoteSendAttempt | null; state: MobileVoiceNoteState } {
  const message = content.trim();
  if (state.phase === "sending" || !state.recordingUri || !state.transcript.trim() || !message) {
    return { request: null, state };
  }
  const sendAttempt =
    state.phase === "send_failed" && state.sendAttempt?.content === message
      ? state.sendAttempt
      : { content: message, idempotencyKey: createIdempotencyKey() };
  return {
    request: sendAttempt,
    state: {
      ...state,
      error: null,
      phase: "sending",
      sendAttempt,
    },
  };
}

export function mobileVoiceNoteSendSettled(
  state: MobileVoiceNoteState,
  idempotencyKey: string,
  result: MobileVoiceNoteSendResult,
  error: string | null = null,
): MobileVoiceNoteState {
  if (state.phase !== "sending" || state.sendAttempt?.idempotencyKey !== idempotencyKey) return state;
  if (result === "sent" || result === "queued") return initialMobileVoiceNoteState;
  return {
    ...state,
    error: result === "failed" ? error?.trim() || "Voice note was not sent." : null,
    phase: result === "failed" ? "send_failed" : "review",
  };
}

export function mobileVoiceNoteDiscarded(): MobileVoiceNoteState {
  return initialMobileVoiceNoteState;
}

export function mobileVoiceNoteView(state: MobileVoiceNoteState) {
  const hasTranscript = Boolean(state.transcript.trim());
  return {
    canDiscard: !["idle", "sending", "transcribing"].includes(state.phase),
    canRetryTranscription: state.phase === "transcription_failed" && Boolean(state.recordingUri),
    canSend: (state.phase === "review" || state.phase === "send_failed") && hasTranscript,
    editable: state.phase === "review" || state.phase === "send_failed" || state.phase === "transcription_failed",
    sendLabel: state.phase === "send_failed" ? "Retry voice note" : "Send voice note",
    showReview: Boolean(state.recordingUri) && !["idle", "recording"].includes(state.phase),
  };
}
