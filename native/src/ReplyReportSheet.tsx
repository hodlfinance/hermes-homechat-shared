import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { X } from "lucide-react-native";
import type { AppLocale, ChatMessage } from "../core/index";
import {
  buildSupportRequestUserInput,
  supportReplyEmailPrefill,
  supportReplyEmailRelayUser,
  supportRequestCopy,
  supportRequestFailureMessage,
  supportRequestProblemErrorMessage,
  type SupportRequestClient,
  type SupportSignedInProjection,
} from "../core/support-request";
import {
  HEY_REPLY_REPORT_NOTE_MAX_LENGTH,
  HEY_REPLY_REPORT_REASONS,
  heyReplyReportCopy,
  heyReplyReportProblem,
  type HeyReplyReportReason,
} from "./hey-reply-report";
import { useMobilePalette } from "./mobile-palette-context";

/**
 * HPD-1243 F3: the report sheet for one Hermes reply (Android, launch switch
 * on). It sends through the given support client, the same one the support
 * form uses; the composed text names the reply and never contains it. The
 * Android back button closes it (onRequestClose).
 */
export function MobileReplyReportSheet({
  locale,
  message,
  client,
  replyEmailFallback,
  onClose,
}: {
  locale: AppLocale;
  message: ChatMessage;
  client: SupportRequestClient;
  replyEmailFallback?: string | null;
  onClose: () => void;
}) {
  const palette = useMobilePalette();
  const copy = heyReplyReportCopy(locale);
  const support = supportRequestCopy(locale);
  const [reason, setReason] = useState<HeyReplyReportReason>("offensive");
  const [note, setNote] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [projection, setProjection] = useState<SupportSignedInProjection | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "sending" | "sent">("loading");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void client.loadSignedInProjection().then((result) => {
      if (cancelled) return;
      if (result.status === "ready") {
        setProjection(result.projection);
        setReplyEmail(supportReplyEmailPrefill(result.projection.replyChannel, replyEmailFallback).value);
      } else {
        setError(supportRequestFailureMessage(result.reason, locale));
      }
      setPhase("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [client, locale, replyEmailFallback]);

  const relayUser = projection ? supportReplyEmailRelayUser(projection.replyChannel, replyEmailFallback) : false;
  const needsReplyEmail = projection?.replyChannel.kind === "reply_email_required" || relayUser;
  const sending = phase === "sending";

  async function send() {
    if (!projection || sending) return;
    const built = buildSupportRequestUserInput({
      problem: heyReplyReportProblem({
        reason,
        messageId: message.id,
        conversationId: message.conversationSessionId,
        runId: message.runId,
        messageCreatedAt: message.createdAt,
        note,
      }),
      replyEmail: needsReplyEmail ? replyEmail : "",
      projection,
      requireNonRelayReplyEmail: relayUser,
    });
    if (!built.ok) {
      setError(
        built.error.field === "problem"
          ? supportRequestProblemErrorMessage(built.error, locale)
          : built.error.reason === "reply_email_required"
            ? support.requiredEmail
            : built.error.reason === "reply_email_apple_relay"
              ? support.appleRelayHint
              : support.invalidEmail,
      );
      return;
    }
    setError(null);
    setPhase("sending");
    const result = await client.submit(built.value);
    if (result.status === "success") {
      setReference(result.reference);
      setPhase("sent");
      return;
    }
    setError(supportRequestFailureMessage(result.reason, locale));
    setPhase("ready");
  }

  const inputStyle = {
    minHeight: 44,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: palette.ink,
    fontSize: 16,
  } as const;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: palette.pageBg }} accessibilityViewIsModal>
        <View style={{ padding: 24, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text accessibilityRole="header" style={{ flex: 1, color: palette.ink, fontSize: 22, lineHeight: 28, fontWeight: "600" }}>{copy.action}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={copy.close}
            style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }}>
            <X size={22} color={palette.ink} accessible={false} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8, gap: 16 }} keyboardShouldPersistTaps="handled">
          {phase === "loading" ? <ActivityIndicator color={palette.teal} /> : null}
          {phase === "sent" ? (
            <View style={{ gap: 12 }} accessibilityLiveRegion="polite">
              <Text style={{ color: palette.ink, fontSize: 17, lineHeight: 25 }}>{copy.sent}</Text>
              {reference ? <Text selectable style={{ color: palette.muted, fontSize: 15 }}>{support.reference} {reference}</Text> : null}
              <Pressable onPress={onClose} accessibilityRole="button" style={{ minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: palette.teal }}>
                <Text style={{ color: palette.surface, fontSize: 17, fontWeight: "600" }}>{copy.close}</Text>
              </Pressable>
            </View>
          ) : phase !== "loading" ? (
            <>
              <Text style={{ color: palette.ink, fontSize: 17, fontWeight: "600" }}>{copy.reasonLabel}</Text>
              <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
                {HEY_REPLY_REPORT_REASONS.map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setReason(value)}
                    disabled={sending}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: reason === value, disabled: sending }}
                    style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12 }}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: palette.teal, alignItems: "center", justifyContent: "center" }}>
                      {reason === value ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: palette.teal }} /> : null}
                    </View>
                    <Text style={{ flex: 1, color: palette.ink, fontSize: 17 }}>{copy.reasons[value]}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={copy.noteLabel}
                placeholderTextColor={palette.muted}
                accessibilityLabel={copy.noteLabel}
                editable={!sending}
                multiline
                maxLength={HEY_REPLY_REPORT_NOTE_MAX_LENGTH}
                style={[inputStyle, { minHeight: 88, textAlignVertical: "top" }]}
              />
              {needsReplyEmail ? (
                <TextInput
                  value={replyEmail}
                  onChangeText={setReplyEmail}
                  placeholder={support.replyEmail}
                  placeholderTextColor={palette.muted}
                  accessibilityLabel={support.replyEmail}
                  editable={!sending}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={inputStyle}
                />
              ) : null}
              <Text style={{ color: palette.secondary, fontSize: 14, lineHeight: 20 }}>{copy.boundary}</Text>
              {error ? <Text accessibilityRole="alert" style={{ color: palette.coral, fontSize: 15, lineHeight: 21 }}>{error}</Text> : null}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable onPress={onClose} accessibilityRole="button" disabled={sending}
                  style={{ flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: palette.line }}>
                  <Text style={{ color: palette.ink, fontSize: 17 }}>{copy.cancel}</Text>
                </Pressable>
                <Pressable onPress={() => void send()} accessibilityRole="button" disabled={sending || !projection}
                  accessibilityState={{ disabled: sending || !projection, busy: sending }}
                  style={{ flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: palette.teal, opacity: sending || !projection ? 0.5 : 1 }}>
                  {sending ? <ActivityIndicator color={palette.surface} /> : <Text style={{ color: palette.surface, fontSize: 17, fontWeight: "600" }}>{copy.send}</Text>}
                </Pressable>
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
