import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import {
  UNAVAILABLE_SUPPORT_REQUEST_CLIENT,
  buildAnonymousSupportRequestUserInput,
  buildSupportRequestUserInput,
  normalizeSupportContextResult,
  normalizeSupportSubmissionResult,
  supportRequestCopy,
  supportRequestFailureMessage,
  supportRequestProblemErrorMessage,
  type SupportContextResult,
  type SupportRequestClient,
  type SupportRequestInputError,
  type SupportSubmissionResult,
} from "../core/support-request";
import { MobileSystemRow, MobileSystemSection, mobileSystemSurfaceMetrics } from "./mobile-system-surface";

const MOBILE_SUPPORT_EMAIL = "support@heyhermes.app";
const MOBILE_SUPPORT_MAILTO = "mailto:support@heyhermes.app?subject=Hey%20Hermes%20support";
const ANONYMOUS_SUPPORT_CONTEXT: SupportContextResult = {
  status: "ready",
  projection: {
    accountDisplay: "Signed-out support",
    replyChannel: { kind: "reply_email_required" },
  },
};

import type { AppLocale } from "../core/index";

export function MobileSupportRequestForm({
  client = UNAVAILABLE_SUPPORT_REQUEST_CLIENT,
  mode = "signed_in",
  locale = "en",
  onOpenFallback,
}: {
  client?: SupportRequestClient;
  mode?: "signed_in" | "anonymous";
  locale?: AppLocale;
  onOpenFallback?: (mailto: string) => void | Promise<void>;
}) {
  const copy = supportRequestCopy(locale);
  const requestGeneration = useRef(0);
  const [contextResult, setContextResult] = useState<SupportContextResult | null>(null);
  const [problem, setProblem] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [inputError, setInputError] = useState<SupportRequestInputError | null>(null);
  const [submission, setSubmission] = useState<SupportSubmissionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [supportEmailCopied, setSupportEmailCopied] = useState(false);
  const [referenceCopied, setReferenceCopied] = useState(false);
  const palette = useColorScheme() === "dark" ? darkPalette : lightPalette;

  const loadContext = useCallback(async () => {
    const generation = ++requestGeneration.current;
    setSubmitting(false);
    setContextResult(null);
    setSubmission(null);
    setInputError(null);
    if (mode === "anonymous") {
      setContextResult(ANONYMOUS_SUPPORT_CONTEXT);
      return;
    }
    try {
      const result = normalizeSupportContextResult(await client.loadSignedInProjection());
      if (requestGeneration.current === generation) setContextResult(result);
    } catch {
      if (requestGeneration.current === generation) {
        setContextResult({ status: "failure", reason: "unavailable" });
      }
    }
  }, [client, mode]);

  useEffect(() => {
    setProblem("");
    setReplyEmail("");
    void loadContext();
    return () => {
      requestGeneration.current += 1;
    };
  }, [loadContext]);

  function openFallback() {
    const opening = onOpenFallback
      ? onOpenFallback(MOBILE_SUPPORT_MAILTO)
      : Linking.openURL(MOBILE_SUPPORT_MAILTO);
    void Promise.resolve(opening).catch(() => undefined);
  }

  function copySupportEmail() {
    Clipboard.setString(MOBILE_SUPPORT_EMAIL);
    setSupportEmailCopied(true);
  }

  function startNewRequest() {
    setSubmission(null);
    setProblem("");
    setReplyEmail("");
    setInputError(null);
    setReferenceCopied(false);
  }

  async function submit() {
    if (submitting || contextResult?.status !== "ready") return;
    const userInput = mode === "anonymous"
      ? buildAnonymousSupportRequestUserInput({ problem, replyEmail })
      : buildSupportRequestUserInput({
          problem,
          replyEmail,
          projection: contextResult.projection,
          allowAlternateReplyEmail: contextResult.projection.replyChannel.kind === "verified_product_email",
        });
    if (!userInput.ok) {
      setInputError(userInput.error);
      return;
    }

    setInputError(null);
    setSubmission(null);
    setSubmitting(true);
    const generation = requestGeneration.current;
    try {
      const result = normalizeSupportSubmissionResult(await client.submit(userInput.value));
      if (requestGeneration.current === generation) setSubmission(result);
    } catch {
      if (requestGeneration.current === generation) {
        setSubmission({ status: "failure", reason: "unavailable", reference: null });
      }
    } finally {
      if (requestGeneration.current === generation) setSubmitting(false);
    }
  }

  if (!contextResult) {
    return (
      <MobileSystemSection title={copy.title}>
        <View
          style={styles.loadingRow}
          accessibilityLiveRegion="polite"
          accessibilityRole="progressbar"
          accessibilityState={{ busy: true }}
        >
          <ActivityIndicator color={palette.tint} />
          <Text style={[styles.muted, { color: palette.secondaryLabel }]} allowFontScaling>{copy.loading}</Text>
        </View>
      </MobileSystemSection>
    );
  }

  if (contextResult.status === "failure") {
    const contextError = supportRequestFailureMessage(contextResult.reason, locale);
    return (
      <MobileSystemSection title={copy.title}>
        <MobileSystemRow
          label={copy.retry}
          error={contextError}
          onPress={() => void loadContext()}
        />
        <MobileSystemRow
          label={`${copy.email} ${MOBILE_SUPPORT_EMAIL}`}
          accessibilityRole="link"
          onPress={openFallback}
        />
        <MobileSystemRow
          label={copy.copyEmail}
          onPress={copySupportEmail}
          status={supportEmailCopied ? copy.copied : null}
          separator={false}
        />
        {supportEmailCopied ? (
          <Text style={[styles.copyFeedback, { color: palette.secondaryLabel }]} accessibilityLiveRegion="polite" allowFontScaling>{copy.emailCopied}</Text>
        ) : null}
      </MobileSystemSection>
    );
  }

  const projection = contextResult.projection;
  const replyEmailError = inputError?.field === "replyEmail";
  const problemError = inputError?.field === "problem";
  const submissionError = submission?.status === "failure"
    ? supportRequestFailureMessage(submission.reason, locale)
    : null;
  const submitLabel = submission?.status === "failure" ? copy.retryRequest : copy.sendRequest;
  const requestAccepted = submission?.status === "success";

  if (requestAccepted) {
    return (
      <MobileSystemSection title={copy.title}>
        <View style={styles.receipt} accessibilityLiveRegion="polite">
          <Text style={[styles.label, { color: palette.label }]} allowFontScaling>{copy.accepted}</Text>
          <Text style={[styles.body, { color: palette.label }]} allowFontScaling>{copy.keepReference}</Text>
          <Text style={[styles.reference, { color: palette.label }]} selectable allowFontScaling>{submission.reference}</Text>
          <View style={styles.inlineActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.copyReference}
              onPress={() => {
                Clipboard.setString(submission.reference);
                setReferenceCopied(true);
              }}
              style={({ pressed }) => [styles.smallAction, pressed && styles.smallActionPressed]}
            >
              <Text style={[styles.smallActionText, { color: palette.tint }]} allowFontScaling>{referenceCopied ? copy.copied : copy.copyReference}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.newRequest}
              onPress={startNewRequest}
              style={({ pressed }) => [styles.smallAction, pressed && styles.smallActionPressed]}
            >
              <Text style={[styles.smallActionText, { color: palette.tint }]} allowFontScaling>{copy.newRequest}</Text>
            </Pressable>
          </View>
        </View>
      </MobileSystemSection>
    );
  }

  const submitDisabled = submitting;

  return (
    <MobileSystemSection title={copy.title}>
      <View style={styles.insetBlock}>
        <Text style={[styles.muted, { color: palette.secondaryLabel }]} allowFontScaling>{copy.subtitle}</Text>
      </View>

      {mode === "signed_in" ? (
        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.label }]} allowFontScaling>{copy.account}</Text>
          <Text style={[styles.value, { color: palette.label }]} selectable allowFontScaling>{projection.accountDisplay}</Text>
          <Text style={[styles.muted, { color: palette.secondaryLabel }]} allowFontScaling>{copy.sessionSource}</Text>
        </View>
      ) : null}

      {projection.replyChannel.kind === "verified_product_email" ? (
        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.label }]} allowFontScaling>{copy.verifiedEmail}</Text>
          <Text style={[styles.value, { color: palette.label }]} allowFontScaling>{projection.replyChannel.display}</Text>
          <Text style={[styles.muted, { color: palette.secondaryLabel }]} allowFontScaling>{copy.sessionSource}</Text>
          <Text style={[styles.label, { color: palette.label }]} allowFontScaling>{copy.alternateEmail}</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: palette.input, borderColor: replyEmailError ? palette.error : palette.separator, color: palette.label },
            ]}
            value={replyEmail}
            onChangeText={setReplyEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={!submitDisabled}
            accessibilityLabel={copy.alternateEmail}
            accessibilityHint={copy.alternateHint}
            accessibilityState={{ disabled: submitDisabled }}
            allowFontScaling
          />
          {replyEmailError ? (
            <Text style={[styles.error, { color: palette.error }]} accessibilityRole="alert" accessibilityLiveRegion="polite" allowFontScaling>{copy.invalidEmail}</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.label }]} allowFontScaling>{copy.replyEmail}</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: palette.input, borderColor: replyEmailError ? palette.error : palette.separator, color: palette.label },
            ]}
            value={replyEmail}
            onChangeText={setReplyEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={!submitDisabled}
            accessibilityLabel={copy.replyEmail}
            accessibilityState={{ disabled: submitDisabled }}
            allowFontScaling
          />
          {replyEmailError ? (
            <Text style={[styles.error, { color: palette.error }]} accessibilityRole="alert" accessibilityLiveRegion="polite" allowFontScaling>
              {inputError.reason === "reply_email_invalid" ? copy.invalidEmail : copy.requiredEmail}
            </Text>
          ) : null}
        </View>
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { color: palette.label }]} allowFontScaling>{copy.problem}</Text>
        <TextInput
          style={[
            styles.input,
            styles.problemInput,
            { backgroundColor: palette.input, borderColor: problemError ? palette.error : palette.separator, color: palette.label },
          ]}
          value={problem}
          onChangeText={setProblem}
          maxLength={4_000}
          multiline
          textAlignVertical="top"
          editable={!submitDisabled}
          accessibilityLabel={copy.problemLabel}
          accessibilityHint={copy.problemHint}
          accessibilityState={{ disabled: submitDisabled }}
          allowFontScaling
        />
        {problemError ? (
          <Text style={[styles.error, { color: palette.error }]} accessibilityRole="alert" accessibilityLiveRegion="polite" allowFontScaling>
            {supportRequestProblemErrorMessage(inputError, locale)}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.boundary, { color: palette.secondaryLabel }]} allowFontScaling>{copy.boundary}</Text>

      {submission?.status === "failure" && submission.reference ? (
        <Text style={[styles.reference, styles.referenceInset, { color: palette.label }]} selectable allowFontScaling>
          {copy.reference} {submission.reference}
        </Text>
      ) : null}

      <View style={styles.primaryButtonInset}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          accessibilityState={{ busy: submitting, disabled: submitDisabled }}
          disabled={submitDisabled}
          onPress={() => void submit()}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: palette.primaryBackground },
            pressed && styles.primaryButtonPressed,
            submitDisabled && styles.primaryButtonDisabled,
          ]}
        >
          {submitting ? <ActivityIndicator color={palette.primaryForeground} /> : null}
          <Text style={[styles.primaryButtonText, { color: palette.primaryForeground }]} allowFontScaling>
            {submitting ? copy.sending : submitLabel}
          </Text>
        </Pressable>
        {submissionError ? (
          <Text style={[styles.error, { color: palette.error }]} accessibilityRole="alert" accessibilityLiveRegion="polite" allowFontScaling>
            {submissionError}
          </Text>
        ) : null}
      </View>

      <MobileSystemRow
        label={`${copy.email} ${MOBILE_SUPPORT_EMAIL}`}
        accessibilityRole="link"
        onPress={openFallback}
        separator={false}
      />
      <View style={styles.copyEmailRow}>
        <Text style={[styles.muted, styles.copyEmailAddress, { color: palette.secondaryLabel }]} selectable allowFontScaling>
          {MOBILE_SUPPORT_EMAIL}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.copyEmail}
          onPress={copySupportEmail}
          style={({ pressed }) => [styles.smallAction, pressed && styles.smallActionPressed]}
        >
          <Text style={[styles.smallActionText, { color: palette.tint }]} allowFontScaling>{supportEmailCopied ? copy.copied : copy.copy}</Text>
        </Pressable>
      </View>
      {supportEmailCopied ? (
        <Text style={[styles.copyFeedback, { color: palette.secondaryLabel }]} accessibilityLiveRegion="polite" allowFontScaling>{copy.emailCopied}</Text>
      ) : null}
    </MobileSystemSection>
  );
}


const styles = StyleSheet.create({
  body: { fontSize: 16, lineHeight: 23 },
  muted: { fontSize: 14, lineHeight: 20 },
  insetBlock: {
    gap: 8,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingVertical: 8,
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: mobileSystemSurfaceMetrics.minimumTouchTarget,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
  },
  field: {
    gap: 7,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingVertical: 8,
  },
  label: { fontSize: 14, fontWeight: "700" },
  value: { fontSize: 16 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  problemInput: { minHeight: 150 },
  boundary: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingVertical: 8,
  },
  error: { fontSize: 14, lineHeight: 20 },
  reference: {
    fontSize: 16,
    fontWeight: "700",
  },
  referenceInset: {
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingVertical: 8,
  },
  receipt: {
    gap: 8,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingVertical: 12,
  },
  inlineActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  smallAction: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: mobileSystemSurfaceMetrics.minimumTouchTarget,
    paddingHorizontal: 12,
  },
  smallActionPressed: { opacity: 0.7 },
  smallActionText: { fontSize: 14, fontWeight: "700" },
  primaryButtonInset: {
    gap: 8,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingVertical: 10,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  primaryButtonPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  primaryButtonDisabled: { opacity: 0.52 },
  primaryButtonText: { fontSize: 17, fontWeight: "800" },
  copyEmailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingBottom: 8,
  },
  copyEmailAddress: { flex: 1 },
  copyFeedback: {
    fontSize: 13,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingBottom: 8,
  },
});

const lightPalette = Object.freeze({
  error: "#B42318",
  input: "#FFFFFF",
  label: "#000000",
  primaryBackground: "#005FCC",
  primaryForeground: "#FFFFFF",
  secondaryLabel: "#5C5C60",
  separator: "rgba(60, 60, 67, 0.29)",
  tint: "#007AFF",
});

const darkPalette = Object.freeze({
  error: "#FF6961",
  input: "#1C1C1E",
  label: "#FFFFFF",
  primaryBackground: "#66B2FF",
  primaryForeground: "#000000",
  secondaryLabel: "#AEAEB2",
  separator: "rgba(84, 84, 88, 0.65)",
  tint: "#0A84FF",
});
