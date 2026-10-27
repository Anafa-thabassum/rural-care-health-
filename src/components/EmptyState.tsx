import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "default" | "error";
}

export function EmptyState({ icon: Icon, title, description, action, tone = "default" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span
        className={
          tone === "error"
            ? "grid size-10 place-items-center rounded-full bg-err-soft text-err"
            : "grid size-10 place-items-center rounded-full bg-accent-soft text-accent"
        }
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-semibold tracking-tight">{title}</p>
      <p className="mt-1 max-w-[42ch] text-sm text-ink-soft text-pretty">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
