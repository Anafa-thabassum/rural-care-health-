import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ActionButton } from "@/components/ActionButton";
import { Field, TextInput } from "@/components/Field";
import { useApp } from "@/context/AppContext";
import { clearLocalCache } from "@/services/api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — RuralCare" },
      {
        name: "description",
        content:
          "Review your worker profile, manage offline storage on this device and sign out of RuralCare.",
      },
      { property: "og:title", content: "Settings — RuralCare" },
      { property: "og:description", content: "Profile, storage and session controls." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { worker, signOut, isOnline, toggleOnline, syncQueue } = useApp();
  const navigate = useNavigate();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Worker profile and offline storage for this device."
      />

      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
        <section className="bg-panel rounded-lg ring-1 ring-black/5 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Worker profile</h2>
          <div className="mt-4 space-y-4">
            <Field label="Name" htmlFor="sn">
              <TextInput id="sn" defaultValue={worker.name} readOnly />
            </Field>
            <Field label="Email" htmlFor="se">
              <TextInput id="se" defaultValue={worker.email} readOnly />
            </Field>
            <Field label="Role" htmlFor="sr">
              <TextInput id="sr" defaultValue={worker.role} readOnly />
            </Field>
            <Field label="Clinic" htmlFor="sc">
              <TextInput id="sc" defaultValue={worker.clinic} readOnly />
            </Field>
          </div>
        </section>

        <div className="space-y-6">
          <section className="bg-panel rounded-lg ring-1 ring-black/5 p-5">
            <h2 className="text-sm font-semibold tracking-tight">Connectivity</h2>
            <p className="mt-2 text-sm text-ink-soft text-pretty">
              Simulate losing or regaining a signal to test offline capture and automatic sync.
            </p>
            <ActionButton variant="quiet" className="mt-4" onClick={toggleOnline}>
              Switch to {isOnline ? "offline" : "online"} mode
            </ActionButton>
          </section>

          <section className="bg-panel rounded-lg ring-1 ring-black/5 p-5">
            <h2 className="text-sm font-semibold tracking-tight">Offline storage</h2>
            <p className="mt-2 text-sm text-ink-soft text-pretty">
              {syncQueue.filter((i) => i.status !== "synced").length} change(s) still waiting to
              upload. Clearing the cache discards anything not yet synced.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton
                variant="danger"
                onClick={() => {
                  clearLocalCache();
                  window.location.reload();
                }}
              >
                Clear local cache
              </ActionButton>
              <ActionButton
                variant="quiet"
                onClick={() => {
                  signOut();
                  navigate({ to: "/" });
                }}
              >
                Sign out
              </ActionButton>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
