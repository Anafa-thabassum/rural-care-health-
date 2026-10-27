import type { SyncStatus } from "@/data/mockData";
import { cn } from "@/lib/utils";

const styles: Record<SyncStatus, { wrap: string; dot: string; label: string }> = {
  synced: { wrap: "bg-ok-soft text-ok", dot: "bg-ok", label: "Synced" },
  pending: { wrap: "bg-warn-soft text-warn", dot: "bg-warn", label: "Pending" },
  syncing: { wrap: "bg-accent-soft text-accent", dot: "bg-accent", label: "Syncing" },
  failed: { wrap: "bg-err-soft text-err", dot: "bg-err", label: "Failed" },
};

export function StatusPill({ status, className }: { status: SyncStatus; className?: string }) {
  const s = styles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        s.wrap,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
