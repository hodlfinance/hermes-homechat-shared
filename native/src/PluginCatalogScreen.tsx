import { connectionUiMessage } from "../core/connection-ui-copy";
import type { AppLocale } from "../core/index";
import { staticUiCopy, staticUiMessage } from "./static-ui-copy";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Circle, Path, Svg } from "react-native-svg";
import type {
  PluginCatalogAction,
  PluginCatalogItem,
  PluginCatalogView,
  PluginConnectionStatus,
} from "../core/plugin-catalog";
import { pluginCatalogLabels, pluginCatalogSearchResults, pluginCatalogSections } from "../core/plugin-catalog-view";
import { palette } from "./mobile-palette";
import { officialConnectionMarkSource } from "./mobile-connection-marks";
import { MobileAiAccessBrandMark } from "./mobile-ai-access-brand-marks";

export type AiAccessAccountConnection = Readonly<{
  description: string;
  label: string;
  provider: "chatgpt_account" | "claude_account";
  status: string;
}>;

export type { PluginCatalogScreenCopy } from "./plugin-catalog-copy";
import type { PluginCatalogScreenCopy } from "./plugin-catalog-copy";

const defaultCopy: PluginCatalogScreenCopy = { ...pluginCatalogLabels };

const featuredConnectionOrder = ["gmail", "telegram", "calendar", "google_drive", "whatsapp"] as const;
const featuredConnectionRank = new Map<string, number>(featuredConnectionOrder.map((id, index) => [id, index]));

function externalConnectionCatalog(catalog: PluginCatalogView): PluginCatalogView {
  const items = catalog.items
    .filter((item) => item.mechanism === "hey_connector" || item.mechanism === "mcp" || item.mechanism === "messaging_adapter" || item.mechanism === "guided_chat")
    .map((item, sourceIndex) => ({ item, sourceIndex }))
    .sort((left, right) => {
      const leftRank = featuredConnectionRank.get(left.item.id);
      const rightRank = featuredConnectionRank.get(right.item.id);
      if (leftRank !== undefined || rightRank !== undefined) {
        return (leftRank ?? Number.MAX_SAFE_INTEGER) - (rightRank ?? Number.MAX_SAFE_INTEGER);
      }
      return left.sourceIndex - right.sourceIndex;
    })
    .map(({ item }) => item);
  return { ...catalog, items };
}

function visiblePluginCatalogAction(item: PluginCatalogItem): PluginCatalogAction | null {
  return item.actions[0] ?? null;
}

function askHermes(
  onAskHermes: ((prefilledMessage: string, item?: PluginCatalogItem) => void) | undefined,
  prefilledMessage: string,
  item?: PluginCatalogItem,
) {
  onAskHermes?.(prefilledMessage, item);
}

function messagingSetupPrefill(item: PluginCatalogItem, locale: AppLocale) {
  return item.connectionSetup ? connectionUiMessage(locale, "Help me set up {name}.", { name: item.name }) : null;
}

export function PluginCatalogScreen({
  locale = "en",
  aiAccessConnections = [],
  catalog,
  copy,
  busyActionKey = null,
  focusItemId = null,
  notice = null,
  onOpenAiAccessConnection,
  onAction,
  onAskHermes,
  onFocusItemHandled,
  onOpenSource: _onOpenSource,
  renderConnectionSetup,
}: {
  locale?: AppLocale;
  aiAccessConnections?: readonly AiAccessAccountConnection[];
  catalog: PluginCatalogView;
  copy?: Partial<PluginCatalogScreenCopy>;
  busyActionKey?: string | null;
  focusItemId?: string | null;
  notice?: string | null;
  onOpenAiAccessConnection?: (provider: AiAccessAccountConnection["provider"]) => void;
  onAction: (item: PluginCatalogItem, action: PluginCatalogAction) => void;
  onAskHermes?: (prefilledMessage: string, item?: PluginCatalogItem) => void;
  onFocusItemHandled?: () => void;
  onOpenSource: (url: string) => void;
  renderConnectionSetup?: (item: PluginCatalogItem) => ReactNode;
}) {
  const resolvedCopy = {
    ...defaultCopy,
    ...copy,
    actionLabels: { ...defaultCopy.actionLabels, ...copy?.actionLabels },
    items: { ...defaultCopy.items, ...copy?.items },
    statusDetails: { ...defaultCopy.statusDetails, ...copy?.statusDetails },
    statusLabels: { ...defaultCopy.statusLabels, ...copy?.statusLabels },
    connectionStatusLabels: { ...defaultCopy.connectionStatusLabels, ...copy?.connectionStatusLabels },
  };
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleAiAccessConnections = aiAccessConnections.filter((connection) => !normalizedQuery || [
    connection.label,
    connection.description,
    connection.status,
  ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)));
  const externalCatalog = useMemo(() => externalConnectionCatalog(catalog), [catalog]);
  const localizedCatalog = useMemo<PluginCatalogView>(() => ({
    ...externalCatalog,
    items: externalCatalog.items.map((item) => {
      const itemCopy = resolvedCopy.items[item.id];
      return {
        ...item,
        description: itemCopy?.description ?? item.description,
        permissions: itemCopy?.permissions ?? item.permissions,
        searchTerms: itemCopy?.searchTerms ?? item.searchTerms,
        setupHint: itemCopy?.setupHint ?? item.setupHint,
        actions: item.actions.map((action) => ({
          ...action,
          label: resolvedCopy.actionLabels[action.id] ?? action.label,
        })),
      };
    }),
  }), [externalCatalog, resolvedCopy.actionLabels, resolvedCopy.items]);
  const searchResults = useMemo(() => pluginCatalogSearchResults(externalCatalog, query, locale), [externalCatalog, query, locale]);
  const sections = useMemo(
    () => pluginCatalogSections({
      ...localizedCatalog,
      items: searchResults.flatMap((result) => result.kind === "connection"
        ? [localizedCatalog.items.find((item) => item.id === result.item.id) ?? result.item]
        : []),
    }, "", { yours: resolvedCopy.yours, catalog: resolvedCopy.all }),
    [localizedCatalog, searchResults, resolvedCopy.all, resolvedCopy.yours],
  );
  const askHermesResult = visibleAiAccessConnections.length === 0 && searchResults.length === 1 && searchResults[0]?.kind === "ask_hermes"
    ? searchResults[0]
    : null;
  const selected = selectedId ? localizedCatalog.items.find((item) => item.id === selectedId) ?? null : null;
  const selectedSetup = selected ? renderConnectionSetup?.(selected) ?? null : null;

  function handleConnectionAction(item: PluginCatalogItem, action: PluginCatalogAction) {
    onAction(item, action);
  }

  useEffect(() => {
    if (!focusItemId || !localizedCatalog.items.some((item) => item.id === focusItemId)) return;
    setQuery("");
    setSelectedId(focusItemId);
    onFocusItemHandled?.();
  }, [focusItemId, localizedCatalog.items, onFocusItemHandled]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{resolvedCopy.title}</Text>
      <Text style={styles.description}>{resolvedCopy.description}</Text>
      {catalog.availability === "partial" ? (
        <Text accessibilityLiveRegion="polite" style={styles.partialStatus}>{resolvedCopy.partialStatus}</Text>
      ) : null}
      <TextInput
        accessibilityLabel={resolvedCopy.searchPlaceholder}
        onChangeText={setQuery}
        placeholder={resolvedCopy.searchPlaceholder}
        placeholderTextColor={palette.muted}
        style={styles.search}
        value={query}
      />
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{staticUiMessage(locale, notice)}</Text> : null}
      <View style={styles.content}>
        {visibleAiAccessConnections.length ? (
          <View style={styles.section}>
            {visibleAiAccessConnections.map((connection) => (
              <AiAccessConnectionRow
                connection={connection}
                key={connection.provider}
                onOpen={onOpenAiAccessConnection}
              />
            ))}
          </View>
        ) : null}
        {askHermesResult ? (
          <View style={styles.section}>
            <View style={[styles.row, styles.rowSeparator]}>
              <View style={styles.rowCopy}><Text style={styles.rowTitle}>{askHermesResult.label}</Text></View>
              <Pressable
                accessibilityRole="button"
                disabled={!onAskHermes}
                onPress={() => askHermes(onAskHermes, askHermesResult.prefilledMessage)}
                style={({ pressed }) => [styles.action, (pressed || !onAskHermes) && styles.actionDimmed]}
              >
                <Text style={styles.actionText}>{staticUiCopy(locale)["Ask Hermes"]}</Text>
              </Pressable>
            </View>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.section}>
            <Text style={styles.empty}>{resolvedCopy.empty}</Text>
          </View>
        ) : sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <PluginRow
                busyActionKey={busyActionKey}
                connectionStatusLabels={resolvedCopy.connectionStatusLabels}
                item={item}
                key={`${section.id}-${item.id}`}
                onAction={handleConnectionAction}
                onOpen={() => setSelectedId(item.id)}
                workingLabel={resolvedCopy.working}
              />
            ))}
          </View>
        ))}
      </View>
      <Modal animationType="slide" onRequestClose={() => setSelectedId(null)} transparent visible={Boolean(selected)}>
        <View style={styles.backdrop}>
          {selected ? (
            <View accessibilityViewIsModal style={styles.sheet}>
              <Pressable accessibilityRole="button" onPress={() => setSelectedId(null)} style={styles.close}>
                <Text style={styles.closeText}>{resolvedCopy.close}</Text>
              </Pressable>
              <ScrollView contentContainerStyle={styles.sheetContent}>
                <View style={styles.detailTitle}>
                  <PluginIcon item={selected} />
                  <View><Text style={styles.detailName}>{selected.name}</Text><Text style={statusStyle(selected)}>{resolvedCopy.connectionStatusLabels[selected.connectionStatus] ?? selected.statusLabel}</Text></View>
                </View>
                {selectedSetup ? selectedSetup : (
                  <>
                    <Text style={styles.body}>{selected.description}</Text>
                    <View style={styles.detailBlock}><Text style={styles.detailLabel}>{resolvedCopy.setup}</Text><Text style={styles.body}>{selected.setupHint}</Text></View>
                    <Text style={styles.muted}>{selected.statusDetail}</Text>
                    <View style={styles.actions}>
                      <PluginCatalogActionButton
                        busyActionKey={busyActionKey}
                        item={selected}
                        onAction={handleConnectionAction}
                        workingLabel={resolvedCopy.working}
                      />
                      {messagingSetupPrefill(selected, locale) ? (
                        <Pressable
                          accessibilityRole="button"
                          disabled={!onAskHermes}
                          onPress={() => askHermes(onAskHermes, messagingSetupPrefill(selected, locale) ?? "", selected)}
                          style={({ pressed }) => [styles.secondaryAction, (pressed || !onAskHermes) && styles.actionDimmed]}
                        >
                          <Text style={styles.secondaryActionText}>{staticUiCopy(locale)["Ask Hermes"]}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function AiAccessConnectionRow({
  connection,
  onOpen,
}: {
  connection: AiAccessAccountConnection;
  onOpen?: (provider: AiAccessAccountConnection["provider"]) => void;
}) {
  return (
    <View style={[styles.row, styles.rowSeparator]}>
      <Pressable
        accessibilityLabel={`${connection.label}. ${connection.status}`}
        accessibilityRole="button"
        disabled={!onOpen}
        onPress={() => onOpen?.(connection.provider)}
        style={({ pressed }) => [styles.aiAccessRow, (pressed || !onOpen) && styles.actionDimmed]}
      >
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.icon}>
          <MobileAiAccessBrandMark
            brand={connection.provider === "chatgpt_account" ? "openai" : "anthropic"}
            size={40}
          />
        </View>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>{connection.label}</Text>
          <Text numberOfLines={2} style={styles.muted}>{connection.description}</Text>
        </View>
        <Text numberOfLines={2} style={[styles.status, styles.statusAvailable]}>{connection.status}</Text>
      </Pressable>
    </View>
  );
}

function PluginRow({
  item,
  busyActionKey,
  connectionStatusLabels,
  onOpen,
  onAction,
  workingLabel,
}: {
  item: PluginCatalogItem;
  busyActionKey: string | null;
  connectionStatusLabels: Partial<Record<PluginConnectionStatus, string>>;
  onOpen: () => void;
  onAction: (item: PluginCatalogItem, action: PluginCatalogAction) => void;
  workingLabel: string;
}) {
  return (
    <View style={[styles.row, styles.rowSeparator]}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.rowMain}>
        <PluginIcon item={item} />
        <View style={styles.rowCopy}><Text style={styles.rowTitle}>{item.name}</Text><Text numberOfLines={2} style={styles.muted}>{item.description}</Text></View>
      </Pressable>
      <View style={styles.statusCell}><Text numberOfLines={2} style={statusStyle(item)}>{connectionStatusLabels[item.connectionStatus] ?? item.statusLabel}</Text></View>
      <View style={styles.actionCell}>
        <PluginCatalogActionButton
          busyActionKey={busyActionKey}
          item={item}
          onAction={onAction}
          workingLabel={workingLabel}
        />
      </View>
    </View>
  );
}

function PluginCatalogActionButton({
  busyActionKey,
  item,
  onAction,
  workingLabel,
}: {
  busyActionKey: string | null;
  item: PluginCatalogItem;
  onAction: (item: PluginCatalogItem, action: PluginCatalogAction) => void;
  workingLabel: string;
}) {
  const action = visiblePluginCatalogAction(item);
  if (!action) return null;
  const isBusy = busyActionKey === `${item.id}:${action.operationId}`;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isBusy}
      onPress={() => onAction(item, action)}
      style={({ pressed }) => [styles.action, (pressed || isBusy) && styles.actionDimmed]}
    >
      <Text style={styles.actionText}>{isBusy ? workingLabel : action.label}</Text>
    </Pressable>
  );
}

function PluginIcon({ item }: { item: PluginCatalogItem }) {
  const markSource = officialConnectionMarkSource(item.id);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.icon}>
      {markSource ? (
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={markSource}
          style={styles.officialMark}
        />
      ) : (
        <GenericConnectionIcon />
      )}
    </View>
  );
}

function GenericConnectionIcon() {
  return <Svg height={40} viewBox="0 0 40 40" width={40}><Circle cx={20} cy={20} fill={palette.violetSoft} r={20} /><Path d="M14 20h12M20 14v12" stroke={palette.ink} strokeLinecap="round" strokeWidth={2} /></Svg>;
}

function statusStyle(item: PluginCatalogItem) {
  if (item.connectionStatus === "connected") return [styles.status, styles.statusAdded];
  if (item.connectionStatus === "attention") return [styles.status, styles.statusAttention];
  if (item.connectionStatus === "authorization_required" || item.connectionStatus === "setup_incomplete") return [styles.status, styles.statusSetup];
  if (item.connectionStatus === "unknown") return [styles.status, styles.statusUnknown];
  if (item.connectionStatus === "unavailable") return [styles.status, styles.statusUnavailable];
  return [styles.status, styles.statusAvailable];
}
const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingTop: 14 },
  title: { color: palette.ink, fontSize: 22, lineHeight: 28, fontWeight: "600" },
  description: { color: palette.muted, fontSize: 15, marginTop: 4 },
  search: { backgroundColor: palette.tealSoft, borderColor: palette.lineStrong, borderRadius: 12, borderWidth: 1, color: palette.text, fontSize: 17, marginTop: 16, minHeight: 44, paddingHorizontal: 14, paddingVertical: 10 },
  notice: { backgroundColor: palette.amberSoft, borderColor: palette.line, borderRadius: 12, borderWidth: 1, color: palette.text, marginTop: 12, padding: 12 },
  partialStatus: { backgroundColor: palette.coralSoft, borderColor: palette.coral, borderRadius: 12, borderWidth: 1, color: palette.text, lineHeight: 20, marginTop: 12, padding: 12 },
  content: { gap: 18, paddingBottom: 32, paddingTop: 20 },
  section: { backgroundColor: palette.surface, borderColor: palette.line, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, gap: 0, overflow: "hidden" },
  sectionTitle: { color: palette.muted, fontSize: 13, fontWeight: "600", letterSpacing: 0.3, paddingBottom: 8, paddingHorizontal: 4, paddingTop: 12, textTransform: "uppercase" },
  empty: { color: palette.muted, paddingVertical: 10 },
  row: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 56, paddingHorizontal: 16, paddingVertical: 10 },
  rowSeparator: { borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth },
  rowMain: { alignItems: "center", flex: 1, flexDirection: "row", gap: 11 },
  aiAccessRow: { alignItems: "center", flex: 1, flexDirection: "row", gap: 11 },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { color: palette.ink, fontSize: 17, lineHeight: 22, fontWeight: "500" },
  statusCell: { alignItems: "flex-end", width: 92 },
  actionCell: { alignItems: "flex-end", width: 104 },
  icon: { alignItems: "center", height: 28, justifyContent: "center", width: 28 },
  officialMark: { height: 28, width: 28 },
  muted: { color: palette.muted, fontSize: 13 },
  status: { alignSelf: "flex-start", borderRadius: 999, fontSize: 13, fontWeight: "500", overflow: "hidden", paddingHorizontal: 9, paddingVertical: 5 },
  statusAdded: { backgroundColor: palette.greenSoft, color: palette.green },
  statusAttention: { backgroundColor: palette.coralSoft, color: palette.coral },
  statusSetup: { backgroundColor: palette.amberSoft, color: palette.amber },
  statusUnknown: { backgroundColor: palette.violetSoft, color: palette.muted },
  statusUnavailable: { backgroundColor: palette.coralSoft, color: palette.muted },
  statusAvailable: { backgroundColor: palette.tealSoft, color: palette.text },
  action: { alignItems: "center", backgroundColor: palette.accent, borderRadius: 9, minWidth: 88, paddingHorizontal: 12, paddingVertical: 8 },
  actionDimmed: { opacity: .55 },
  actionText: { color: palette.pageBg, fontWeight: "700" },
  secondaryAction: { alignItems: "center", borderColor: palette.line, borderRadius: 9, borderWidth: 1, minWidth: 88, paddingHorizontal: 12, paddingVertical: 8 },
  secondaryActionText: { color: palette.accentStrong, fontWeight: "700" },
  backdrop: { backgroundColor: "rgba(15,23,42,.42)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: palette.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "90%", paddingTop: 10 },
  close: { alignSelf: "flex-end", paddingHorizontal: 20, paddingVertical: 10 },
  closeText: { color: palette.accentStrong, fontWeight: "700" },
  sheetContent: { gap: 16, paddingBottom: 30, paddingHorizontal: 20 },
  detailTitle: { alignItems: "center", flexDirection: "row", gap: 12 },
  detailName: { color: palette.ink, fontSize: 22, lineHeight: 28, fontWeight: "600", marginBottom: 4 },
  body: { color: palette.text, fontSize: 14, lineHeight: 20 },
  detailBlock: { gap: 5 },
  detailLabel: { color: palette.ink, fontSize: 14, fontWeight: "700" },
  link: { color: palette.accentStrong, fontSize: 14, fontWeight: "600" },
  actions: { gap: 9 },
});
