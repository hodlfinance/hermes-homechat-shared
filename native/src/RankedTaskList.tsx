import type {
  RankedTaskCollection,
  RankedTaskSource,
  RankedTaskStatus,
  RankedTaskTime,
} from "../core/ranked-tasks";
import { palette } from "./mobile-palette";
import { Modal, StyleSheet, Text, View } from "react-native";
import { Pressable } from "react-native";
import { useRef, useState } from "react";
import {
  rankedTaskListView,
  rankedTaskCompletionSections,
  type RankedTaskListRow,
  type RankedTaskRowActionId,
} from "../core/ranked-task-list-view";
import { rankedTaskLastUpdatedText } from "./mobile-ranked-task-last-updated";

export interface RankedTaskListCopy {
  confirmComplete: string;
  confirmDismiss: string;
  cancel: string;
  showCompleted: string;
  hideCompleted: string;
  title: string;
  lastUpdated: string;
  notYetUpdated: string;
  inventoryLabel: string;
  empty: string;
  pendingTitle: string;
  rank: string;
  score: string;
  urgency: string;
  importance: string;
  nativeId: string;
  deadline: string;
  impliedTime: string;
  reviewTime: string;
  nativeStatuses: Readonly<Record<RankedTaskStatus, string>>;
  candidateStates: Readonly<Record<"suggested" | "dismissed", string>>;
  sourceNames: Readonly<Record<RankedTaskSource, string>>;
  refresh: string;
  refreshing: string;
  rowActions: Readonly<Record<RankedTaskRowActionId, string>>;
  about: string;
  aboutSentence: string;
  aboutClose: string;
}

export type RankedTaskListCopyOverrides = Partial<Omit<
  RankedTaskListCopy,
  "nativeStatuses" | "candidateStates" | "sourceNames" | "rowActions"
>> & {
  nativeStatuses?: Partial<Readonly<Record<RankedTaskStatus, string>>>;
  candidateStates?: Partial<Readonly<Record<"suggested" | "dismissed", string>>>;
  sourceNames?: Partial<Readonly<Record<RankedTaskSource, string>>>;
  rowActions?: Partial<Readonly<Record<RankedTaskRowActionId, string>>>;
};

const defaultCopy: RankedTaskListCopy = {
  confirmComplete: "Mark this task as done?",
  confirmDismiss: "Dismiss this task from the list?",
  cancel: "Cancel",
  showCompleted: "Show completed tasks",
  hideCompleted: "Hide completed tasks",
  title: "Tasks",
  lastUpdated: "Last updated",
  notYetUpdated: "Not updated yet",
  inventoryLabel: "Ranked task inventory",
  empty: "No tasks have been collected yet.",
  pendingTitle: "Not ranked yet",
  rank: "Rank",
  score: "Score",
  urgency: "Urgency",
  importance: "Importance",
  nativeId: "Kanban ID",
  deadline: "Deadline",
  impliedTime: "Implied time",
  reviewTime: "Review",
  nativeStatuses: {
    open: "Open",
    blocked: "Blocked",
    running: "Running",
    done: "Done",
    dismissed: "Dismissed",
  },
  candidateStates: {
    suggested: "Suggestion",
    dismissed: "Dismissed",
  },
  sourceNames: {
    kanban: "Kanban",
    email_triage: "Email",
    vault: "Vault",
    memory: "Memory",
  },
  refresh: "Refresh ranking",
  refreshing: "Refreshing…",
  rowActions: {
    complete: "Done",
    dismiss: "Dismiss",
    chat: "Chat",
  },
  about: "About this order",
  aboutSentence: "This order comes from the last ranking run over your Kanban tasks.",
  aboutClose: "Close",
};

function resolvedCopy(copy?: RankedTaskListCopyOverrides): RankedTaskListCopy {
  return {
    ...defaultCopy,
    ...copy,
    nativeStatuses: { ...defaultCopy.nativeStatuses, ...copy?.nativeStatuses },
    candidateStates: { ...defaultCopy.candidateStates, ...copy?.candidateStates },
    sourceNames: { ...defaultCopy.sourceNames, ...copy?.sourceNames },
    rowActions: { ...defaultCopy.rowActions, ...copy?.rowActions },
  };
}

/**
 * HPD-416: the row used to print the canonical instant the ranker stores -
 * "2026-08-23 08:00:00 UTC" - whatever language the account was set to. The
 * screen now hands in the account's own formatter; this fallback is only for a
 * caller that supplies none.
 */
export type RankedTaskInstantFormatter = (value: string) => string;

function displayInstant(value: string) {
  return value.replace("T", " ").replace(/\.000Z$/, " UTC");
}

function RankedTaskTimeLabel({
  time,
  copy,
  formatInstant,
}: {
  time: RankedTaskTime;
  copy: RankedTaskListCopy;
  formatInstant: RankedTaskInstantFormatter;
}) {
  if (time.kind === "evidenced") {
    return (
      <Text style={styles.time}>
        {copy.deadline}: {formatInstant(time.deadlineAt)} · {time.evidenceLabel}
      </Text>
    );
  }
  if (time.kind === "implied") {
    return <Text style={styles.time}>{copy.impliedTime}: {formatInstant(time.targetAt)}</Text>;
  }
  return <Text style={styles.time}>{copy.reviewTime}: {formatInstant(time.nextReviewAt)}</Text>;
}

// A finding from mail, the Vault, or a memory system has no Kanban status to
// show, so it says what it is instead: a suggestion, or one the customer put
// aside.
function statusLabel(row: RankedTaskListRow, copy: RankedTaskListCopy) {
  if (row.nativeStatus !== null) return copy.nativeStatuses[row.nativeStatus];
  // A finding the customer finished says the same word a finished card says.
  if (row.candidateState === "completed") return copy.nativeStatuses.done;
  return row.candidateState === "dismissed" ? copy.candidateStates.dismissed : copy.candidateStates.suggested;
}

function statusStyle(row: RankedTaskListRow) {
  if (row.nativeStatus === "blocked") return styles.statusBlocked;
  if (row.nativeStatus === "open" || row.nativeStatus === "running") return styles.statusActive;
  if (row.candidateState === "suggested") return styles.statusActive;
  return styles.statusTerminal;
}

export type RankedTaskRowHandlers = Readonly<{
  onComplete?: (row: RankedTaskListRow) => void;
  onDismiss?: (row: RankedTaskListRow) => void;
  onChat?: (row: RankedTaskListRow) => void;
}>;

/**
 * The same three buttons on every row: Done, Dismiss, Chat. Not a set that grows
 * and shrinks with the row's reminder state, and never an empty one - a customer
 * who has learnt one row has learnt them all.
 */
function RankedTaskRowActions({
  row,
  copy,
  handlers,
}: {
  row: RankedTaskListRow;
  copy: RankedTaskListCopy;
  handlers: RankedTaskRowHandlers;
}) {
  const actions: readonly { id: RankedTaskRowActionId; label: string; press?: () => void }[] = [
    { id: "complete", label: copy.rowActions.complete, press: handlers.onComplete ? () => handlers.onComplete!(row) : undefined },
    { id: "dismiss", label: copy.rowActions.dismiss, press: handlers.onDismiss ? () => handlers.onDismiss!(row) : undefined },
    { id: "chat", label: copy.rowActions.chat, press: handlers.onChat ? () => handlers.onChat!(row) : undefined },
  ];
  return (
    <View style={styles.rowActions}>
      {actions.map((action) => (
        <Pressable
          accessibilityLabel={`${action.label}: ${row.title}`}
          accessibilityRole="button"
          disabled={!action.press}
          key={action.id}
          onPress={action.press}
          style={[styles.rowActionButton, !action.press && styles.rowActionButtonDisabled]}
        >
          <Text style={styles.rowActionText}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function RankedTaskRow({
  row,
  copy,
  formatInstant,
  handlers,
}: {
  row: RankedTaskListRow;
  copy: RankedTaskListCopy;
  formatInstant: RankedTaskInstantFormatter;
  handlers: RankedTaskRowHandlers;
}) {
  return (
    <View
      accessibilityLabel={`${row.rank ?? "—"}. ${row.title}. ${statusLabel(row, copy)}`}
      role="listitem"
      style={styles.row}
    >
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{row.rank ?? "—"}</Text>
      </View>
      <View style={styles.taskBody}>
        <View style={styles.taskHeader}>
          <View style={styles.identity}>
            <Text style={styles.taskTitle}>{row.title}</Text>
            <Text style={styles.sourceLabel}>{copy.sourceNames[row.source] ?? row.sourceLabel}</Text>
          </View>
          <Text style={[styles.status, statusStyle(row)]}>{statusLabel(row, copy)}</Text>
        </View>
        {row.nativeTaskId !== null ? (
          <Text selectable style={styles.nativeId}>{copy.nativeId}: {row.nativeTaskId}</Text>
        ) : null}
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>{copy.score}: {row.score.toFixed(1)}</Text>
          <Text style={styles.metadataText}>{copy.urgency}: {row.urgency.value}/5</Text>
          <Text style={styles.metadataText}>{copy.importance}: {row.importance.value}/5</Text>
        </View>
        <RankedTaskTimeLabel copy={copy} formatInstant={formatInstant} time={row.time} />
        <RankedTaskRowActions copy={copy} handlers={handlers} row={row} />
      </View>
    </View>
  );
}

function PendingTaskRow({
  row,
  copy,
}: {
  row: ReturnType<typeof rankedTaskListView>["pendingRows"][number];
  copy: RankedTaskListCopy;
}) {
  return (
    <View
      accessibilityLabel={`${row.title}. ${copy.pendingTitle}. ${copy.nativeStatuses[row.nativeStatus]}`}
      role="listitem"
      style={styles.pendingRow}
    >
      <View style={styles.pendingIdentity}>
        <Text style={styles.taskTitle}>{row.title}</Text>
        <Text style={styles.pendingLabel}>{copy.pendingTitle}</Text>
      </View>
      <Text style={[styles.status, row.nativeStatus === "blocked" ? styles.statusBlocked : styles.statusActive]}>
        {copy.nativeStatuses[row.nativeStatus]}
      </Text>
    </View>
  );
}

export function RankedTaskList({
  collection,
  copy,
  formatInstant = displayInstant,
  onRefresh,
  onComplete,
  onDismiss,
  onChat,
  refreshing = false,
}: {
  collection: RankedTaskCollection;
  copy?: RankedTaskListCopyOverrides;
  formatInstant?: RankedTaskInstantFormatter;
  onRefresh?: () => void;
  onComplete?: (row: RankedTaskListRow) => void;
  onDismiss?: (row: RankedTaskListRow) => void;
  onChat?: (row: RankedTaskListRow) => void;
  refreshing?: boolean;
}) {
  const text = resolvedCopy(copy);
  const inventory = rankedTaskListView(collection);
  const view = { ...inventory, ...rankedTaskCompletionSections(inventory) };
  const [completedOpen, setCompletedOpen] = useState(false);
  const completedCount = view.completedRows.length + view.completedPendingRows.length;
  const [confirmation, setConfirmation] = useState<{ row: RankedTaskListRow; action: "complete" | "dismiss" } | null>(null);
  const pendingAction = useRef<(() => void) | null>(null);
  function cancelConfirmation() {
    pendingAction.current = null;
    setConfirmation(null);
  }
  function confirmAction() {
    const action = pendingAction.current;
    pendingAction.current = null;
    setConfirmation(null);
    action?.();
  }
  function requestConfirmation(row: RankedTaskListRow, action: "complete" | "dismiss", handler: (row: RankedTaskListRow) => void) {
    pendingAction.current = () => handler(row);
    setConfirmation({ row, action });
  }
  const handlers: RankedTaskRowHandlers = {
    onComplete: onComplete ? (row) => requestConfirmation(row, "complete", onComplete) : undefined,
    onDismiss: onDismiss ? (row) => requestConfirmation(row, "dismiss", onDismiss) : undefined,
    onChat,
  };
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <View accessibilityLabel={text.title} role="region" style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{text.title}</Text>
          {/* The ranker writes a long explanation of its own run. It belongs behind
              this button, not above the list the customer came here to read. */}
          {collection.projection?.report ? (
            <Pressable
              accessibilityLabel={text.about}
              accessibilityRole="button"
              onPress={() => setAboutOpen(true)}
              style={styles.aboutButton}
            >
              <Text style={styles.aboutButtonText}>i</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.lastUpdatedText}>
          {rankedTaskLastUpdatedText({
            collectedAt: collection.collectedAt,
            formatInstant,
            label: text.lastUpdated,
            missing: text.notYetUpdated,
          })}
        </Text>
        {onRefresh ? (
          <Pressable
            accessibilityRole="button"
            disabled={refreshing}
            onPress={onRefresh}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>{refreshing ? text.refreshing : text.refresh}</Text>
          </Pressable>
        ) : null}
      </View>

      {view.rows.length === 0 && view.pendingRows.length === 0 && completedCount === 0 ? (
        <Text accessibilityLabel={text.empty} style={styles.empty}>{text.empty}</Text>
      ) : null}

      {view.rows.length ? (
        <View accessibilityLabel={text.inventoryLabel} role="list" style={styles.list}>
          {view.rows.map((row) => (
            <RankedTaskRow copy={text} formatInstant={formatInstant} handlers={handlers} key={row.id} row={row} />
          ))}
        </View>
      ) : null}

      {view.pendingRows.length ? (
        <View style={styles.pendingSection}>
          <Text style={styles.pendingTitle}>{text.pendingTitle}</Text>
          <View accessibilityLabel={text.pendingTitle} role="list" style={styles.list}>
            {view.pendingRows.map((row) => <PendingTaskRow copy={text} key={row.id} row={row} />)}
          </View>
        </View>
      ) : null}

      {completedCount > 0 ? (
        <View style={styles.pendingSection}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: completedOpen }} onPress={() => setCompletedOpen((open) => !open)}>
            <Text style={styles.aboutCloseText}>{completedOpen ? text.hideCompleted : text.showCompleted} ({completedCount})</Text>
          </Pressable>
          {completedOpen ? (
            <View accessibilityLabel={text.showCompleted} role="list" style={styles.list}>
              {view.completedRows.map((row) => <RankedTaskRow copy={text} formatInstant={formatInstant} handlers={handlers} key={row.id} row={row} />)}
              {view.completedPendingRows.map((row) => <PendingTaskRow copy={text} key={row.id} row={row} />)}
            </View>
          ) : null}
        </View>
      ) : null}

      <Modal transparent visible={confirmation !== null} onRequestClose={cancelConfirmation} animationType="fade">
        <View style={styles.aboutBackdrop}>
          <View accessibilityViewIsModal style={styles.aboutSheet}>
            <Text style={styles.aboutSentence}>{confirmation?.action === "complete" ? text.confirmComplete : text.confirmDismiss}</Text>
            <Text style={styles.taskTitle}>{confirmation?.row.title}</Text>
            <Pressable accessibilityRole="button" onPress={cancelConfirmation}><Text style={styles.aboutCloseText}>{text.cancel}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={confirmAction}><Text style={styles.aboutCloseText}>{confirmation?.action === "complete" ? text.rowActions.complete : text.rowActions.dismiss}</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setAboutOpen(false)} transparent visible={aboutOpen}>
        <Pressable onPress={() => setAboutOpen(false)} style={styles.aboutBackdrop}>
          <View style={styles.aboutSheet}>
            <Text style={styles.aboutSentence}>{text.aboutSentence}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setAboutOpen(false)}
              style={styles.aboutCloseButton}
            >
              <Text style={styles.aboutCloseText}>{text.aboutClose}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 16,
  },
  header: {
    gap: 5,
  },
  refreshButton: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    borderColor: palette.lineStrong,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  refreshButtonText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: "500",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  lastUpdatedText: {
    color: palette.muted,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  aboutButton: {
    alignItems: "center",
    borderColor: palette.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  aboutButtonText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  aboutBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 28,
  },
  aboutSheet: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    gap: 16,
    padding: 20,
    width: "100%",
  },
  aboutSentence: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 21,
  },
  aboutCloseButton: {
    alignSelf: "flex-end",
  },
  aboutCloseText: {
    color: palette.teal,
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 28,
  },
  list: {
    borderColor: palette.line,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "flex-start",
    backgroundColor: palette.surface,
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pendingSection: {
    gap: 8,
  },
  pendingTitle: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  pendingRow: {
    alignItems: "flex-start",
    backgroundColor: palette.surface,
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 14,
  },
  pendingIdentity: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  pendingLabel: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  rankBadge: {
    alignItems: "center",
    backgroundColor: "transparent",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  rankText: {
    color: palette.ink,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  taskBody: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  taskHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  identity: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  taskTitle: {
    color: palette.ink,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 22,
  },
  sourceLabel: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  status: {
    borderRadius: 999,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: "600",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusActive: {
    backgroundColor: palette.greenSoft,
    color: palette.green,
  },
  statusBlocked: {
    backgroundColor: palette.amberSoft,
    color: palette.amber,
  },
  statusTerminal: {
    backgroundColor: palette.tealSoft,
    color: palette.muted,
  },
  nativeId: {
    color: palette.muted,
    fontSize: 13,
  },
  rowActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 2,
  },
  rowActionButton: {
    backgroundColor: palette.tealSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  rowActionButtonDisabled: {
    opacity: 0.45,
  },
  rowActionText: {
    color: palette.ink,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "500",
  },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  metadataText: {
    color: palette.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  time: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    borderColor: palette.line,
    borderRadius: 14,
    borderStyle: "dashed",
    borderWidth: 1,
    color: palette.muted,
    padding: 22,
    textAlign: "center",
  },
});
