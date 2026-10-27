import { createFileRoute } from "@tanstack/react-router";
import { CloudUpload, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import { ActionButton } from "@/components/ActionButton";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/sync")({
  head: () => ({
    meta: [
      { title: "Sync Center — RuralCare" },
      {
        name: "description",
        content:
          "Monitor the offline change queue, retry failed uploads and push local records to the central server.",
      },
      { property: "og:title", content: "Sync Center — RuralCare" },
      { property: "og:description", content: "Every pending change, in one queue." },
    ],
  }),
  component: SyncPage,
});

function SyncPage() {
  const { syncQueue, isOnline, isSyncing, syncProgress, syncNow, lastSync } = useApp();
  const pending = syncQueue.filter((i) => i.status === "pending").length;
  const failed = syncQueue.filter((i) => i.status === "failed").length;
  const synced = syncQueue.filter((i) => i.status === "synced").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Synchronization"
        title="Sync Center"
        description={
          isOnline
            ? "Connected to the central server. Queued changes upload automatically."
            : "No connection. Changes are safely stored on this device."
        }
        actions={
          <ActionButton onClick={() => void syncNow()} disabled={!isOnline || isSyncing || pending + failed === 0}>
            <RefreshCw className={isSyncing ? "size-4 animate-spin" : "size-4"} />
            {isSyncing ? "Syncing…" : "Sync now"}
          </ActionButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={pending} tone="warn" />
        <StatCard label="Failed" value={failed} tone="err" />
        <StatCard label="Synced" value={synced} tone="ok" />
        <StatCard label="Last sync" value={lastSync ?? "—"} hint="Device clock" />
      </div>

      {isSyncing ? (
        <div className="bg-panel rounded-lg ring-1 ring-black/5 p-5">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium">Uploading queued changes</p>
            <span className="font-mono text-xs text-ink-soft">{syncProgress}%</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-paper overflow-hidden">
            <div
              className="h-full bg-accent transition-[width] duration-300"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      <section className="bg-panel rounded-lg ring-1 ring-black/5 overflow-hidden">
        <header className="px-5 py-3.5 border-b border-rule">
          <h2 className="text-sm font-semibold tracking-tight">Change queue</h2>
        </header>
        {syncQueue.length === 0 ? (
          <EmptyState
            icon={CloudUpload}
            title="Queue is empty"
            description="Everything captured on this device has reached the central server."
          />
        ) : (
          <ul className="divide-y divide-rule">
            {syncQueue.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.patientName}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {item.changeType} · {item.patientId}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[11px] text-ink-soft">{item.date}</span>
                  <StatusPill status={item.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
