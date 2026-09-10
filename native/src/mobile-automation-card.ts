import { scheduledRhythm, type AppLocale, type HermesAutomationJob, type ScheduledRhythm } from "../core/index";
import {
  rankedTaskAutomationLabels,
  type RankedTaskAutomationRole,
  type RankedTaskAutomationResultStatus,
  type RankedTaskAutomationView,
} from "../core/ranked-task-automations";

/**
 * One automation, however it got onto the customer's server (HPD-463).
 *
 * An automation the customer wrote and an automation that shipped with Ranked
 * Tasks arrive over two different routes — `GET /workspace/automations` and
 * `GET /ranked-tasks/automations` — and used to be drawn by two different
 * components with two different sets of controls. This is the one shape both
 * routes are read into, so there is one card to draw and the differences
 * between the two are the four flags below and nothing else.
 *
 * Nothing here knows the name of any particular automation. A shipped
 * automation is titled with the name it carries, exactly like one the customer
 * wrote, so a third shipped automation needs no line of code here.
 */
export type AutomationCardVersion = Readonly<{
  version: number;
  reason: string;
  active: boolean;
}>;

export type AutomationCardModel = Readonly<{
  /** Stable across a reload, so an opened version history stays open. */
  key: string;
  title: string;
  status: "active" | "paused" | "unknown";
  rhythm: ScheduledRhythm;
  purpose: string | null;
  nextRunAt: string | null;
  delivery: string | null;
  /**
   * Whether the automation is meant to be running. `null` when the runtime
   * does not say, which is not the same as paused and is never rounded up to
   * it: the control is shown and left shut rather than guessing a direction.
   */
  enabled: boolean | null;
  /** Came with the product: carries the Standard mark, Reset and Versions. */
  shipped: boolean;
  /** Only what the customer wrote themselves can be edited field by field. */
  editable: boolean;
  /**
   * HPD-463, Justus: a shipped automation cannot be deleted, it is reset or
   * paused. Only what the customer wrote can be taken away, and only after a
   * confirmation that names it.
   */
  deletable: boolean;
  /** Its job is gone from the runtime, so there is a way back to offer. */
  reinstallable: boolean;
  /** One sentence about why this automation is not doing its work. */
  notice: string | null;
  /** Structured result truth for shipped scanner/ranker jobs; custom jobs have no such result contract. */
  resultStatus: RankedTaskAutomationResultStatus | null;
  /** The exact result was stored even though this run separately reported a native delivery/route failure. */
  nativeFailureAfterStoredResult: boolean;
  versions: readonly AutomationCardVersion[];
  /** Set for a shipped automation; the role its mutations are addressed to. */
  role: RankedTaskAutomationRole | null;
  /** Set for an automation the customer wrote; the native job it stands for. */
  jobId: string | null;
}>;

export function automationCardFromJob(job: HermesAutomationJob): AutomationCardModel {
  return {
    key: `job:${job.id}`,
    title: job.title,
    status: job.status,
    enabled: job.status === "paused" ? false : job.status === "active" ? true : null,
    // The runtime hands its own `scheduleDisplay` through as `schedule`; it is a
    // cron expression often enough that it can only be read, never printed.
    rhythm: scheduledRhythm(job.schedule, job.schedule),
    purpose: job.summary,
    nextRunAt: job.nextRunAt,
    delivery: job.delivery,
    shipped: false,
    editable: true,
    deletable: true,
    reinstallable: false,
    notice: null,
    resultStatus: null,
    nativeFailureAfterStoredResult: false,
    versions: [],
    role: null,
    jobId: job.id,
  };
}

export function automationCardFromManaged(automation: RankedTaskAutomationView): AutomationCardModel {
  return {
    key: `managed:${automation.metadata.role}`,
    title: automation.snapshot.name,
    status: automation.enabled ? "active" : "paused",
    enabled: automation.enabled,
    rhythm: scheduledRhythm(automation.snapshot.schedule),
    purpose: null,
    nextRunAt: automation.nextRunAt,
    delivery: automation.snapshot.delivery,
    shipped: true,
    editable: false,
    deletable: false,
    reinstallable: automation.stalled === "missing",
    notice: automation.stalled ? rankedTaskAutomationLabels.stalled[automation.stalled] : null,
    resultStatus: automation.resultStatus,
    nativeFailureAfterStoredResult: automation.resultStatus === "stored"
      && (automation.stalled === "failing" || automation.stalled === "ai_route"),
    versions: automation.versions.map((version) => ({
      version: version.version,
      reason: version.reason,
      active: version.version === automation.metadata.activeUserVersion,
    })),
    role: automation.metadata.role,
    jobId: automation.metadata.nativeJobId,
  };
}

/**
 * A structured result and the runtime's later delivery state are independent
 * receipts. When both exist, keep the failure visible without reusing the
 * generic stall sentence that says no result was stored.
 */
export function automationCardNotice(
  automation: Pick<AutomationCardModel, "notice" | "nativeFailureAfterStoredResult">,
  storedResultFailure: string,
): string | null {
  return automation.nativeFailureAfterStoredResult && automation.notice
    ? storedResultFailure
    : automation.notice;
}

export type AutomationScheduleCopy = Readonly<{
  /** How often, without a time of day. The times are appended after a comma. */
  daily: string;
  everyDays: string;
  weekdays: string;
  monthly: string;
  hourly: string;
  everyHours: string;
  everyMinutes: string;
  once: string;
  unknown: string;
  and: string;
}>;

/**
 * A cron expression is how a machine writes an appointment down. This is the
 * appointment: "täglich, 8:00 und 17:00 MEZ".
 *
 * Whatever cannot be read as a rhythm is said as "the schedule is saved in
 * Hermes" rather than shown raw, because the raw form is the cron expression
 * that has no business on a customer's screen. That includes the runtime's own
 * wording, which is a cron expression often enough not to be trusted with it.
 */
export function automationScheduleSentence(
  rhythm: ScheduledRhythm,
  timeZone: string | null,
  locale: AppLocale,
  copy: AutomationScheduleCopy,
): string {
  const zone = timeZoneAbbreviation(timeZone, locale);
  // How often, then at what time, then in which zone — the order a person says
  // an appointment in, and each part left out when there is nothing to say.
  const sentence = (cadence: string, times: readonly string[] = []) => {
    if (!times.length) return cadence;
    const clock = joinWords(times.map((time) => wallClock(time, locale)), copy.and);
    return `${cadence}, ${zone ? `${clock} ${zone}` : clock}`;
  };

  switch (rhythm.kind) {
    case "daily":
      return sentence(
        rhythm.every === 1 ? copy.daily : copy.everyDays.replace("{count}", String(rhythm.every)),
        rhythm.times,
      );
    case "weekly":
      return sentence(
        copy.weekdays.replace("{weekdays}", joinWords(rhythm.weekdays.map((day) => weekdayName(day, locale)), copy.and)),
        rhythm.times,
      );
    case "monthly":
      return sentence(
        copy.monthly.replace("{days}", joinWords(rhythm.days.map((day) => monthDayName(day, locale)), copy.and)),
        rhythm.times,
      );
    case "hourly":
      return rhythm.every === 1 && rhythm.minute != null
        ? copy.hourly.replace("{minute}", String(rhythm.minute).padStart(2, "0"))
        : copy.everyHours.replace("{count}", String(rhythm.every));
    case "minutes":
      return copy.everyMinutes.replace("{count}", String(rhythm.every));
    case "once": {
      if (!rhythm.at) return copy.unknown;
      const at = new Date(rhythm.at);
      return Number.isNaN(at.getTime()) ? copy.unknown : copy.once.replace("{date}", at.toLocaleString(locale));
    }
    default:
      return copy.unknown;
  }
}

/**
 * "MEZ" for a German reader in Zurich, "GMT+1" for an English one. The zone the
 * cron field is written in belongs beside the time; without it "9:00" is a
 * guess about which clock the customer is reading.
 */
export function timeZoneAbbreviation(timeZone: string | null, locale: AppLocale): string | null {
  if (!timeZone) return null;
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "short" }).formatToParts(new Date());
    return parts.find((part) => part.type === "timeZoneName")?.value?.trim() || null;
  } catch {
    return null;
  }
}

/** "08:00" as the reader's own clock: "8:00 AM" in English, "8:00" elsewhere. */
function wallClock(time: string, locale: AppLocale): string {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return time;
  const hour = Number(match[1]);
  const minute = match[2] ?? "00";
  if (!locale.startsWith("en")) return `${hour}:${minute}`;
  const suffix = hour < 12 ? "AM" : "PM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${minute} ${suffix}`;
}

/** Sunday is 0, the way cron counts. */
function weekdayName(day: number, locale: AppLocale): string {
  const reference = new Date(Date.UTC(2024, 0, 7 + day));
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "short" }).format(reference);
  } catch {
    return String(day);
  }
}

function monthDayName(day: number, locale: AppLocale): string {
  return locale.startsWith("en") ? String(day) : `${day}.`;
}

function joinWords(values: readonly string[], and: string): string {
  if (values.length <= 1) return values[0] ?? "";
  return `${values.slice(0, -1).join(", ")}${and}${values[values.length - 1]}`;
}
