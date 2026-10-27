import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Plus, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import { ActionButton } from "@/components/ActionButton";
import { Field, SelectInput, TextArea, TextInput } from "@/components/Field";
import { useApp } from "@/context/AppContext";
import type { MedicalRecord } from "@/data/mockData";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Medical records — RuralCare" },
      {
        name: "description",
        content:
          "Browse every visit note, prescription and lab report captured in the field, with per-record sync state.",
      },
      { property: "og:title", content: "Medical records — RuralCare" },
      { property: "og:description", content: "All clinical notes captured in the field." },
    ],
  }),
  component: RecordsPage,
});

const filters = ["All", "Visit", "Prescription", "Lab report"] as const;

function RecordsPage() {
  const { records, patients, addRecord, isOnline } = useApp();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [open, setOpen] = useState(false);

  const list = filter === "All" ? records : records.filter((r) => r.type === filter);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Clinical notes"
        title="Medical records"
        description={
          isOnline
            ? "All records captured on this device. New notes upload immediately."
            : "Offline — new notes are stored locally until connectivity returns."
        }
        actions={
          <ActionButton onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New record
          </ActionButton>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "h-8 px-3 rounded-full text-sm font-medium bg-accent text-paper"
                : "h-8 px-3 rounded-full text-sm text-ink-soft bg-panel ring-1 ring-black/5 hover:text-ink"
            }
          >
            {f}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No records yet"
          description="Capture a visit note, prescription or lab report to see it here."
          action={<ActionButton onClick={() => setOpen(true)}>New record</ActionButton>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => {
            const patient = patients.find((p) => p.id === r.patientId);
            return (
              <article key={r.id} className="bg-panel rounded-lg ring-1 ring-black/5 p-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                    {r.type}
                  </span>
                  <StatusPill status={r.syncStatus} className="ml-auto" />
                </div>
                <p className="mt-2 text-sm font-medium">{patient?.name ?? r.patientId}</p>
                <p className="text-xs text-ink-soft font-mono">{r.visitDate}</p>
                <p className="mt-2 text-sm">{r.diagnosis}</p>
                <p className="mt-1 text-sm text-ink-soft text-pretty">{r.symptoms}</p>
                <p className="mt-3 text-xs text-ink-soft">
                  BP {r.bloodPressure} · {r.temperature}
                </p>
              </article>
            );
          })}
        </div>
      )}

      {open ? <RecordModal onClose={() => setOpen(false)} onSave={addRecord} /> : null}
    </AppShell>
  );
}

type NewRecord = Omit<MedicalRecord, "id" | "syncStatus">;

function RecordModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (r: NewRecord) => MedicalRecord;
}) {
  const { patients } = useApp();
  const [form, setForm] = useState<NewRecord>({
    patientId: patients[0]?.id ?? "",
    visitDate: new Date().toISOString().slice(0, 10),
    symptoms: "",
    diagnosis: "",
    bloodPressure: "",
    temperature: "",
    medicines: "",
    notes: "",
    followUp: "",
    type: "Visit",
  });

  const set = (key: keyof NewRecord, value: string) =>
    setForm((f) => ({ ...f, [key]: value }) as NewRecord);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div
        role="dialog"
        aria-label="New medical record"
        className="relative w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-xl bg-panel ring-1 ring-black/5"
      >
        <header className="sticky top-0 flex items-center gap-3 px-5 py-3.5 border-b border-rule bg-panel">
          <h2 className="text-sm font-semibold tracking-tight">New medical record</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto grid size-8 place-items-center rounded-md ring-1 ring-black/5"
          >
            <X className="size-4" />
          </button>
        </header>
        <form
          className="p-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
            onClose();
          }}
        >
          <Field label="Patient" htmlFor="rp">
            <SelectInput id="rp" value={form.patientId} onChange={(e) => set("patientId", e.target.value)}>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Record type" htmlFor="rt">
            <SelectInput id="rt" value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option>Visit</option>
              <option>Prescription</option>
              <option>Lab report</option>
            </SelectInput>
          </Field>
          <Field label="Visit date" htmlFor="rd">
            <TextInput id="rd" type="date" value={form.visitDate} onChange={(e) => set("visitDate", e.target.value)} />
          </Field>
          <Field label="Follow-up date" htmlFor="rf">
            <TextInput id="rf" type="date" value={form.followUp} onChange={(e) => set("followUp", e.target.value)} />
          </Field>
          <Field label="Blood pressure" htmlFor="rbp">
            <TextInput id="rbp" placeholder="120/80" value={form.bloodPressure} onChange={(e) => set("bloodPressure", e.target.value)} />
          </Field>
          <Field label="Temperature" htmlFor="rtemp">
            <TextInput id="rtemp" placeholder="36.8 °C" value={form.temperature} onChange={(e) => set("temperature", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Symptoms" htmlFor="rs">
              <TextArea id="rs" value={form.symptoms} onChange={(e) => set("symptoms", e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Diagnosis" htmlFor="rdg">
              <TextInput id="rdg" value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Medicines prescribed" htmlFor="rm">
              <TextArea id="rm" value={form.medicines} onChange={(e) => set("medicines", e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes" htmlFor="rn">
              <TextArea id="rn" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <ActionButton type="submit">Save record</ActionButton>
            <ActionButton type="button" variant="quiet" onClick={onClose}>
              Cancel
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
