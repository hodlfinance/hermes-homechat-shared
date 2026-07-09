import type { KeyboardEvent, ReactNode, Ref } from "react";

export type HomechatVoiceMeterMode = "recording" | "transcribing";

export type HomechatComposerClasses = Partial<{
  root: string;
  rootDisabled: string;
  rootVoiceWorking: string;
  inputShell: string;
  textarea: string;
  voiceMeter: string;
  voiceMeterRecording: string;
  voiceMeterTranscribing: string;
  voiceMeterBar: string;
}>;

export type HomechatComposerChromeProps = {
  ariaLabel: string;
  attachButton?: ReactNode;
  attachmentRow?: ReactNode;
  className?: string;
  classes?: HomechatComposerClasses;
  disabled?: boolean;
  fileInput?: ReactNode;
  inputDisabled?: boolean;
  onEnterSubmit?: () => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  readAloudButton?: ReactNode;
  rows?: number;
  sendButton?: ReactNode;
  textareaRef?: Ref<HTMLTextAreaElement>;
  value: string;
  voiceButton?: ReactNode;
  voiceControls?: ReactNode;
  voiceMeterActive?: boolean;
  voiceMeterMode?: HomechatVoiceMeterMode;
  voiceButtonPlacement?: "before-input" | "after-input";
  voiceWorking?: boolean;
};

export type HomechatMessageFrameClasses = Partial<{
  row: string;
  rowAssistant: string;
  rowUser: string;
  bubble: string;
  bubbleAssistant: string;
  bubbleUser: string;
  content: string;
  meta: string;
}>;

export type HomechatMessageFrameProps = {
  after?: ReactNode;
  children: ReactNode;
  className?: string;
  classes?: HomechatMessageFrameClasses;
  meta?: ReactNode;
  role: "assistant" | "user" | string;
};

const defaultClasses: Required<HomechatComposerClasses> = {
  root: "composer chat-composer",
  rootDisabled: "disabled",
  rootVoiceWorking: "voice-working",
  inputShell: "composer-input-shell",
  textarea: "",
  voiceMeter: "voice-recording-meter",
  voiceMeterRecording: "recording",
  voiceMeterTranscribing: "transcribing",
  voiceMeterBar: "",
};

const defaultMessageFrameClasses: Required<HomechatMessageFrameClasses> = {
  row: "message-row",
  rowAssistant: "assistant",
  rowUser: "user",
  bubble: "message",
  bubbleAssistant: "assistant",
  bubbleUser: "user",
  content: "message-content",
  meta: "message-meta",
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function HomechatVoiceMeter({
  classes,
  mode = "transcribing",
}: {
  classes?: HomechatComposerClasses;
  mode?: HomechatVoiceMeterMode;
}) {
  const merged = { ...defaultClasses, ...classes };
  return (
    <span
      aria-hidden
      className={classNames(
        merged.voiceMeter,
        mode === "recording" ? merged.voiceMeterRecording : merged.voiceMeterTranscribing,
      )}
    >
      <span className={classNames("h-3", merged.voiceMeterBar)} />
      <span className={classNames("h-5 [animation-delay:120ms]", merged.voiceMeterBar)} />
      <span className={classNames("h-4 [animation-delay:240ms]", merged.voiceMeterBar)} />
      <span className={classNames("h-2 [animation-delay:360ms]", merged.voiceMeterBar)} />
    </span>
  );
}

export function HomechatMessageFrame({
  after,
  children,
  className,
  classes,
  meta,
  role,
}: HomechatMessageFrameProps) {
  const merged = { ...defaultMessageFrameClasses, ...classes };
  const own = role === "user";
  const rowRoleClass = own ? merged.rowUser : merged.rowAssistant;
  const bubbleRoleClass = own ? merged.bubbleUser : merged.bubbleAssistant;

  return (
    <div className={classNames(merged.row, rowRoleClass, className)}>
      <div className={classNames(merged.bubble, bubbleRoleClass)}>
        <div className={merged.content}>{children}</div>
        {meta ? <div className={merged.meta}>{meta}</div> : null}
        {after}
      </div>
    </div>
  );
}

export function HomechatComposerChrome({
  ariaLabel,
  attachButton,
  attachmentRow,
  className,
  classes,
  disabled = false,
  fileInput,
  inputDisabled,
  onEnterSubmit,
  onValueChange,
  placeholder,
  readAloudButton,
  rows = 1,
  sendButton,
  textareaRef,
  value,
  voiceButton,
  voiceControls,
  voiceMeterActive = false,
  voiceMeterMode = "transcribing",
  voiceButtonPlacement = "before-input",
  voiceWorking = false,
}: HomechatComposerChromeProps) {
  const merged = { ...defaultClasses, ...classes };

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!onEnterSubmit || event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    onEnterSubmit();
  }

  return (
    <div
      className={classNames(
        merged.root,
        disabled && merged.rootDisabled,
        voiceWorking && merged.rootVoiceWorking,
        className,
      )}
    >
      {fileInput}
      {attachmentRow}
      {attachButton}
      {voiceButtonPlacement === "before-input" ? voiceButton : null}
      <div className={merged.inputShell}>
        <textarea
          ref={textareaRef}
          rows={rows}
          className={merged.textarea}
          disabled={inputDisabled ?? disabled}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
        />
        {voiceMeterActive ? (
          <HomechatVoiceMeter classes={merged} mode={voiceMeterMode} />
        ) : null}
      </div>
      {voiceButtonPlacement === "after-input" ? voiceButton : null}
      {readAloudButton}
      {sendButton}
      {voiceControls}
    </div>
  );
}
