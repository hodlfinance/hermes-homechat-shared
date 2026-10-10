import { createContext, useContext, useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "../core/api-client";
import { browserTakeoverCardCopy, browserTakeoverCardIsNewest, browserTakeoverCardState, type BrowserTakeoverCardState } from "../core/browser-takeover-card";
import type { AppLocale } from "../core/types";
import { palette } from "./mobile-palette";

/** HPD-1097: what a card needs from the surface: the status read and how to open the link. */
export type BrowserTakeoverCardHost = {
  status: (sessionId: string) => Promise<{ controlOwner?: string; handedBack?: boolean }>;
  open: (href: string) => void;
};

export const BrowserTakeoverCardContext = createContext<BrowserTakeoverCardHost | null>(null);
/** HPD-1146: browser session id -> id of the newest transcript message with a card for it. */
export const BrowserTakeoverNewestContext = createContext<ReadonlyMap<string, string>>(new Map());


/** The "Computer" card for Hermes' browser takeover link (spec 3.1). */
export function BrowserTakeoverCard({ task, href, sessionId, locale, messageId }:
  { task: string; href: string; sessionId: string; locale: AppLocale; messageId?: string }) {
  const host = useContext(BrowserTakeoverCardContext);
  const copy = browserTakeoverCardCopy(locale);
  // HPD-1146: an older card of the same session is settled for good; it neither reads nor opens.
  const newest = useContext(BrowserTakeoverNewestContext);
  const superseded = !browserTakeoverCardIsNewest(newest, sessionId, messageId);
  const [polled, setState] = useState<BrowserTakeoverCardState>("open");
  const state: BrowserTakeoverCardState = superseded ? "done" : polled;
  useEffect(() => {
    if (!host || superseded) return;
    // Reads only while the app is in front, and stops once the card is done or ended.
    let active = true, settled = false, timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
      if (active && !settled && AppState.currentState === "active") timer = setTimeout(read, 5000);
    };
    const read = async () => {
      timer = undefined;
      if (!active || settled || AppState.currentState !== "active") return;
      let next: BrowserTakeoverCardState;
      try { next = browserTakeoverCardState(200, await host.status(sessionId)); }
      catch (error) { next = error instanceof ApiError ? browserTakeoverCardState(error.status, null) : "open"; }
      if (!active) return;
      setState(next);
      settled = next !== "open";
      schedule();
    };
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && !timer && !settled) void read();
      else if (state !== "active" && timer) { clearTimeout(timer); timer = undefined; }
    });
    void read();
    return () => { active = false; subscription.remove(); if (timer) clearTimeout(timer); };
  }, [host, sessionId, superseded]);
  const ended = state === "ended";
  return (
    <View style={styles.card} accessibilityLabel={`${copy.title}: ${task}`}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.task}>{task}</Text>
      <Text style={styles.notice}>{copy.notice}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: ended || superseded }}
        disabled={ended || superseded}
        onPress={() => host?.open(href)}
        style={({ pressed }) => [styles.button, (ended || superseded) && styles.buttonEnded, pressed && !ended && !superseded && styles.buttonPressed]}
      >
        <Text style={[styles.buttonText, (ended || superseded) && styles.buttonTextEnded]}>
          {ended ? copy.ended : state === "done" ? copy.done : copy.open}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: 6, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.lineStrong,
    backgroundColor: palette.surface, padding: 14, gap: 6 },
  title: { fontSize: 13, fontWeight: "700", color: palette.muted, letterSpacing: 0.3 },
  task: { fontSize: 16, fontWeight: "600", color: palette.ink },
  notice: { fontSize: 13, lineHeight: 18, color: palette.muted },
  button: { alignSelf: "flex-start", marginTop: 4, borderRadius: 12, backgroundColor: palette.accent, paddingHorizontal: 16, paddingVertical: 10 },
  buttonPressed: { opacity: 0.75 },
  buttonEnded: { backgroundColor: palette.tealSoft },
  buttonText: { color: palette.accentText, fontSize: 15, fontWeight: "700" },
  buttonTextEnded: { color: palette.muted },
});
