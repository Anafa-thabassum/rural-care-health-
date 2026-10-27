import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import { actionButton } from "@/components/ActionButton";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/patients/$patientId")({
  head: () => ({
    meta: [
      { title: "Patient profile — RuralCare" },
      {
        name: "description",
        content:
          "Full offline patient profile: demographics, chronic conditions, medications and the complete visit timeline.",
      },
      { property: "og:title", content: "Patient profile — RuralCare" },
      { property: "og:description", content: "Complete history, available offline." },
    ],
  }),
  component: PatientProfile,
});

const tabs = ["Overview", "Visit history", "Medications"] as const;

function PatientProfile() {
  const { patientId } = Route.useParams();
  const { patients, records } = useApp();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

  const patient = patients.find((p) => p.id === patientId);
  const visits = records
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));

  if (!patient) {
    return (
      <AppShell>
        <EmptyState
          icon={FileText}
          tone="error"
          title="Patient not found"
          description="This patient is not in the local cache on this device."
          action={
            <Link to="/patients" className={actionButton({ variant: "quiet" })}>
              <ArrowLeft className="size-4" /> Back to patients
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Patient ${patient.id}`}
        title={patient.name}
        description={`${patient.age} years · ${patient.gender} · ${patient.bloodGroup || "Blood group unknown"}`}
        actions={
          <>
            <StatusPill status={patient.syncStatus} />
            <Link to="/records" className={actionButton()}>
              <FileText className="size-4" /> Add record
            </Link>
          </>
        }
      />

      <div className="flex gap-1 border-b border-rule">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "px-3 py-2 text-sm font-medium border-b-2 border-accent text-accent -mb-px"
                : "px-3 py-2 text-sm text-ink-soft hover:text-ink"
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="bg-panel rounded-lg ring-1 ring-black/5 p-5">
            <h2 className="text-sm font-semibold tracking-tight">Contact</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Phone" value={patient.phone} />
              <Row label="Address" value={patient.address} />
              <Row label="Emergency" value={patient.emergencyContact} />
              <Row label="Date of birth" value={patient.dob} />
            </dl>
          </section>
          <section className="bg-panel rounded-lg ring-1 ring-black/5 p-5">
            <h2 className="text-sm font-semibold tracking-tight">Medical background</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Allergies" value={patient.allergies || "None recorded"} />
              <Row label="Conditions" value={patient.diseases || "None recorded"} />
              <Row label="Medications" value={patient.medications || "None recorded"} />
              <Row label="Last visit" value={patient.lastVisit} />
            </dl>
          </section>
        </div>
      ) : null}

      {tab === "Visit history" ? (
        visits.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No visits recorded"
            description="Records added for this patient will appear here as a timeline."
          />
        ) : (
          <ol className="relative border-l border-rule ml-2 space-y-6 pl-6">
            {visits.map((v) => (
              <li key={v.id} className="relative">
                <span className="absolute -left-[31px] top-1.5 size-2.5 rounded-full bg-accent ring-4 ring-paper" />
                <div className="bg-panel rounded-lg ring-1 ring-black/5 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[11px] text-ink-soft">{v.visitDate}</span>
                    <span className="text-sm font-medium">{v.diagnosis}</span>
                    <StatusPill status={v.syncStatus} className="ml-auto" />
                  </div>
                  <p className="mt-2 text-sm text-ink-soft text-pretty">{v.symptoms}</p>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
                    <Row label="BP" value={v.bloodPressure} />
                    <Row label="Temp" value={v.temperature} />
                    <Row label="Follow-up" value={v.followUp || "—"} />
                  </dl>
                  <p className="mt-3 text-sm">
                    <span className="text-ink-soft">Medicines: </span>
                    {v.medicines}
                  </p>
                  {v.notes ? <p className="mt-1 text-sm text-ink-soft">{v.notes}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        )
      ) : null}

      {tab === "Medications" ? (
        <section className="bg-panel rounded-lg ring-1 ring-black/5 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Prescribed to date</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between gap-4">
              <span className="text-ink-soft">Standing medication</span>
              <span className="text-right">{patient.medications || "None recorded"}</span>
            </li>
            {visits.map((v) => (
              <li key={v.id} className="flex justify-between gap-4 border-t border-rule pt-2">
                <span className="font-mono text-[11px] text-ink-soft">{v.visitDate}</span>
                <span className="text-right">{v.medicines}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft shrink-0">{label}</dt>
      <dd className="text-right text-pretty">{value}</dd>
    </div>
  );
}
