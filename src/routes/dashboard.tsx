import { createFileRoute, Link } from "@tanstack/react-router";
import { UserPlus, FileText, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";
import { useApp } from "@/context/AppContext";
import { actionButton } from "@/components/ActionButton";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RuralCare" },
      {
        name: "description",
        content:
          "Daily overview of patients seen, records captured and changes waiting to sync with the central server.",
      },
      { property: "og:title", content: "Dashboard — RuralCare" },
      { property: "og:description", content: "Your field clinic at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { patients, records, syncQueue, worker, lastSync, isOnline } = useApp();
  const pending = syncQueue.filter((i) => i.status === "pending" || i.status === "syncing").length;
  const failed = syncQueue.filter((i) => i.status === "failed").length;
  const recent = [...records].slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Overview"
        title={`Good day, ${worker.name.split(" ").slice(-1)[0]}`}
        description={`${worker.clinic} · last sync ${lastSync ?? "never"}`}
        actions={
          <>
            <Link to="/patients/new" className={actionButton({ variant: "quiet" })}>
              <UserPlus className="size-4" /> Add patient
            </Link>
            <Link to="/records" className={actionButton()}>
              <FileText className="size-4" /> New record
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered patients" value={patients.length} hint="Stored on this device" />
        <StatCard label="Medical records" value={records.length} hint="Across all patients" />
        <StatCard label="Pending sync" value={pending} tone="warn" hint="Waiting for connectivity" />
        <StatCard label="Failed uploads" value={failed} tone="err" hint="Need a retry" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 bg-panel rounded-lg ring-1 ring-black/5">
          <header className="flex items-center justify-between px-5 py-3.5 border-b border-rule">
            <h2 className="text-sm font-semibold tracking-tight">Recent activity</h2>
            <Link to="/records" className="text-xs text-accent hover:underline underline-offset-4">
              View all records
            </Link>
          </header>
          <ul className="divide-y divide-rule">
            {recent.map((r) => {
              const patient = patients.find((p) => p.id === r.patientId);
              return (
                <li key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{patient?.name ?? r.patientId}</p>
                    <p className="truncate text-xs text-ink-soft">
                      {r.type} · {r.diagnosis}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[11px] text-ink-soft">{r.visitDate}</span>
                    <StatusPill status={r.syncStatus} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-panel rounded-lg ring-1 ring-black/5">
          <header className="flex items-center justify-between px-5 py-3.5 border-b border-rule">
            <h2 className="text-sm font-semibold tracking-tight">Sync status</h2>
            <StatusPill status={isOnline ? "synced" : "pending"} />
          </header>
          <div className="p-5 space-y-4">
            <p className="text-sm text-ink-soft text-pretty">
              {isOnline
                ? "Connected. Queued changes upload automatically."
                : "Offline. Changes are held safely on this device."}
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Queue length</dt>
                <dd className="font-mono">{syncQueue.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Last sync</dt>
                <dd className="font-mono">{lastSync ?? "—"}</dd>
              </div>
            </dl>
            <Link to="/sync" className={actionButton({ variant: "quiet", size: "block" })}>
              <RefreshCw className="size-4" /> Open Sync Center
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
