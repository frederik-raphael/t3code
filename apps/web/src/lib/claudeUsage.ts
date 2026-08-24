import type { OrchestrationThreadActivity } from "@t3tools/contracts";

export type ClaudeUsageStatus = "allowed" | "allowed_warning" | "rejected";

export type ClaudeUsageSnapshot = {
  readonly status: ClaudeUsageStatus;
  readonly utilization: number | null;
  readonly resetsAt: number | null;
  readonly rateLimitType: string | null;
  readonly updatedAt: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeUtilization(value: number | null): number | null {
  if (value === null) return null;
  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, normalized));
}

function normalizeEpochSeconds(value: number | null): number | null {
  if (value === null || value <= 0) return null;
  return value > 100_000_000_000 ? value / 1000 : value;
}

export function deriveLatestClaudeUsage(
  activities: ReadonlyArray<OrchestrationThreadActivity>,
): ClaudeUsageSnapshot | null {
  for (let index = activities.length - 1; index >= 0; index -= 1) {
    const activity = activities[index];
    if (!activity || activity.kind !== "account.rate-limit.updated") continue;

    const payload = asRecord(activity.payload);
    const status = payload?.status;
    if (status !== "allowed" && status !== "allowed_warning" && status !== "rejected") {
      continue;
    }

    return {
      status,
      utilization: normalizeUtilization(asFiniteNumber(payload?.utilization)),
      resetsAt: normalizeEpochSeconds(asFiniteNumber(payload?.resetsAt)),
      rateLimitType: typeof payload?.rateLimitType === "string" ? payload.rateLimitType : null,
      updatedAt: activity.createdAt,
    };
  }

  return null;
}

export function formatClaudeUsagePercent(utilization: number | null, status?: ClaudeUsageStatus) {
  if (utilization === null) {
    return status === "rejected" ? "100%" : null;
  }
  return `${Math.round(utilization * 100)}%`;
}

export function formatClaudeUsageReset(resetsAt: number | null): string | null {
  if (resetsAt === null) return null;

  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(new Date(resetsAt * 1000));
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  const period = parts.find((part) => part.type === "dayPeriod")?.value.toLowerCase();
  if (!hour || !minute) return null;
  return `${hour}${minute === "00" ? "" : `:${minute}`}${period ? period : ""}`;
}

export function formatClaudeUsageWindow(rateLimitType: string | null): string {
  switch (rateLimitType) {
    case "five_hour":
      return "5-hour window";
    case "seven_day":
      return "7-day window";
    case "seven_day_opus":
      return "7-day Opus window";
    case "seven_day_sonnet":
      return "7-day Sonnet window";
    case "overage":
      return "Overage window";
    default:
      return "Claude usage window";
  }
}
