import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  chatRunEventFromHermesEvent,
  createHomechatEventStreamDecoder,
  heyActivityStepText,
  heyDelegatedActivityDurationText,
  heyDelegatedActivityTimeline,
  heySteadyLineDecision,
  heySteadyLineMinMs,
  isTerminalHomechatEvent,
  type AppLocale,
  type ChatRunEvent,
} from "../core/index";
import { useMobilePalette } from "./mobile-palette-context";
import { delegatedStreamChunkText, mergeDelegatedRunEvents } from "./mobile-delegated-run-events";

type StreamResponse = Pick<Response, "body" | "ok" | "status" | "text">;

export type MobileDelegatedRunEventsOpen = (
  runId: string,
  cursor: string | null,
  signal?: AbortSignal,
) => Promise<StreamResponse>;

/**
 * HPD-876. One status line that stays at least 1.2 seconds before the next
 * one replaces it, so three tools in a second read as the newest one rather
 * than as flicker.
 */
export function useSteadyLine(text: string | null, minMs = heySteadyLineMinMs): string | null {
  const [shown, setShown] = useState<string | null>(text);
  const stateRef = useRef({ shown: text, shownAt: Date.now() });
  const latestRef = useRef(text);
  latestRef.current = text;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const decide = () => {
      timer = null;
      const now = Date.now();
      const decision = heySteadyLineDecision(stateRef.current, latestRef.current, now, minMs);
      if (decision.change) {
        stateRef.current = { shown: latestRef.current, shownAt: now };
        setShown(latestRef.current);
      } else if (decision.waitMs > 0) {
        timer = setTimeout(decide, decision.waitMs);
      }
    };
    decide();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [text, minMs]);
  return shown;
}

const maxHeldEvents = 2_000;

/**
 * HPD-874. The delegated run's events, replayed from the start and then live.
 * The plane replays a finished run and closes; a running one stays open and
 * is reopened from the last event id when the connection drops.
 */
export function useDelegatedRunEvents(
  runId: string | null,
  live: boolean,
  open: MobileDelegatedRunEventsOpen,
  // HPD-874 (reopened): the events of this run the chat already holds from
  // its own observation of it -- its stream, or its polling where streaming
  // is unavailable. The timeline shows them even when its own stream brings
  // nothing on the device.
  knownEvents: readonly ChatRunEvent[] = noKnownEvents,
): ChatRunEvent[] {
  const [events, setEvents] = useState<ChatRunEvent[]>([]);
  const eventsRef = useRef<ChatRunEvent[]>([]);
  const runIdRef = useRef(runId);
  runIdRef.current = runId;
  const liveRef = useRef(live);
  liveRef.current = live;
  const openRef = useRef(open);
  openRef.current = open;
  const add = (incoming: readonly ChatRunEvent[], forRunId: string | null) => {
    const merged = mergeDelegatedRunEvents(eventsRef.current, incoming, forRunId, maxHeldEvents);
    if (!merged) return;
    eventsRef.current = merged;
    setEvents(merged);
  };

  useEffect(() => {
    eventsRef.current = [];
    setEvents([]);
    if (!runId) return;
    let cancelled = false;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cursor: string | null = null;

    const connect = async () => {
      // Never two streams for one timeline: the previous one is closed before
      // the next opens. Before, a stream that failed on the device stayed open
      // while a new one was opened every three seconds.
      controller?.abort();
      controller = new AbortController();
      let terminal = false;
      const take = (parsed: ReturnType<ReturnType<typeof createHomechatEventStreamDecoder>["push"]>) => {
        if (parsed.cursor) cursor = parsed.cursor;
        const incoming: ChatRunEvent[] = [];
        for (const canonical of parsed.events) {
          if (isTerminalHomechatEvent(canonical)) terminal = true;
          const event = chatRunEventFromHermesEvent(canonical);
          if (event) incoming.push(event);
        }
        if (!cancelled) add(incoming, runId);
      };
      try {
        const response = await openRef.current(runId, cursor, controller.signal);
        if (response.ok) {
          const decoder = createHomechatEventStreamDecoder({ cursor });
          const reader = response.body?.getReader?.();
          if (reader) {
            const text = typeof TextDecoder === "function" ? new TextDecoder() : null;
            while (!cancelled) {
              const chunk = await reader.read();
              if (chunk.done) break;
              take(decoder.push(delegatedStreamChunkText(chunk.value, text)));
              if (terminal) break;
            }
          } else {
            take(decoder.push(await response.text()));
          }
          take(decoder.finish());
        }
      } catch {
        // A dropped stream is reopened below; the timeline keeps what it has.
      }
      if (!cancelled && !terminal && liveRef.current) {
        controller?.abort();
        timer = setTimeout(() => void connect(), 3_000);
      }
    };
    void connect();
    return () => {
      cancelled = true;
      controller?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [runId]);

  // After the reset above, so a new run starts with what the chat holds.
  useEffect(() => {
    if (runId) add(knownEvents, runId);
  }, [runId, knownEvents]);
  return events;
}

const noKnownEvents: readonly ChatRunEvent[] = [];

type TimelineCopy = {
  title: string;
  show: string;
  hide: string;
  omitted: (count: number) => string;
  running: string;
  failed: string;
  /** Phase 2. The collapsed thinking block of one model call. */
  thinking: string;
  /** Phase 2. Shown under a step whose result excerpt is collapsed. */
  showResult: string;
};

const timelineCopy: Readonly<Record<AppLocale, TimelineCopy>> = {
  en: { title: "Steps", show: "Show steps", hide: "Hide steps", omitted: (n) => `${n} earlier steps not shown`, running: "running", failed: "failed", thinking: "Thinking", showResult: "Show result" },
  de: { title: "Arbeitsschritte", show: "Schritte zeigen", hide: "Schritte ausblenden", omitted: (n) => `${n} frühere Schritte ausgeblendet`, running: "läuft", failed: "fehlgeschlagen", thinking: "Denkschritte", showResult: "Ergebnis zeigen" },
  fr: { title: "Étapes", show: "Afficher les étapes", hide: "Masquer les étapes", omitted: (n) => `${n} étapes antérieures masquées`, running: "en cours", failed: "échec", thinking: "Réflexion", showResult: "Afficher le résultat" },
  es: { title: "Pasos", show: "Mostrar pasos", hide: "Ocultar pasos", omitted: (n) => `${n} pasos anteriores ocultos`, running: "en curso", failed: "falló", thinking: "Razonamiento", showResult: "Mostrar resultado" },
  it: { title: "Passaggi", show: "Mostra passaggi", hide: "Nascondi passaggi", omitted: (n) => `${n} passaggi precedenti nascosti`, running: "in corso", failed: "non riuscito", thinking: "Ragionamento", showResult: "Mostra risultato" },
  "pt-BR": { title: "Etapas", show: "Mostrar etapas", hide: "Ocultar etapas", omitted: (n) => `${n} etapas anteriores ocultas`, running: "em andamento", failed: "falhou", thinking: "Raciocínio", showResult: "Mostrar resultado" },
  ja: { title: "作業ステップ", show: "ステップを表示", hide: "ステップを隠す", omitted: (n) => `以前の${n}ステップは非表示`, running: "実行中", failed: "失敗", thinking: "思考", showResult: "結果を表示" },
  ko: { title: "작업 단계", show: "단계 보기", hide: "단계 숨기기", omitted: (n) => `이전 ${n}단계 숨김`, running: "진행 중", failed: "실패", thinking: "생각", showResult: "결과 보기" },
};

/** Collapsed, a sub thread shows this many newest entries. */
const collapsedEntryCount = 6;

/**
 * HPD-874. The background task's steps in its own sub thread: tool by display
 * name, duration, ok or failed, and the model's own progress notes.
 *
 * Phase 2 (Justus, 24.09.2026, "Ja, gefiltert"): a step also shows its
 * filtered target on the same line and its short filtered result collapsed
 * under it; mail, Google, finance and secret steps show a count only. Each
 * model call's thinking is one collapsed block. All of it is plain text the
 * guest and the plane have filtered; nothing here is rendered as markup.
 */
export function MobileDelegatedActivityTimeline({
  locale,
  runId,
  live,
  open,
  knownEvents,
}: {
  locale: AppLocale;
  runId: string | null;
  live: boolean;
  open: MobileDelegatedRunEventsOpen;
  /** HPD-874: the run's events the chat already holds (stream or polling). */
  knownEvents?: readonly ChatRunEvent[];
}) {
  const palette = useMobilePalette();
  const events = useDelegatedRunEvents(runId, live, open, knownEvents);
  const timeline = useMemo(() => heyDelegatedActivityTimeline(events), [events]);
  const [expanded, setExpanded] = useState(false);
  const [openKeys, setOpenKeys] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = (key: string) => setOpenKeys((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
  const copy = timelineCopy[locale] ?? timelineCopy.en;
  if (!runId || !timeline.entries.length) return null;

  const hiddenByCollapse = expanded ? 0 : Math.max(0, timeline.entries.length - collapsedEntryCount);
  const visible = timeline.entries.slice(hiddenByCollapse);
  const omitted = timeline.omitted + hiddenByCollapse;

  return (
    <View style={[styles.container, { borderColor: palette.line }]} accessibilityLabel={copy.title}>
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel={expanded ? copy.hide : copy.show}
        style={styles.header}
      >
        <Text style={[styles.title, { color: palette.ink }]}>{copy.title}</Text>
        <Text style={[styles.toggle, { color: palette.teal }]}>{expanded ? copy.hide : copy.show}</Text>
      </Pressable>
      {omitted > 0 ? (
        <Text style={[styles.omitted, { color: palette.muted }]}>{copy.omitted(omitted)}</Text>
      ) : null}
      {visible.map((entry) => {
        if (entry.kind === "reasoning") {
          const thoughtOpen = openKeys.has(entry.key);
          return (
            <Pressable
              key={entry.key}
              onPress={() => toggle(entry.key)}
              accessibilityRole="button"
              accessibilityState={{ expanded: thoughtOpen }}
              accessibilityLabel={copy.thinking}
            >
              <Text style={[styles.thinkingTitle, { color: palette.muted }]}>
                {thoughtOpen ? "▾" : "▸"} {copy.thinking}
              </Text>
              {thoughtOpen ? (
                <Text style={[styles.thinking, { color: palette.muted }]} selectable>
                  {entry.text}
                </Text>
              ) : null}
            </Pressable>
          );
        }
        if (entry.kind === "note") {
          const noteOpen = openKeys.has(entry.key);
          return (
            <Pressable
              key={entry.key}
              onPress={() => toggle(entry.key)}
              accessibilityRole="button"
            >
              <Text
                style={[styles.note, { color: palette.muted }]}
                numberOfLines={noteOpen ? undefined : 2}
                ellipsizeMode="tail"
              >
                {entry.text}
              </Text>
            </Pressable>
          );
        }
        const label = heyActivityStepText({ verbKey: entry.verbKey, toolKey: entry.toolKey }, locale) ?? "";
        const duration = heyDelegatedActivityDurationText(entry.durationMs);
        const outcome = entry.state === "ok" ? "✓" : entry.state === "error" ? "✗" : "…";
        const outcomeColor = entry.state === "error" ? palette.coral : entry.state === "ok" ? palette.teal : palette.muted;
        const timing = entry.state === "error" ? copy.failed : entry.state === "running" ? copy.running : duration;
        const count = typeof entry.resultCount === "number" ? String(entry.resultCount) : null;
        const trailing = [count, timing].filter(Boolean).join(" · ");
        const preview = entry.confidential ? null : entry.resultPreview ?? null;
        const previewOpen = preview ? openKeys.has(entry.key) : false;
        const row = (
          <View style={styles.step}>
            <Text style={[styles.outcome, { color: outcomeColor }]}>{outcome}</Text>
            <Text style={[styles.stepLabel, { color: palette.ink }]} numberOfLines={1} ellipsizeMode="tail">
              {label}
              {entry.target ? <Text style={{ color: palette.muted }}>{` · ${entry.target}`}</Text> : null}
            </Text>
            {trailing ? <Text style={[styles.duration, { color: palette.muted }]}>{trailing}</Text> : null}
          </View>
        );
        if (!preview) return <View key={entry.key}>{row}</View>;
        return (
          <Pressable
            key={entry.key}
            onPress={() => toggle(entry.key)}
            accessibilityRole="button"
            accessibilityState={{ expanded: previewOpen }}
            accessibilityHint={copy.showResult}
          >
            {row}
            <Text
              style={[styles.preview, { color: palette.muted }]}
              numberOfLines={previewOpen ? undefined : 1}
              ellipsizeMode="tail"
            >
              {previewOpen ? preview : copy.showResult}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    gap: 6,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 28 },
  title: { fontSize: 13, fontWeight: "600" },
  toggle: { fontSize: 13, fontWeight: "500" },
  omitted: { fontSize: 12 },
  step: { flexDirection: "row", alignItems: "center", gap: 8 },
  outcome: { width: 14, fontSize: 13, textAlign: "center" },
  stepLabel: { flexShrink: 1, fontSize: 13 },
  duration: { marginLeft: "auto", fontSize: 12, fontVariant: ["tabular-nums"] },
  note: { fontSize: 13, lineHeight: 18, paddingLeft: 22 },
  preview: { fontSize: 12, lineHeight: 17, paddingLeft: 22, paddingTop: 2 },
  thinkingTitle: { fontSize: 12, fontWeight: "500", paddingLeft: 22 },
  thinking: { fontSize: 12, lineHeight: 17, paddingLeft: 22, paddingTop: 2, fontStyle: "italic" },
});
