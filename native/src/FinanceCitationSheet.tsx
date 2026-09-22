import { ExternalLink, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { AppLocale } from "../core/index";
import { useMobilePalette } from "./mobile-palette-context";
import { mobileFinanceCitationDate, type MobileFinanceCitation } from "./mobile-finance-artifacts";

// HPD-808: what a tap on [n] in a CapChat answer opens. A page sheet, so the
// conversation stays where it was underneath and closing returns the reader to
// the same place. It shows only what the reference carries; a reference with
// no text never gets here, its tap opens the page directly.
export function FinanceCitationSheet({
  citation,
  locale,
  onClose,
  onOpenUrl,
}: {
  citation: MobileFinanceCitation;
  locale: AppLocale;
  onClose: () => void;
  onOpenUrl: (url: string) => void;
}) {
  const palette = useMobilePalette();
  const publishedAt = mobileFinanceCitationDate(citation.publishedAt, locale);
  const byline = [citation.publisher, publishedAt].filter(Boolean).join(" · ");
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: palette.pageBg }} accessibilityViewIsModal>
        <View style={{ padding: 24, paddingBottom: 8, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <Text style={{ minWidth: 28, color: palette.teal, fontSize: 17, lineHeight: 26, fontWeight: "600" }}>
            [{citation.number}]
          </Text>
          <Text accessibilityRole="header" style={{ flex: 1, color: palette.ink, fontSize: 20, lineHeight: 26, fontWeight: "600" }}>
            {citation.title}
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
          {citation.text ? (
            <Text selectable style={{ color: palette.text, fontSize: 17, lineHeight: 25 }}>{citation.text}</Text>
          ) : null}
          {citation.url ? (
            <Pressable
              accessibilityLabel={`Open original: ${citation.title}`}
              accessibilityRole="link"
              onPress={() => onOpenUrl(citation.url!)}
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
