import { scheduledRunFailure } from "./scheduled-view";
import type { ChatRunStatus } from "./types";

export const rankedTaskAutomationRoles = ["email_scanner", "ranker"] as const;
export type RankedTaskAutomationRole = (typeof rankedTaskAutomationRoles)[number];

export interface RankedTaskAutomationTemplateContract {
  readonly templateId: string;
  readonly role: RankedTaskAutomationRole;
  readonly defaultSchedule: string;
  readonly officialVersion: number;
  readonly defaultSnapshot: ManagedAutomationEditableSnapshot;
}

export interface ManagedAutomationEditableSnapshot {
  readonly name: string;
  readonly schedule: string;
  readonly prompt: string;
  readonly sources: readonly string[];
  readonly skills: readonly string[];
  readonly delivery: string;
}

/**
 * The email triage, taken from the customer's own pilot cron job and made generic.
 *
 * What carries this automation is the ORDER of the decisions, not any single rule. New
 * mail, then the topics someone else handles, then the customer's own forwards, then
 * advertising, then the board, and only after all of that a new card. Asked for
 * importance first, a model writes a card for a webinar invitation, because the
 * invitation does name a date and does ask for a decision.
 *
 * Advertising is classified actively and ahead of everything else for the same reason:
 * "is this important?" has no usable answer for a newsletter.
 *
 * The board is reconciled before anything is reported and before any card is created,
 * because the board is what the customer already knows. Ten Kanban tasks for one
 * Financial Times payment mail — measured on ws_NR_n6sWuGl8V across five hours, each
 * worded differently — came from a run that created first and looked afterwards.
 *
 * The identifier is formed from the content rather than transcribed from the message id.
 * One matter arrives as a mail and again as its reply; two message ids made that two
 * cards, one content identifier makes it one.
 *
 * Nothing to report means silence. The automation card already carries when the run last
 * happened and whether it went through, so a line saying it ran costs the customer's
 * attention and tells them nothing.
 */
const scannerDefaultSnapshot = freezeSnapshot({
  name: "Ranked Tasks email scanner",
  schedule: "0 8,17 * * *",
  prompt: [
    "Triage the customer's new email in this order. The order is the point: no step is taken before the one above it.",
    "Read the workspace triage policy once at the start of the run with workspace_triage_policy. Its handledElsewhere list and its separateBusinessAndPrivate switch are the only thing that says what this workspace hands to someone else and how the report is split; nothing about the customer is assumed anywhere else.",
    "1. Only email that arrived since this automation's last run. Nothing older is triaged again.",
    "2. Set aside every topic in handledElsewhere: someone else handles it, so do not report it, do not create a card for it, and do not mark it as read - unless the email is plainly private and has nothing to do with that topic. An empty list sets nothing aside.",
    "3. The customer's own forwards are archive material, not new work, unless one plainly carries a new current matter.",
    "4. Classify advertising and bulk mail actively, before any other judgement: newsletters, marketing, webinar and demo invitations, recruiting funnels, manufactured scarcity, sign-up calls without an evidenced personal connection. In doubt it is advertising, and advertising ends here.",
    "5. Reconcile the Kanban board first, before any report and before any new card. Read the board with kanban_list and kanban_show, and match existing cards by thread, sender, subject, project, people and the concrete action. Where the email confirms the action happened, close the card with kanban_complete and a result note saying what was confirmed. Where the action was promised and is still outstanding, block the card with kanban_block and name in the reason who owes it, which artefact is expected, and the timeframe that was announced. Where two cards carry the same matter, keep one and close the duplicate with a note naming the card that stays; never delete a card. Never close a card on the customer's own intention, only on confirmation from the other side. What you aim at per matter is exactly one traceable open card, for the next action that is not yet confirmed.",
    "6. Only then consider a new card, and be reluctant. A new card needs a real deadline, a decision only the customer can make, a payment, legal or travel risk, or a dependency that blocks something else. No card for plain information, portal and standard invoice notices, receipts, transaction confirmations, login, security and sign-in notifications. In doubt, no card.",
    "7. Form the identifier of a card from its content, in the form mail:sender:subject-slug:date, and pass it to kanban_create as idempotency_key. Never transcribe a message id. The same matter yields the same identifier, so a card that already exists comes back unchanged instead of a second one; never work around that by rewording the title.",
    "8. Report briefly in the home chat, in the customer's language: per email the sender, the subject, why it matters, the concrete next step, and what changed on the board. When separateBusinessAndPrivate is true, keep business and private apart in the report; otherwise report them in one stream. The switch changes nothing else.",
    "9. Mark as read only the email you actually reported. Never advertising, never what you set aside, never what you did not report.",
    "10. When there is nothing to report, say nothing in the chat. The run still writes its structured result.",
    "You never reply, forward, send, delete, archive or move email; marking reported email as read is the only change you make in the mailbox, and a useful answer is proposed in the report rather than sent.",
    "Keep long email texts, secrets and full bank, account or customer numbers out of the report and out of every card.",
    "Write one structured result through the native ranked_tasks_scan_output tool; the tool binds the current cron execution identity and canonical completion time.",
    "Do not read, start, retry, monitor, or update the Ranked List or its ranker automation.",
  ].join(" "),
  sources: ["email", "kanban"],
  // The installed skill is named `hey-hermes-gmail`. Declaring `gmail` made the
  // scheduler skip the whole job with "Skill 'gmail' not found", while the chat
  // still reported the trigger as a successful run — so the automation appeared
  // to work and had in fact never executed once.
  skills: ["hey-hermes-gmail"],
  delivery: "chat, ranked_tasks.scan_output",
});

/**
 * The ranked list, taken from the customer's own pilot cron job and made generic.
 *
 * The stored ranking is an input. The run used to read the board and the triage result
 * and write a fresh order over the top, so a rating the customer had set by hand and an
 * entry they had dismissed were both back at the next run.
 *
 * A finding may become an entry without a Kanban card. The sentence that stood here —
 * "Never create a Ranked-only task or a second task source" — is the reason
 * `ranked_task_candidates` has a table, a write path and a screen, and has never once
 * been written to.
 *
 * A deadline needs a source outside our own reasoning, and the entry names it. A date
 * the ranker worked out for itself is a target with a review date, never a deadline: a
 * deadline the customer cannot trace back is worse than no deadline.
 *
 * The report is bounded to ten lines. Per HPD-398 the run tore off at around thirty
 * tasks because the entire list went into the chat message. The list lives in the
 * database and the app reads it from there.
 *
 * No provider is named anywhere in the prompt: memory is one tool with exchangeable
 * providers, and an instruction that names one of them makes the others invisible.
 */
const rankerDefaultSnapshot = freezeSnapshot({
  name: "Ranked Tasks ranker",
  schedule: "15 8,17 * * *",
  prompt: [
    "Rank what matters for the customer now, using this automation's configured sources and tools.",
    "Read the workspace triage policy once at the start of the run with workspace_triage_policy. When separateBusinessAndPrivate is true, keep business and private apart in the report; otherwise report one stream. The switch changes nothing else, and nothing about the customer is assumed anywhere else.",
    "Sources: the live Kanban board, the latest email scanner result, open items and deadlines in the Vault, and every memory system through the one generic memory tool. Archive material is context, never work to take in as new.",
    "First call ranked_tasks_projection_context once; it hands you the exact native tasks, the latest successfully persisted scanner result, and this run's private publicationStage. Never scan email yourself and never start, retry, monitor, or change the scanner. When no scanner result is available, keep email unavailable and rank everything else instead of blocking the whole run.",
    "The stored ranking is an input, not only a result: identifiers, the customer's own ratings, and the done and dismissed states survive every run. Nothing done or dismissed is opened again without a new event from a source.",
    // HPD-464: one rule to a sentence. This was one 252-word sentence, and the
    // run of 2026-08-25 08:55 applied one half of it and not the other: it folded
    // t_604e11a3 and t_ec870db9 into t_8dd3448c with supersedes, and in the same
    // answer carried t_93d5c099 and t_6484a327 over untouched - one Google Cloud
    // suspension standing at ranks 1 and 2. The pilot ranker states its own
    // de-duplication in one short line and can, because it rewrites its whole file
    // every run. This contract cannot: `boundedText` rejects every control
    // character, so a prompt here is one line and can carry no headings or blank
    // lines. Short single-idea rules are the part of that form this contract has.
    "Merge and de-duplicate as its own step, before anything is scored: one entry per matter, whatever its source, keeping the identifier it already had.",
    "A stored finding is handed to you with its sourceId; send that same sourceId back for the same matter and it stays one entry.",
    "Where two entries are plainly the same matter, send the one that stays with the other named in its supersedes - a Kanban card absorbs a card or a finding, a finding absorbs a finding.",
    "Two cards worded differently for one matter are one entry, exactly like two findings.",
    "Name a card in supersedes by its nativeTaskId; a card you have never ranked has no other identity, and that is what a fresh duplicate is.",
    "The merge step covers the whole list and not only what you were going to send: two entries you carry over unchanged are still two entries.",
    "A fold is read only on a card you send, so send the survivor even where its own rating is unchanged; one card is the whole cost.",
    "Leaving a card out of tasks is not how you merge it: it keeps the rating already stored for it and stays on the list, and one never ranked shows as not ranked yet.",
    "Saying it in the report is not saying it either - only supersedes folds anything.",
    "Folding changes the list and never the board: both cards stay on the Kanban, nothing there is closed, moved or created, and the customer can undo the fold.",
    "Never fold one the customer rated by hand, finished or removed, and never name one you are also sending in the same run.",
    "A finding from email, the Vault or memory may become an entry of the list without a Kanban card. Never create a Kanban card only to have somewhere to put a finding.",
    "Give an entry a deadline only where a source outside your own reasoning states it, and name that source with the date: the sender, the document, the invoice, the calendar entry. Otherwise either derive a target date and set a review date with it, or set no date at all and only a review date. Never invent a date.",
    "Rate urgency and importance from 0 to 5 — urgency by how soon it goes wrong if nothing happens, importance by what it costs if it is never done — keep every rating the customer set by hand, and score each entry as 0.6 × urgency + 0.4 × importance.",
    "Write the report and reminder prose yourself, and emit stable structured reminder states and action IDs for the clients; the reminder states and the four actions stay exactly as they are.",
    "Build the complete run-bound file only with ranked_tasks_projection_stage. For tasks or candidates send only section, offset and 1-8 items; skip empty sections. Identical retries are safe. Limits are 12 KiB per call, 500 cards and 200 findings.",
    "Finalize and publish once with ranked_tasks_projection_publish, sending only top-level taskCount, candidateCount, scannerResultId, sources and report; never section, offset, items, tasks or candidates.",
    "It reads only this run's staged arrays, requires the exact counts, binds completion time, and preserves the previous list on failure.",
    "Only after publish succeeds, write at most ten customer-language lines from publishedList only: total, then each returned rank and title. Add no reasons, history, completed or folded items from earlier context. Never call it a projection. Never send the full list in chat; the app reads it from the database.",
    "Keep full bank, account and customer numbers out of titles, descriptions and source references.",
  ].join(" "),
  sources: ["kanban", "email_triage", "vault", "memory"],
  skills: [],
  delivery: "chat, ranked_tasks.projection_publish",
});

export const rankedTaskAutomationTemplates = Object.freeze({
  emailScanner: Object.freeze({
    templateId: "hey.ranked-tasks.email-scanner",
    role: "email_scanner",
    defaultSchedule: "0 8,17 * * *",
    // v3 reports into the chat. A preinstalled automation should behave exactly
    // like one the customer writes themselves; the only difference is that it
    // arrives already installed. Writing its result into a store and telling the
    // customer nothing was the one place that was not true.
    //
    // v4 binds a task to the mail it came from. Without that binding the
    // scanner wrote a new task on every pass — ten for one Financial Times
    // payment mail — and the ranked list said the same thing ten times.
    //
    // v5 is the customer's own pilot triage, made generic: his order of
    // decisions, the board reconciled before anything is written, and the
    // binding carried by a content identifier instead of a message id.
    officialVersion: 5,
    defaultSnapshot: scannerDefaultSnapshot,
  }),
  ranker: Object.freeze({
    templateId: "hey.ranked-tasks.ranker",
    role: "ranker",
    defaultSchedule: "15 8,17 * * *",
    // v4 is the customer's own pilot ranker, made generic: the stored ranking
    // is read back as an input, findings may become entries without a Kanban
    // card, a deadline needs a source outside our reasoning, and the chat
    // report is bounded to ten lines.
    //
    // v5 (HPD-421) makes "one entry per matter" followable. v4 asked the run to
    // keep the identifier a matter already had while handing it only the
    // finished checksum, which it cannot invert - so it re-invented the content
    // key every run and one differently worded subject slug produced a second
    // row. It is now handed the sourceId back, it can name two stored findings
    // as one matter, and its first-line count is the whole list after the run
    // rather than the number of matters it merged down to.
    //
    // v6 (HPD-464) says the same thing about Kanban cards. v5 promised "one
    // entry per matter, whichever source it came from" and then allowed the fold
    // for findings only, so two cards for one matter had no way to become one
    // row: measured on ws_NR_n6sWuGl8V on 2026-08-25, ranks 1 and 2 of
    // `GET /tasks/ranked` were "Google-Cloud-Projekt vor Sperrung prüfen" and
    // "Cloud-Billing für humanornot-dev prüfen", both `score 5`, one Google
    // Cloud suspension. The customer's own pilot ranker states it in one line -
    // "Kanban-Karten erscheinen in der Page, dürfen aber nicht dupliziert
    // werden" - and it can, because it writes the whole list itself. This
    // instruction now says it too, and the fold reaches a card.
    //
    // v7 (HPD-464) closes the way a run had of saying nothing. v6 could fold, and
    // the run of 2026-08-25 05:59 said in its report "two duplicate cards merged
    // here" while sending no supersedes at all: it had left the two cards out of
    // `tasks` instead. Leaving a card out means "keep what is stored", so the two
    // cards - created that morning and never ranked - came back to the customer
    // as `pendingTasks`, above his list. It also could not have named them:
    // `ranking.cards` only carries a ranked identity for a card a run has already
    // rated. Both halves are said here, and a card may now be named by the id it
    // carries on the board.
    //
    // v8 (HPD-464) says the merge step covers what the run carries over, and that
    // a fold needs the survivor in `tasks`. v7 closed the way of saying a fold in
    // prose; it left open the way of never looking. Measured on ws_NR_n6sWuGl8V,
    // run cron_152e7e48988c_20260825_085113, completedAt 2026-08-25T06:54:55.530Z:
    // `source_observed_at` in `ranked_task_metadata` is that same instant for
    // t_8dd3448c alone. For t_93d5c099 and t_6484a327 - the one Google Cloud
    // suspension at ranks 1 and 2, both `5/inferred` - it is 2026-08-24T04:22:57.379Z.
    // The run sent one card and two supersedes and carried the pair over, so the
    // survivor was never in `tasks` and no wording of the de-duplication rule could
    // have reached them: `supersedes` is read only inside the loop over `input.tasks`
    // (ranked-task-automation-service.ts). The sentence that told it to carry them
    // over is ours, and it is in the answer budget rather than here - "Send a card
    // only when it has no stored rating yet or its rating changes" - so the budget
    // note now carries the exception and this instruction says the rule.
    //
    // v9 (HPD-550) moves the complete projection out of one tool answer and into
    // a private run-bound file. The legacy tool and its 40/8 budget remain for
    // customer-edited automations; only the shipped default uses the file
    // publisher and reports its top ten after a confirmed save.
    //
    // v10 (HPD-554) keeps that complete file and publisher, but removes the
    // unbounded generic write_file step in front of them. The shipped default
    // appends at most eight entries and 12 KiB per server-checked stage call,
    // then finalizes exact totals before the same parameterless publish.
    officialVersion: 10,
    defaultSnapshot: rankerDefaultSnapshot,
  }),
}) satisfies Readonly<Record<string, RankedTaskAutomationTemplateContract>>;

export interface RankedTaskAutomationMetadata {
  readonly templateId: string;
  readonly role: RankedTaskAutomationRole;
  readonly nativeJobId: string | null;
  readonly officialVersion: number;
  readonly activeUserVersion: number;
  readonly currentDefault: boolean;
  readonly resettable: boolean;
}

export interface ManagedAutomationVersion {
  readonly version: number;
  readonly reason: "installed" | "edited" | "reset";
  readonly snapshot: ManagedAutomationEditableSnapshot;
  readonly createdAt: string;
}

/**
 * What the card has to tell the customer about whether this automation is doing its work, and
 * nothing more. The runtime's error text is not part of this contract: it is written for an
 * operator and stays in the log.
 */
export type RankedTaskAutomationStall = "ai_route" | "failing" | "missing" | "not_storing";

export type RankedTaskAutomationResultStatus = "never" | "pending" | "stored" | "failed" | "not_stored";

export interface RankedTaskAutomationEvidence {
  readonly nativeExecution: Readonly<{
    readonly executionId: string | null;
    readonly occurredAt: string;
    readonly status: string | null;
  }> | null;
  readonly canonicalRun: Readonly<{
    readonly runId: string;
    readonly executionId: string;
    readonly status: ChatRunStatus;
    readonly completedAt: string | null;
  }> | null;
  readonly persistedResult: Readonly<{
    readonly executionId: string;
    readonly completedAt: string;
  }> | null;
}

export interface RankedTaskAutomationView {
  readonly metadata: RankedTaskAutomationMetadata;
  readonly snapshot: ManagedAutomationEditableSnapshot;
  readonly defaultSnapshot: ManagedAutomationEditableSnapshot;
  readonly versions: readonly ManagedAutomationVersion[];
  readonly enabled: boolean;
  readonly nativeState: string | null;
  readonly nextRunAt: string | null;
  readonly lastRunAt: string | null;
  /** Only an exact structured scanner/projection write is reported as `stored`. */
  readonly resultStatus: RankedTaskAutomationResultStatus;
  readonly evidence: RankedTaskAutomationEvidence;
  /** `null` when there is nothing to say. */
  readonly stalled: RankedTaskAutomationStall | null;
}

/**
 * Whether this automation has something to say for itself.
 *
 * A paused automation is quiet on purpose and the card already says "Paused"; only a job that is
 * meant to be running and is not gets a sentence.
 *
 * HPD-409: an automation whose job is gone from the runtime is not paused. The delete also clears
 * `enabled`, so it used to fall out here as "nothing to say" and the card read "Paused" — the same
 * silence the archived Tasks bookmark had. Absence is the first thing checked and it is said first.
 */
/**
 * How long after a run this stops giving it the benefit of the doubt, and how
 * far from a run a stored result may sit and still count as that run's.
 *
 * The two managed automations run twice a day, so half an hour is far below the
 * gap between two runs and far above the seconds between a run writing its
 * result and the runtime writing down that the run happened.
 */
const rankedTaskRunSettleMs = 15 * 60 * 1000;
const rankedTaskStoredWindowMs = 30 * 60 * 1000;

function instantOf(value: string | null | undefined): number | null {
  if (typeof value !== "string" || !value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function rankedTaskAutomationStall(run: {
  readonly installed: boolean;
  readonly enabled: boolean;
  readonly lastStatus: string | null;
  readonly lastError: string | null;
  /** When the runtime says this automation last ran. May carry a zone offset. */
  readonly lastRunAt?: string | null;
  /**
   * The newest thing this automation actually left on the plane: the scanner's
   * latest scan result, the ranker's current ranking. Canonical UTC.
   */
  readonly storedThroughAt?: string | null;
  readonly now?: string | null;
}): RankedTaskAutomationStall | null {
  if (!run.installed) return "missing";
  if (!run.enabled) return null;
  const failure = scheduledRunFailure(run.lastStatus, run.lastError);
  if (failure) return failure.cause === "ai_route_mismatch" ? "ai_route" : "failing";

  // HPD-422: `lastStatus` describes that a run started, not what came of it.
  // Measured on ws_NR_n6sWuGl8V on 2026-08-23: the scanner reported
  // `lastRunAt 08:01:52+02:00, lastStatus: ok` one second after that same run
  // told the customer it could not save anything, and the newest scan result on
  // the plane was still 04:45:38Z - the run before. Three of eight scheduled
  // runs that morning stored nothing while every card read "Enabled".
  //
  // Both roles settle this the same way: a run that succeeds always leaves
  // something behind. The scanner writes its structured result even on a morning
  // with nothing to report, and a ranker that finishes without a projection is
  // already treated as a failed run. So a last run materially newer than the
  // newest stored result means that run stored nothing.
  const ranAt = instantOf(run.lastRunAt);
  if (ranAt === null) return null;
  const observedAt = instantOf(run.now) ?? Date.now();
  // A run that may still be writing is not yet evidence of anything.
  if (observedAt - ranAt < rankedTaskRunSettleMs) return null;
  const storedAt = instantOf(run.storedThroughAt);
  if (storedAt !== null && storedAt >= ranAt - rankedTaskStoredWindowMs) return null;
  return "not_storing";
}

export interface RankedTaskAutomationsView {
  readonly workspaceTimeZone: string;
  readonly automations: readonly RankedTaskAutomationView[];
}

export type RankedTaskAutomationUpdate = Readonly<{
  name?: string;
  schedule?: string;
  prompt?: string;
  sources?: readonly string[];
  skills?: readonly string[];
  delivery?: string;
  enabled?: boolean;
}>;

export interface ManagedAutomationResetPlan {
  readonly nativeJobId: string;
  readonly archiveVersion: number;
  readonly archiveSnapshot: ManagedAutomationEditableSnapshot;
  readonly patch: ManagedAutomationEditableSnapshot;
  readonly nextActiveUserVersion: number;
  readonly deletesKanbanData: false;
  readonly deletesScannerData: false;
  readonly deletesRankedData: false;
  readonly reinstallsDeletedJob: false;
}

export function rankedTaskAutomationContracts(workspaceTimeZone: string): readonly RankedTaskAutomationTemplateContract[] {
  try {
    new Intl.DateTimeFormat("en", { timeZone: workspaceTimeZone }).format(new Date(0));
  } catch {
    throw new Error("workspaceTimeZone must be a supported IANA time zone.");
  }
  return Object.freeze([
    rankedTaskAutomationTemplates.emailScanner,
    rankedTaskAutomationTemplates.ranker,
  ]);
}

export function planManagedAutomationReset(input: {
  readonly confirmed: boolean;
  readonly metadata: RankedTaskAutomationMetadata;
  readonly currentSnapshot: ManagedAutomationEditableSnapshot;
  readonly currentDefaultSnapshot: ManagedAutomationEditableSnapshot;
}): ManagedAutomationResetPlan {
  if (!input.confirmed) throw new Error("Managed automation reset requires explicit confirmation.");
  if (!input.metadata.resettable) throw new Error("Managed automation is not resettable.");
  if (!input.metadata.nativeJobId) throw new Error("A deleted managed automation is not silently reinstalled by reset.");
  if (input.metadata.activeUserVersion < 1 || input.metadata.officialVersion < 1) {
    throw new Error("Managed automation versions must be positive integers.");
  }
  return Object.freeze({
    nativeJobId: input.metadata.nativeJobId,
    archiveVersion: input.metadata.activeUserVersion,
    archiveSnapshot: freezeSnapshot(input.currentSnapshot),
    patch: freezeSnapshot(input.currentDefaultSnapshot),
    nextActiveUserVersion: input.metadata.activeUserVersion + 1,
    deletesKanbanData: false as const,
    deletesScannerData: false as const,
    deletesRankedData: false as const,
    reinstallsDeletedJob: false as const,
  });
}

function freezeSnapshot(snapshot: ManagedAutomationEditableSnapshot): ManagedAutomationEditableSnapshot {
  return Object.freeze({
    ...snapshot,
    sources: Object.freeze([...snapshot.sources]),
    skills: Object.freeze([...snapshot.skills]),
  });
}


/**
 * Hermes refuses a longer cron prompt, and it is the runtime's number rather
 * than ours: `_MAX_PROMPT_LENGTH = 5000` in `gateway/platforms/api_server.py`,
 * checked at :4177 and :4247, answered with 400 "Prompt must be ≤ 5000
 * characters".
 *
 * This validator used to allow 12,000. A check looser than the real one is not
 * a check: on 2026-08-25 the ranker default grew to 4,897 characters, every
 * test here passed, and "Reset to default" answered 400 for every workspace -
 * the first anyone heard of the limit was the customer pressing the button.
 */
export const hermesAutomationPromptLimit = 5000;

/**
 * What the plane appends to a stored prompt before Hermes sees it: the language
 * sentence, then the marker and the base64 tag carrying sources and delivery.
 * Measured on 2026-08-25 at the widest we ship - 170 for the ranker's tag and
 * 111 for the longest language name in use - so the stored text is validated
 * against what is left, not against the whole limit.
 */
export const managedPromptEnvelopeAllowance = 320;

function boundedText(value: string, field: string, maximum: number): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maximum || /[\u0000-\u001f\u007f]/u.test(trimmed)) {
    throw new Error(`${field} must be bounded non-empty text.`);
  }
  return trimmed;
}

function boundedStringList(values: readonly string[], field: string): readonly string[] {
  if (!Array.isArray(values) || values.length > 20) throw new Error(`${field} must contain at most 20 entries.`);
  const normalized = values.map((value) => boundedText(value, field, 160));
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} must not contain duplicates.`);
  return Object.freeze(normalized);
}

/**
 * HPD-500: a name is stored the way the runtime hands it back.
 *
 * The name is the one snapshot field the API reads back through
 * `sanitizeConnectionText`, which collapses runs of whitespace. Storing a name
 * with two spaces therefore produced a record the job could never match, and
 * `ensureInstalled` would have handed that job its body again on every read of
 * the automations screen without ever getting the two to agree. Control
 * characters are already rejected below, so this only ever collapses spaces.
 */
function singleSpaced(value: string): string {
  return typeof value === "string" ? value.replace(/\s+/gu, " ") : value;
}

export function validateManagedAutomationSnapshot(
  snapshot: ManagedAutomationEditableSnapshot,
): ManagedAutomationEditableSnapshot {
  return freezeSnapshot({
    name: boundedText(singleSpaced(snapshot.name), "Automation name", 200),
    schedule: boundedText(snapshot.schedule, "Automation schedule", 200),
    prompt: boundedText(snapshot.prompt, "Automation prompt", hermesAutomationPromptLimit - managedPromptEnvelopeAllowance),
    sources: boundedStringList(snapshot.sources, "Automation sources"),
    skills: boundedStringList(snapshot.skills, "Automation skills"),
    delivery: boundedText(snapshot.delivery, "Automation delivery", 160),
  });
}

export function applyRankedTaskAutomationUpdate(
  current: ManagedAutomationEditableSnapshot,
  update: RankedTaskAutomationUpdate,
): Readonly<{ snapshot: ManagedAutomationEditableSnapshot; enabled: boolean | undefined }> {
  const allowed = new Set(["name", "schedule", "prompt", "sources", "skills", "delivery", "enabled"]);
  const unknown = Object.keys(update).find((field) => !allowed.has(field));
  if (unknown) throw new Error(`Unsupported automation update field: ${unknown}.`);
  if (update.enabled !== undefined && typeof update.enabled !== "boolean") {
    throw new Error("Automation enabled must be boolean.");
  }
  return Object.freeze({
    snapshot: validateManagedAutomationSnapshot({
      name: update.name ?? current.name,
      schedule: update.schedule ?? current.schedule,
      prompt: update.prompt ?? current.prompt,
      sources: update.sources ?? current.sources,
      skills: update.skills ?? current.skills,
      delivery: update.delivery ?? current.delivery,
    }),
    enabled: update.enabled,
  });
}

/**
 * What the two automation cards are called on screen. Both clients carried this
 * list separately and it had already drifted: only one of them had words for
 * enabled, paused, and the field names. A word changed in one client was a word
 * the other kept saying differently about the same thing.
 */
export const rankedTaskAutomationLabels = Object.freeze({
  title: "Ranked Tasks automations",
  description: "The email scanner and ranker are separate editable Hermes automations.",
  scanner: "Email scanner",
  ranker: "Ranker",
  enabled: "Enabled",
  paused: "Paused",
  edit: "Edit",
  save: "Save",
  cancel: "Cancel",
  reset: "Reset to default",
  confirmReset: "Confirm reset",
  reinstall: "Set it up again",
  confirmReinstall: "Confirm setting it up again",
  versions: "Version history",
  restore: "Restore",
  confirmRestore: "Confirm restore",
  refresh: "Refresh Ranked Tasks",
  refreshing: "Refreshing…",
  fields: Object.freeze({
    name: "Name",
    schedule: "Schedule",
    prompt: "Prompt",
    sources: "Sources",
    skills: "Tools and skills",
    delivery: "Output",
  }),
  /**
   * One sentence per state, in the customer's terms: what is not happening, and what puts it
   * right. Nothing here names a provider, a pin, a config, or a field.
   */
  stalled: Object.freeze({
    ai_route: "This automation is not running. It was set up for a different AI route than the one selected now. Open AI Access, choose your route again, and it runs at its next scheduled time.",
    failing: "The last run did not go through, so nothing was updated from it. The next scheduled run will try again.",
    missing: "This automation is gone, so nothing is scanned or ranked from it until it is back. Hey Hermes sets it up again, with your own wording and your own schedule, the next time this screen opens — if this sentence is still here after that, tell Support.",
    not_storing: "This automation ran, but nothing it produced was saved, so your list is not showing its last run. It will try again at its next scheduled time. If this sentence is still here tomorrow, tell Support.",
  }),
} as const);
