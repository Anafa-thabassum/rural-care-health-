import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import { actionButton } from "@/components/ActionButton";
import { TextInput } from "@/components/Field";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/patients/")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" ? { q: search["q"] as string } : {},
  head: () => ({
    meta: [
      { title: "Patients — RuralCare" },
      {
        name: "description",
        content:
          "Search and open the full patient register stored on this device, with per-record sync status.",
      },
      { property: "og:title", content: "Patients — RuralCare" },
      { property: "og:description", content: "The offline patient register for your clinic." },
    ],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  const { q } = Route.useSearch();
  const { patients } = useApp();
  const [query, setQuery] = useState(q ?? "");

  const term = query.trim().toLowerCase();
  const list = term
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.id.toLowerCase().includes(term) ||
          p.phone.includes(term),
      )
    : patients;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Register"
        title="Patients"
        description="Every patient record cached on this device, searchable without a connection."
        actions={
          <Link to="/patients/new" className={actionButton()}>
            <UserPlus className="size-4" /> Add patient
          </Link>
        }
      />

      <div className="max-w-sm">
        <TextInput
          type="search"
          value={query}
          aria-label="Search patients"
          placeholder="Search by name, ID or phone…"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <section className="bg-panel rounded-lg ring-1 ring-black/5 overflow-hidden">
        {list.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients match that search"
            description="Try a different name, patient ID or phone number."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule text-left">
                  {["Patient", "ID", "Age / Gender", "Last visit", "Sync"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {list.map((p) => (
                  <tr key={p.id} className="hover:bg-paper">
                    <td className="px-5 py-3">
                      <Link
                        to="/patients/$patientId"
                        params={{ patientId: p.id }}
                        className="font-medium hover:text-accent"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-ink-soft truncate max-w-[28ch]">{p.address}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-soft">{p.id}</td>
                    <td className="px-5 py-3 text-ink-soft">
                      {p.age} · {p.gender}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-soft">{p.lastVisit}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={p.syncStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
