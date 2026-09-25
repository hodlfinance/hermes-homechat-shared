import { ExternalLink, X } from "lucide-react-native";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { AppLocale } from "../core/index";
import { useMobilePalette } from "./mobile-palette-context";
import { mobileFinanceCitationDate, type MobileFinanceCitation, type MobileFinanceSourceDocument } from "./mobile-finance-artifacts";

// HPD-808: what a tap on [n] in a CapChat answer opens. A page sheet, so the
// conversation stays where it was underneath and closing returns the reader to
// the same place. Only a verified reader response supplies the body. Artifact
// snippets are never presented as a complete document.
export function FinanceCitationSheet({
  citation,
  document,
  phase,
  locale,
  onClose,
  onOpenUrl,
  onRetry,
}: {
  citation: MobileFinanceCitation;
  document: MobileFinanceSourceDocument | null;
  phase: "loading" | "ready" | "error";
  locale: AppLocale;
  onClose: () => void;
  onOpenUrl: (url: string) => void;
  onRetry: () => void;
}) {
  const palette = useMobilePalette();
  const publishedAt = mobileFinanceCitationDate(document?.publishedAt ?? citation.publishedAt, locale);
  const byline = [document?.publisher ?? citation.publisher, publishedAt].filter(Boolean).join(" · ");
  const originalUrl = document?.originalUrl ?? citation.url;
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: palette.pageBg }} accessibilityViewIsModal>
        <View style={{ padding: 24, paddingBottom: 8, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <Text style={{ minWidth: 28, color: palette.teal, fontSize: 17, lineHeight: 26, fontWeight: "600" }}>
            [{citation.number}]
          </Text>
          <Text accessibilityRole="header" style={{ flex: 1, color: palette.ink, fontSize: 20, lineHeight: 26, fontWeight: "600" }}>
            {document?.title ?? citation.title}
          </Text>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            onPress={onClose}
            style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center", marginTop: -9 }}
          >
            <X size={22} color={palette.ink} accessible={false} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 4, gap: 16 }}>
          {byline ? <Text style={{ color: palette.muted, fontSize: 14, lineHeight: 20 }}>{byline}</Text> : null}
          {phase === "loading" ? (
            <View accessibilityLabel="Loading full document" style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <ActivityIndicator color={palette.teal} />
              <Text style={{ color: palette.text, fontSize: 16 }}>Loading full document…</Text>
            </View>
          ) : phase === "error" ? (
            <View accessibilityRole="alert" style={{ gap: 12 }}>
              <Text style={{ color: palette.text, fontSize: 16 }}>The full document could not be loaded.</Text>
              <Pressable accessibilityLabel="Retry full document" accessibilityRole="button" onPress={onRetry} style={{ minHeight: 44, justifyContent: "center" }}>
                <Text style={{ color: palette.teal, fontSize: 17 }}>Try again</Text>
              </Pressable>
            </View>
          ) : document ? (
            <Text selectable style={{ color: palette.text, fontSize: 17, lineHeight: 25 }}>{document.body}</Text>
          ) : null}
          {originalUrl ? (
            <Pressable
              accessibilityLabel={`Open original: ${citation.title}`}
              accessibilityRole="link"
              onPress={() => onOpenUrl(originalUrl)}
              style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Text style={{ flex: 1, color: palette.teal, fontSize: 17 }}>Open original</Text>
              <ExternalLink size={20} color={palette.teal} accessible={false} />
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
