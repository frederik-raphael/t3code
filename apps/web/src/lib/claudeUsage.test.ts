import { EventId, type OrchestrationThreadActivity, TurnId } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import {
  deriveLatestClaudeUsage,
  formatClaudeUsagePercent,
  formatClaudeUsageReset,
  formatClaudeUsageWindow,
} from "./claudeUsage";

function activity(id: string, payload: unknown): OrchestrationThreadActivity {
  return {
    id: EventId.make(id),
    tone: "info",
    kind: "account.rate-limit.updated",
    summary: "Claude usage updated",
    payload,
    turnId: TurnId.make("turn-1"),
    createdAt: "2026-08-24T13:00:00.000Z",
  };
}

describe("claudeUsage", () => {
  it("uses the latest valid rate-limit activity", () => {
    const snapshot = deriveLatestClaudeUsage([
      activity("old", { status: "allowed", utilization: 0.07, resetsAt: 1_787_058_000 }),
      activity("latest", {
        status: "allowed_warning",
        utilization: 0.92,
        resetsAt: 1_787_058_000,
        rateLimitType: "five_hour",
      }),
    ]);

    expect(snapshot).toMatchObject({
      status: "allowed_warning",
      utilization: 0.92,
      resetsAt: 1_787_058_000,
      rateLimitType: "five_hour",
    });
  });

  it("normalizes percentage-shaped utilization from older payloads", () => {
    expect(
      deriveLatestClaudeUsage([activity("percent", { status: "allowed", utilization: 92 })])
        ?.utilization,
    ).toBe(0.92);
  });

  it("formats the composer label", () => {
    expect(formatClaudeUsagePercent(0.07)).toBe("7%");
    expect(formatClaudeUsagePercent(null, "rejected")).toBe("100%");
    expect(formatClaudeUsageWindow("seven_day_opus")).toBe("7-day Opus window");
  });

  it("formats a reset timestamp in the viewer's local time", () => {
    expect(formatClaudeUsageReset(1_787_058_000)).toBeTruthy();
  });
});
