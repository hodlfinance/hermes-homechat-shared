import { useState } from "react";
import { Linking, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { ChevronDown, ChevronRight, ExternalLink, X } from "lucide-react-native";
import type { AppLocale } from "../core/index";
import { HEY_LEGAL_LINKS } from "../core/legal";
import { workspacePrivacyCopy, workspacePrivacyHasServer } from "../ui/workspace-privacy-copy";
import { useWorkspacePrivacyIdentity, type PrivacyIdentityClient } from "../ui/workspace-privacy-identity";
import { palette } from "./mobile-palette";
export function MobilePrivacySheet({ client, workspaceId, locale, onClose }: { client: PrivacyIdentityClient; workspaceId: string; locale: AppLocale; onClose: () => void }) {
  const identity = useWorkspacePrivacyIdentity(client, workspaceId);
  const [expanded, setExpanded] = useState(false);
  const server = workspacePrivacyHasServer(identity, workspaceId) ? identity : null;
  const copy = workspacePrivacyCopy(locale, Boolean(server));
  const rows = [[copy.provider, server?.provider], [copy.serverId, server?.serverId], [copy.ip, server?.publicIpv4], [copy.location, server?.location], [copy.serverType, server?.serverType]];
  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: palette.pageBg }} accessibilityViewIsModal>
      <View style={{ padding: 24, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text accessibilityRole="header" style={{ flex: 1, color: palette.ink, fontSize: 24, lineHeight: 30, fontWeight: "600" }}>{copy.title}</Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={copy.close}
          style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }}>
          <X size={22} color={palette.ink} accessible={false} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8, gap: 16 }}>
        <Text style={{ color: palette.text, fontSize: 17, lineHeight: 25 }}>{copy.body}</Text>
        <Text style={{ color: palette.secondary, fontSize: 14, lineHeight: 20 }}>{copy.support}</Text>
        <Pressable onPress={() => setExpanded(!expanded)} accessibilityRole="button" accessibilityState={{ expanded }} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ flex: 1, color: palette.teal, fontSize: 17 }}>{copy.details}</Text>
          {expanded ? <ChevronDown size={20} color={palette.teal} accessible={false} /> : <ChevronRight size={20} color={palette.teal} accessible={false} />}
        </Pressable>
        {expanded ? <View style={{ gap: 12, borderLeftColor: palette.accent, borderLeftWidth: 2, paddingLeft: 12 }}>{rows.map(([label, value]) => <View key={label}>
          <Text style={{ color: palette.muted, fontSize: 13 }}>{label}</Text><Text selectable style={{ color: palette.ink, fontSize: 17 }}>{value || copy.unavailable}</Text>
        </View>)}</View> : null}
        <Pressable onPress={() => void Linking.openURL(HEY_LEGAL_LINKS.privacy)} accessibilityRole="link" style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ flex: 1, color: palette.teal, fontSize: 17 }}>{copy.policy}</Text>
          <ExternalLink size={20} color={palette.teal} accessible={false} />
        </Pressable>
      </ScrollView>
    </View>
  </Modal>;
}
