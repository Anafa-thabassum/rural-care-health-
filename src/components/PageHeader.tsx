import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">{eyebrow}</p>
        <h1 className="mt-1.5 text-2xl lg:text-3xl font-semibold tracking-tight max-w-[24ch] text-balance">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm text-ink-soft max-w-[52ch] text-pretty">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
