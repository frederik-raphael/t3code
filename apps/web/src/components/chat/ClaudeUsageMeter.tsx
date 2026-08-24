import { Button } from "../ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import {
  formatClaudeUsagePercent,
  formatClaudeUsageReset,
  formatClaudeUsageWindow,
  type ClaudeUsageSnapshot,
} from "../../lib/claudeUsage";

function usageColor(usage: ClaudeUsageSnapshot): string {
  if (usage.status === "rejected") return "text-error";
  if (usage.status === "allowed_warning") return "text-amber-500";
  return "text-emerald-500";
}

export function ClaudeUsageMeter(props: { usage: ClaudeUsageSnapshot }) {
  const { usage } = props;
  const percent = formatClaudeUsagePercent(usage.utilization, usage.status);
  const reset = formatClaudeUsageReset(usage.resetsAt);
  if (!percent) return null;

  const label = `Claude usage: ${percent}${reset ? `, resets at ${reset}` : ""}`;

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={150}
        closeDelay={0}
        render={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={`h-auto min-h-4 shrink-0 justify-start px-0 text-xs font-medium leading-4 hover:bg-transparent ${usageColor(usage)}`}
            aria-label={label}
          />
        }
      >
        {percent} Usage{reset ? ` (${reset} reset)` : ""}
      </PopoverTrigger>
      <PopoverPopup
        tooltipStyle
        side="top"
        align="start"
        viewportClassName="p-0"
        className="w-60 max-w-none text-left whitespace-normal"
      >
        <div className="flex flex-col gap-1 p-[var(--floating-content-inset)]">
          <div className="font-medium text-foreground text-xs">
            {formatClaudeUsageWindow(usage.rateLimitType)}
          </div>
          <div className="text-secondary-label text-[11px] leading-4">
            {percent} used
            {reset ? ` · resets at ${reset}` : ""}
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
