/**
 * Scheduled view model (HPD-97).
 *
 * One pure mapping from the canonical native Hermes cron jobs returned by
 * `GET /hermes/jobs` onto what a person needs to read: does it still work, how
 * often does it run, when does it run next. There is no second scheduler here
 * and no job store: this module only interprets what Hermes already owns.
 *
 * It is deliberately locale-free. It returns typed descriptors, never
 * user-facing sentences, so Web and Mobile agree on meaning and localize
 * separately. `now` is an argument so the result is deterministic.
 *
 * Spec: `docs/scheduled-hermes-jobs-spec.md`.
 */

import { safeHermesConsumerText } from "./hermes-api";

export type ScheduledStatus = "active" | "paused" | "attention" | "unknown";

/**
 * How often the job runs. A recurring rhythm carries every time of day it
 * fires, because a schedule like `0 8,17 * * *` is one rhythm with two times
 * and reading only the first would state a schedule the job does not keep.
 * Each time is a wall-clock string exactly as the user gave it to Hermes; it
 * is NOT converted into the reader's timezone, because a cron field carries
 * no timezone. Absolute instants
 * — `nextRun`, `lastRun`, and the date of a `once` job — may be rendered in
 * local time, because they identify a real moment.
 */
export type ScheduledRhythm =
  | { kind: "minutes"; every: number }
  | { kind: "hourly"; every: number; minute: number | null }
  | { kind: "daily"; every: number; times: readonly string[] }
  | { kind: "weekly"; weekdays: number[]; times: readonly string[] }
  | { kind: "monthly"; days: number[]; times: readonly string[] }
  | { kind: "once"; at: string | null }
  | { kind: "runtime"; display: string }
  | { kind: "unknown" };

export type ScheduledNextRun =
  | { kind: "none" }
  | { kind: "unknown" }
  | { kind: "overdue"; at: string; minutesLate: number }
  | { kind: "upcoming"; at: string; inMinutes: number };

export type ScheduledLastRun =
  | { kind: "never" }
  | { kind: "unknown" }
  | { kind: "ok"; at: string | null }
  | { kind: "failed"; at: string | null; reason: string | null; cause: ScheduledFailureCause }
  | { kind: "unclear"; at: string | null; status: string };

/**
 * Why a run did not happen, when the runtime's own words name a condition this product can
 * state in its own language.
 *
 * The runtime writes for an operator. Measured on 2026-08-22: a job whose inference baseline no
 * longer matched the workspace's AI route was refused with "Skipped to prevent unintended spend:
 * global inference config drifted since this job was created (provider 'openrouter' ->
 * 'anthropic'), and this job is unpinned. No inference call was made." That sentence is what a
 * customer read. Naming the condition here lets each surface say what it means for him and leave
 * the runtime's wording in the log, which is the line HPD-378 drew for a rejected write.
 */
export type ScheduledFailureCause = "ai_route_mismatch" | "unstated";

export interface ScheduledEntry {
  id: string;
  title: string;
  status: ScheduledStatus;
  /** Listed from another surface under a summary policy: detail is withheld by the API. */
  restricted: boolean;
  rhythm: ScheduledRhythm;
  nextRun: ScheduledNextRun;
  lastRun: ScheduledLastRun;
  purpose: string | null;
  delivery: string | null;
  /** Changing an appointment happens in Home Chat, and only where the caller may see it. */
  canOpenInChat: boolean;
}

export interface ScheduledView {
  source: "hermes_cron" | "unavailable";
  entries: ScheduledEntry[];
  updatedAt: string;
  /**
   * False when live jobs exist but not one of them announces a next run. Every row would then read
   * `unclear`, which looks like a judgement about the jobs when it is really a gap in what the
   * runtime reports. The surface says that once, plainly, instead of repeating it per row.
   */
  nextRunsReported: boolean;
}

/** The canonical `HermesApiJob` fields this view model reads. */
export interface ScheduledJobInput {
  id: string;
  name: string;
  visibility: "full" | "summary" | "hidden";
  prompt: string;
  schedule: unknown;
  scheduleDisplay: string;
  enabled: boolean;
  state: string;
  deliver: unknown;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
}

/** A run due within this many minutes is still in flight, not late. */
export const scheduledLateGraceMinutes = 5;

const purposeLimit = 180;
const failureStatuses = new Set(["failed", "failure", "error", "errored", "crashed", "timeout", "timed_out"]);
const successStatuses = new Set(["ok", "success", "succeeded", "successful", "completed", "complete", "done", "finished"]);
const pausedStates = new Set(["paused", "disabled", "stopped", "inactive"]);
// A native state we recognize as "this will fire again". Anything outside these three sets is
// reported as unknown rather than being rounded up to a green "Active".
const activeStates = new Set(["scheduled", "active", "enabled", "running", "pending", "queued", "waiting", "idle", "ok"]);
const failedStates = new Set(["error", "errored", "failed", "failing", "cancelled", "canceled", "expired", "crashed"]);
const aiRouteMismatchMarkers = [/inference config drifted/i, /this job is unpinned/i, /prevent unintended spend/i];
const cronWeekdays: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function text(value: unknown, limit = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > limit ? `${trimmed.slice(0, limit - 3)}...` : trimmed;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function instant(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(?:Z|[+-](\d{2}):(\d{2}))?$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);
  const offsetHour = Number(match[8] ?? 0);
  const offsetMinute = Number(match[9] ?? 0);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (
    month < 1 || month > 12 || day < 1 || day > (daysInMonth[month - 1] ?? 0) ||
    hour > 23 || minute > 59 || second > 59 || offsetHour > 23 || offsetMinute > 59
  ) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function positiveInt(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

function minuteOfHour(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 59 ? parsed : null;
}

function clockTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** "8:5", "08:05", "08:05:30" -> "08:05". Anything else stays as written. */
function normalizeTime(value: unknown): string | null {
  const raw = text(value, 40);
  if (!raw) return null;
  const match = /^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/.exec(raw);
  if (!match) return raw;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return raw;
  return clockTime(hour, minute);
}

function cronValue(token: string, max: number, names?: Record<string, number>): number | null {
  const named = names?.[token];
  const parsed = named ?? (/^\d+$/.test(token) ? Number(token) : null);
  return parsed == null || parsed > max ? null : parsed;
}

/**
 * A cron field as a sorted list of numbers, or null when it is a form we do not read. Lists and
 * ranges are both expanded, so `1-5` and `MON-FRI` become real weekdays instead of falling back to
 * the raw expression.
 */
function cronField(field: string, max: number, names?: Record<string, number>): number[] | null {
  const values: number[] = [];
  for (const part of field.split(",")) {
    const token = part.trim().toLowerCase();
    if (!token) return null;
    const range = /^([a-z0-9]+)-([a-z0-9]+)$/.exec(token);
    if (range) {
      const from = cronValue(range[1] ?? "", max, names);
      const to = cronValue(range[2] ?? "", max, names);
      if (from == null || to == null || to < from || to - from > max) return null;
      for (let value = from; value <= to; value += 1) values.push(value);
      continue;
    }
    const single = cronValue(token, max, names);
    if (single == null) return null;
    values.push(single);
  }
  return [...new Set(values)].sort((left, right) => left - right);
}

/** A cron field that must name exactly one value, e.g. the hour of a daily job. */
function cronSingle(field: string, max: number): number | null {
  const values = cronField(field, max);
  return values?.length === 1 ? (values[0] ?? null) : null;
}

/**
 * `*​/N` is an even cadence only when N divides its field's period: `*​/20` minutes really is every
 * 20 minutes, while `*​/5` hours fires at 0,5,10,15,20 and then waits four hours. An uneven step is
 * rejected so the surface falls back to the runtime's own words instead of claiming a wrong rhythm.
 */
function cronStep(field: string, period: number): number | null {
  const match = /^\*\/(\d+)$/.exec(field.trim());
  if (!match) return null;
  const step = Number(match[1]);
  return step > 0 && step < period && period % step === 0 ? step : null;
}

/**
 * Every wall-clock time a minute field and an hour field name together, sorted.
 * `0 8,17` is 08:00 and 17:00; `0,30 9` is 09:00 and 09:30. A combination that
 * would name more than a dozen times is refused rather than printed as a list
 * nobody reads.
 */
function cronTimes(minuteField: string, hourField: string): string[] | null {
  const minutes = cronField(minuteField, 59);
  const hours = cronField(hourField, 23);
  if (!minutes || !hours || minutes.length * hours.length > 12) return null;
  return hours
    .flatMap((hour) => minutes.map((minute) => clockTime(hour, minute)))
    .sort((left, right) => left.localeCompare(right));
}

/**
 * Standard five-field cron. Lists and ranges are read; anything else — a month restriction, a mixed
 * day-and-weekday rule, an uneven step — returns null on purpose so the caller can fall back rather
 * than describe a rhythm that is not the real one.
 */
function rhythmFromCron(expression: string): ScheduledRhythm | null {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return null;
  const minuteField = fields[0] ?? "";
  const hourField = fields[1] ?? "";
  const dayField = fields[2] ?? "";
  const monthField = fields[3] ?? "";
  const weekdayField = fields[4] ?? "";
  if (monthField !== "*") return null;

  const everyMinutes = cronStep(minuteField, 60);
  if (everyMinutes && hourField === "*" && dayField === "*" && weekdayField === "*") {
    return { kind: "minutes", every: everyMinutes };
  }

  const singleMinute = cronSingle(minuteField, 59);

  if (hourField === "*" && dayField === "*" && weekdayField === "*") {
    return singleMinute == null ? null : { kind: "hourly", every: 1, minute: singleMinute };
  }
  const everyHours = cronStep(hourField, 24);
  if (everyHours && dayField === "*" && weekdayField === "*") {
    return singleMinute == null ? null : { kind: "hourly", every: everyHours, minute: singleMinute };
  }

  // Every wall-clock time this expression fires at, not just the first. The two
  // automations that ship with Ranked Tasks run at `0 8,17 * * *` and
  // `15 8,17 * * *`; reading a single hour rejected both and left the raw cron
  // expression standing on the customer's screen.
  const times = cronTimes(minuteField, hourField);
  if (!times) return null;

  // A day-of-month step has no even cadence — months are 28 to 31 days long — so it is not read as
  // "every N days" here.
  if (weekdayField !== "*" && dayField === "*") {
    const weekdays = cronField(weekdayField, 7, cronWeekdays);
    if (!weekdays) return null;
    // Both 0 and 7 mean Sunday in cron; the view model always says 0.
    const normalized = [...new Set(weekdays.map((day) => (day === 7 ? 0 : day)))].sort((left, right) => left - right);
    // Every weekday listed is simply every day; nobody reads it as a list of seven.
    if (normalized.length === 7) return { kind: "daily", every: 1, times };
    return { kind: "weekly", weekdays: normalized, times };
  }
  if (dayField !== "*" && weekdayField === "*") {
    const days = cronField(dayField, 31);
    if (!days || days.some((day) => day < 1)) return null;
    return { kind: "monthly", days, times };
  }
  if (dayField === "*" && weekdayField === "*") {
    return { kind: "daily", every: 1, times };
  }
  return null;
}

function rhythmFromMinutes(minutes: number): ScheduledRhythm {
  if (minutes % 1440 === 0) return { kind: "daily", every: minutes / 1440, times: [] };
  if (minutes % 60 === 0) return { kind: "hourly", every: minutes / 60, minute: null };
  return { kind: "minutes", every: minutes };
}

function rhythmFromSchedule(schedule: unknown, scheduleDisplay: string): ScheduledRhythm {
  const asText = text(schedule, 200);
  if (asText) {
    const parsed = rhythmFromCron(asText);
    if (parsed) return parsed;
  }

  const object = record(schedule);
  if (object) {
    const cron = text(object.cron ?? object.expression, 200);
    if (cron) {
      const parsed = rhythmFromCron(cron);
      if (parsed) return parsed;
    }
    const kind = text(object.kind ?? object.type, 40)?.toLowerCase();
    const time = normalizeTime(object.time ?? object.at ?? object.hour);
    const times = time ? [time] : [];
    if (kind === "interval") {
      const minutes = positiveInt(object.minutes ?? object.every_minutes ?? object.everyMinutes);
      if (minutes) return rhythmFromMinutes(minutes);
    }
    if (kind === "hourly") {
      return { kind: "hourly", every: positiveInt(object.hours ?? object.every) ?? 1, minute: minuteOfHour(object.minute) };
    }
    if (kind === "daily") return { kind: "daily", every: positiveInt(object.days ?? object.every) ?? 1, times };
    if (kind === "weekly") {
      const weekdays = Array.isArray(object.weekdays ?? object.days)
        ? ((object.weekdays ?? object.days) as unknown[])
            .map((day) => (typeof day === "number" ? day : cronWeekdays[String(day).slice(0, 3).toLowerCase()]))
            .filter((day): day is number => day != null && Number.isInteger(day) && day >= 0 && day <= 6)
        : [];
      if (weekdays.length) {
        return { kind: "weekly", weekdays: [...new Set(weekdays)].sort((left, right) => left - right), times };
      }
    }
    if (kind === "monthly") {
      const days = Array.isArray(object.days)
        ? (object.days as unknown[]).map((day) => positiveInt(day)).filter((day): day is number => day != null && day <= 31)
        : [];
      if (days.length) return { kind: "monthly", days: [...new Set(days)].sort((a, b) => a - b), times };
    }
    if (kind === "once" || kind === "one_off" || kind === "oneoff") {
      const at = text(object.at ?? object.runAt ?? object.run_at, 60);
      return { kind: "once", at: at && instant(at) != null ? at : null };
    }
    const display = text(object.display, 200);
    if (display) return { kind: "runtime", display };
  }

  const runtimeDisplay = text(scheduleDisplay, 200);
  if (runtimeDisplay) return { kind: "runtime", display: runtimeDisplay };
  return asText ? { kind: "runtime", display: asText } : { kind: "unknown" };
}

/**
 * The rhythm behind a native job's schedule, for a surface that wants to say it
 * in its own words. Cron is a machine's way of writing an appointment down; a
 * customer's screen shows the appointment.
 */
export function scheduledRhythm(schedule: unknown, scheduleDisplay = ""): ScheduledRhythm {
  return rhythmFromSchedule(schedule, scheduleDisplay);
}

function isPaused(job: ScheduledJobInput): boolean {
  return !job.enabled || pausedStates.has(job.state.trim().toLowerCase());
}

function lastRunOf(job: ScheduledJobInput): ScheduledLastRun {
  const rawAt = job.lastRunAt?.trim() ?? "";
  const parsedAt = instant(rawAt);
  const at = parsedAt == null ? null : rawAt;
  const status = job.lastStatus?.trim().toLowerCase() ?? "";
  const rawReason = text(job.lastError, purposeLimit);
  const reason = rawReason ? safeHermesConsumerText(rawReason) : null;
  const failure = scheduledRunFailure(job.lastStatus, job.lastError);
  // A condition we can name is said in this product's own words. The runtime's sentence is
  // written for an operator, so it is not carried to a reader who can only be confused by it.
  if (failure) {
    return { kind: "failed", at, reason: failure.cause === "unstated" ? reason : null, cause: failure.cause };
  }
  if (rawAt && parsedAt == null) return { kind: "unknown" };
  if (!at && !status) return { kind: "never" };
  if (successStatuses.has(status)) return { kind: "ok", at };
  // A run the runtime did not label is not a run that went well: report that it happened, and
  // whatever the runtime called it, without claiming success.
  return { kind: "unclear", at, status: job.lastStatus?.trim() ?? "" };
}

/**
 * The one reading of `lastStatus` and `lastError` every surface shares: did the run fail, and is
 * its condition one we can name. `null` when nothing says the run failed.
 */
export function scheduledRunFailure(
  lastStatus: string | null,
  lastError: string | null,
): Readonly<{ cause: ScheduledFailureCause }> | null {
  const status = lastStatus?.trim().toLowerCase() ?? "";
  const written = lastError?.trim() ?? "";
  if (!failureStatuses.has(status) && !written) return null;
  return Object.freeze({
    cause: aiRouteMismatchMarkers.some((marker) => marker.test(written)) ? "ai_route_mismatch" : "unstated",
  });
}

function nextRunOf(job: ScheduledJobInput, now: number): ScheduledNextRun {
  if (isPaused(job)) return { kind: "none" };
  const at = instant(job.nextRunAt);
  if (at == null || !job.nextRunAt) return { kind: "unknown" };
  const minutes = Math.round((at - now) / 60000);
  if (minutes < -scheduledLateGraceMinutes) return { kind: "overdue", at: job.nextRunAt, minutesLate: -minutes };
  return { kind: "upcoming", at: job.nextRunAt, inMinutes: Math.max(minutes, 0) };
}

function statusOf(job: ScheduledJobInput, nextRun: ScheduledNextRun, lastRun: ScheduledLastRun): ScheduledStatus {
  if (isPaused(job)) return "paused";
  const state = job.state.trim().toLowerCase();
  if (failedStates.has(state) || lastRun.kind === "failed" || nextRun.kind === "overdue") return "attention";
  // Without an announced next run nothing here says the job will fire again, whatever its state
  // word claims. The API fills that word in for every job, so it cannot carry this on its own.
  if (nextRun.kind !== "upcoming") return "unknown";
  if (activeStates.has(state) || !state) return "active";
  // A state we do not recognize is not evidence of health.
  return "unknown";
}

function deliveryOf(deliver: unknown): string | null {
  const asText = text(deliver, 80);
  if (asText) return asText;
  const object = record(deliver);
  if (!object) return null;
  return text(object.channel ?? object.kind ?? object.target ?? object.to, 80);
}

const statusOrder: Record<ScheduledStatus, number> = { attention: 0, active: 1, unknown: 2, paused: 3 };

function sortKey(entry: ScheduledEntry): [number, number, string] {
  const at =
    entry.nextRun.kind === "upcoming" || entry.nextRun.kind === "overdue"
      ? (instant(entry.nextRun.at) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;
  return [statusOrder[entry.status], at, entry.title.toLowerCase()];
}

export function scheduledEntryFromJob(job: ScheduledJobInput, now: number): ScheduledEntry {
  const restricted = job.visibility !== "full";
  const lastRun = lastRunOf(job);
  const nextRun = nextRunOf(job, now);
  return {
    id: job.id,
    title: text(job.name, 120) ?? job.id,
    status: restricted ? "unknown" : statusOf(job, nextRun, lastRun),
    restricted,
    rhythm: restricted ? { kind: "unknown" } : rhythmFromSchedule(job.schedule, job.scheduleDisplay),
    nextRun: restricted ? { kind: "unknown" } : nextRun,
    // A withheld job has no outcome to report; saying "never ran" would be a claim we cannot make.
    lastRun: restricted ? { kind: "unknown" } : lastRun,
    purpose: restricted ? null : text(job.prompt, purposeLimit),
    delivery: restricted ? null : deliveryOf(job.deliver),
    canOpenInChat: !restricted,
  };
}

/**
 * Build the Scheduled view. Entries needing attention come first, then the ones
 * that will run soonest, so a broken appointment cannot hide at the bottom.
 */
export function scheduledViewFromJobs(
  jobs: ScheduledJobInput[],
  now: number = Date.now(),
  updatedAt: string = new Date(now).toISOString(),
): ScheduledView {
  const entries = jobs
    .filter((job) => job.visibility !== "hidden")
    .map((job) => scheduledEntryFromJob(job, now));
  entries.sort((left, right) => {
    const [leftStatus, leftAt, leftTitle] = sortKey(left);
    const [rightStatus, rightAt, rightTitle] = sortKey(right);
    return leftStatus - rightStatus || leftAt - rightAt || leftTitle.localeCompare(rightTitle);
  });
  const live = entries.filter((entry) => !entry.restricted && entry.nextRun.kind !== "none");
  const nextRunsReported =
    !live.length || live.some((entry) => entry.nextRun.kind === "upcoming" || entry.nextRun.kind === "overdue");
  return { source: "hermes_cron", entries, updatedAt, nextRunsReported };
}

export function unavailableScheduledView(updatedAt: string = new Date().toISOString()): ScheduledView {
  return { source: "unavailable", entries: [], updatedAt, nextRunsReported: true };
}
