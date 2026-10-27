import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "ok" | "err";
}

const tones = {
  default: "text-ink",
  warn: "text-warn",
  ok: "text-ok",
  err: "text-err",
};

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <div className="bg-panel rounded-lg ring-1 ring-black/5 p-4 sm:p-5">
      <p className="label-mono">{label}</p>
      <p className={cn("mt-2 text-3xl font-mono font-medium tracking-tight", tones[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}
