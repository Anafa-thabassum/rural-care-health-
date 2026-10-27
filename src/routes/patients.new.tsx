import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Field, SelectInput, TextArea, TextInput } from "@/components/Field";
import { ActionButton } from "@/components/ActionButton";
import { useApp } from "@/context/AppContext";
import type { Gender } from "@/data/mockData";

export const Route = createFileRoute("/patients/new")({
  head: () => ({
    meta: [
      { title: "Add patient — RuralCare" },
      {
        name: "description",
        content:
          "Register a new patient in the field. The record saves to this device instantly and queues for sync.",
      },
      { property: "og:title", content: "Add patient — RuralCare" },
      { property: "og:description", content: "Register patients offline, sync later." },
    ],
  }),
  component: AddPatientPage,
});

const empty = {
  name: "",
  dob: "",
  gender: "Female" as Gender,
  bloodGroup: "",
  phone: "",
  address: "",
  emergencyContact: "",
  allergies: "",
  diseases: "",
  medications: "",
};

function AddPatientPage() {
  const { addPatient, isOnline } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof empty, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.dob) {
      setError("Name and date of birth are required.");
      return;
    }
    const patient = addPatient(form);
    navigate({ to: "/patients/$patientId", params: { patientId: patient.id } });
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Registration"
        title="Add a patient"
        description={
          isOnline
            ? "This registration uploads as soon as it is saved."
            : "You are offline — this registration is stored locally and queued for sync."
        }
      />

      <form onSubmit={submit} className="max-w-3xl space-y-6">
        <section className="bg-panel rounded-lg ring-1 ring-black/5 p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-tight">Identity</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name">
              <TextInput id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Date of birth" htmlFor="dob">
              <TextInput id="dob" type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
            </Field>
            <Field label="Gender" htmlFor="gender">
              <SelectInput id="gender" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </SelectInput>
            </Field>
            <Field label="Blood group" htmlFor="blood">
              <TextInput
                id="blood"
                placeholder="O+"
                value={form.bloodGroup}
                onChange={(e) => set("bloodGroup", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="bg-panel rounded-lg ring-1 ring-black/5 p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-tight">Contact</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="phone">
              <TextInput id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Emergency contact" htmlFor="ec">
              <TextInput
                id="ec"
                value={form.emergencyContact}
                onChange={(e) => set("emergencyContact", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address" htmlFor="address">
                <TextInput id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
              </Field>
            </div>
          </div>
        </section>

        <section className="bg-panel rounded-lg ring-1 ring-black/5 p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-tight">Medical background</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Allergies" htmlFor="allergies">
              <TextArea id="allergies" value={form.allergies} onChange={(e) => set("allergies", e.target.value)} />
            </Field>
            <Field label="Chronic conditions" htmlFor="diseases">
              <TextArea id="diseases" value={form.diseases} onChange={(e) => set("diseases", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Current medications" htmlFor="meds">
                <TextArea id="meds" value={form.medications} onChange={(e) => set("medications", e.target.value)} />
              </Field>
            </div>
          </div>
        </section>

        {error ? (
          <p className="rounded-md bg-err-soft px-3 py-2 text-sm text-err">{error}</p>
        ) : null}

        <div className="flex gap-2">
          <ActionButton type="submit" size="lg">
            Save patient
          </ActionButton>
          <ActionButton type="button" variant="quiet" size="lg" onClick={() => navigate({ to: "/patients" })}>
            Cancel
          </ActionButton>
        </div>
      </form>
    </AppShell>
  );
}
