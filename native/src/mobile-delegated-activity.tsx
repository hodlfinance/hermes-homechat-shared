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
): ChatRunEvent[] {
  const [events, setEvents] = useState<ChatRunEvent[]>([]);
  const liveRef = useRef(live);
  liveRef.current = live;
  useEffect(() => {
    setEvents([]);
    if (!runId) return;
    let cancelled = false;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cursor: string | null = null;
    const collected: ChatRunEvent[] = [];
    const ids = new Set<string>();

    const connect = async () => {
      controller = new AbortController();
      let terminal = false;
      const take = (parsed: ReturnType<ReturnType<typeof createHomechatEventStreamDecoder>["push"]>) => {
        if (parsed.cursor) cursor = parsed.cursor;
        let changed = false;
        for (const canonical of parsed.events) {
          if (isTerminalHomechatEvent(canonical)) terminal = true;
          const event = chatRunEventFromHermesEvent(canonical);
          if (!event || ids.has(event.id)) continue;
          ids.add(event.id);
          collected.push(event);
          changed = true;
        }
        if (collected.length > maxHeldEvents) collected.splice(0, collected.length - maxHeldEvents);
        if (changed && !cancelled) setEvents([...collected]);
      };
      try {
        const response = await open(runId, cursor, controller.signal);
        if (response.ok) {
          const decoder = createHomechatEventStreamDecoder({ cursor });
          const reader = response.body?.getReader?.();
          if (reader) {
            const text = new TextDecoder();
            while (!cancelled) {
              const chunk = await reader.read();
              if (chunk.done) break;
              take(decoder.push(text.decode(chunk.value, { stream: true })));
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
      if (!cancelled && !terminal && liveRef.current) timer = setTimeout(() => void connect(), 3_000);
    };
    void connect();
    return () => {
      cancelled = true;
      controller?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [runId, open]);
  return events;
}

type TimelineCopy = {
  title: string;
  show: string;
  hide: string;
  omitted: (count: number) => string;
  running: string;
  failed: string;
};

const timelineCopy: Readonly<Record<AppLocale, TimelineCopy>> = {
  en: { title: "Steps", show: "Show steps", hide: "Hide steps", omitted: (n) => `${n} earlier steps not shown`, running: "running", failed: "failed" },
  de: { title: "Arbeitsschritte", show: "Schritte zeigen", hide: "Schritte ausblenden", omitted: (n) => `${n} frühere Schritte ausgeblendet`, running: "läuft", failed: "fehlgeschlagen" },
  fr: { title: "Étapes", show: "Afficher les étapes", hide: "Masquer les étapes", omitted: (n) => `${n} étapes antérieures masquées`, running: "en cours", failed: "échec" },
  es: { title: "Pasos", show: "Mostrar pasos", hide: "Ocultar pasos", omitted: (n) => `${n} pasos anteriores ocultos`, running: "en curso", failed: "falló" },
  it: { title: "Passaggi", show: "Mostra passaggi", hide: "Nascondi passaggi", omitted: (n) => `${n} passaggi precedenti nascosti`, running: "in corso", failed: "non riuscito" },
  "pt-BR": { title: "Etapas", show: "Mostrar etapas", hide: "Ocultar etapas", omitted: (n) => `${n} etapas anteriores ocultas`, running: "em andamento", failed: "falhou" },
  ja: { title: "作業ステップ", show: "ステップを表示", hide: "ステップを隠す", omitted: (n) => `以前の${n}ステップは非表示`, running: "実行中", failed: "失敗" },
  ko: { title: "작업 단계", show: "단계 보기", hide: "단계 숨기기", omitted: (n) => `이전 ${n}단계 숨김`, running: "진행 중", failed: "실패" },
};

/** Collapsed, a sub thread shows this many newest entries. */
const collapsedEntryCount = 6;

/**
 * HPD-874, phase 1. The background task's steps in its own sub thread: tool
 * by display name, duration, ok or failed, and the model's own progress
 * notes. No tool input, no tool output, no reasoning.
 */
export function MobileDelegatedActivityTimeline({
  locale,
  runId,
  live,
  open,
}: {
  locale: AppLocale;
  runId: string | null;
  live: boolean;
  open: MobileDelegatedRunEventsOpen;
}) {
  const palette = useMobilePalette();
  const events = useDelegatedRunEvents(runId, live, open);
  const timeline = useMemo(() => heyDelegatedActivityTimeline(events), [events]);
  const [expanded, setExpanded] = useState(false);
  const [openNotes, setOpenNotes] = useState<ReadonlySet<string>>(() => new Set());
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
        if (entry.kind === "note") {
          const noteOpen = openNotes.has(entry.key);
          return (
            <Pressable
              key={entry.key}
              onPress={() => setOpenNotes((current) => {
                const next = new Set(current);
                if (next.has(entry.key)) next.delete(entry.key);
                else next.add(entry.key);
                return next;
              })}
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
        const trailing = entry.state === "error" ? copy.failed : entry.state === "running" ? copy.running : duration;
        return (
          <View key={entry.key} style={styles.step}>
            <Text style={[styles.outcome, { color: outcomeColor }]}>{outcome}</Text>
            <Text style={[styles.stepLabel, { color: palette.ink }]} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
            {trailing ? <Text style={[styles.duration, { color: palette.muted }]}>{trailing}</Text> : null}
          </View>
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
});
