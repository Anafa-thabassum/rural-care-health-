import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent } from "react";
import { CalendarDays, FileText, Download, Upload, ShieldCheck, HeartPulse } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useApp } from "@/context/AppContext";
import { AUTH_KEY, downloadPatientFile, listPatientFiles, uploadPatientFile, type PatientFile } from "@/services/api";

export const Route = createFileRoute("/patient")({
  head: () => ({ meta: [{ title: "My health record — RuralCare" }, { name: "description", content: "Private patient medical history and personal documents." }] }),
  component: PatientDashboard,
});

function PatientDashboard() {
  const { worker, patients, records, isOnline } = useApp();
  const patientId = worker.patientId;
  const patient = patients.find((p) => p.id === patientId);
  const history = records.filter((record) => record.patientId === patientId).sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const token = typeof window !== "undefined" ? window.sessionStorage.getItem(AUTH_KEY) : null;

  useEffect(() => {
    if (!token || !isOnline) return;
    setLoadingFiles(true);
    void listPatientFiles(token).then(setFiles).catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load documents.")).finally(() => setLoadingFiles(false));
  }, [token, isOnline]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !token) return;
    setError(""); setNotice("");
    setBusy(true);
    try {
      const saved = await uploadPatientFile(token, file);
      setFiles((current) => [saved, ...current]);
      setNotice("Document uploaded securely.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  async function handleDownload(file: PatientFile) {
    if (!token) return;
    setError("");
    try { await downloadPatientFile(token, file); }
    catch (e) { setError(e instanceof Error ? e.message : "Download failed."); }
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Patient portal" title={`Hello, ${patient?.name?.split(" ")[0] ?? worker.name.split(" ")[0]}`} description="Your personal health information, consultations and documents." />
      <div className="flex items-start gap-3 rounded-lg border border-accent/20 bg-accent-soft/40 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" />
        <p className="text-sm text-ink-soft">This view is linked to your authenticated patient account. Clinical notes and prescriptions are read-only. {isOnline ? "Connected to RuralCare." : "Offline: showing only medical history already available on this device; online documents are not available offline."}</p>
      </div>

      {patient ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Info label="Patient ID" value={patient.id} />
        <Info label="Date of birth" value={patient.dob} />
        <Info label="Blood group" value={patient.bloodGroup || "Not recorded"} />
        <Info label="Last visit" value={patient.lastVisit || "Not recorded"} />
      </div> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-lg bg-panel ring-1 ring-black/5 overflow-hidden">
          <header className="flex items-center gap-2 border-b border-rule px-5 py-4">
            <HeartPulse className="size-4 text-accent" />
            <h2 className="text-sm font-semibold">Medical history</h2>
            <span className="ml-auto text-xs text-ink-soft">{history.length} record(s)</span>
          </header>
          {history.length === 0 ? <EmptyState icon={CalendarDays} title="No medical history available" description="Your consultations and treatment records will appear here when available." /> :
            <ol className="divide-y divide-rule">
              {history.map((item) => <li key={item.id} className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-ink-soft">{item.visitDate}</span>
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">{item.type}</span>
                </div>
                <h3 className="mt-2 text-sm font-semibold">{item.diagnosis || "Consultation"}</h3>
                {item.symptoms ? <p className="mt-1 text-sm text-ink-soft">Symptoms: {item.symptoms}</p> : null}
                {item.medicines ? <p className="mt-2 text-sm"><span className="text-ink-soft">Prescription / treatment: </span>{item.medicines}</p> : null}
                <dl className="mt-3 grid gap-2 text-xs text-ink-soft sm:grid-cols-3">
                  <div><dt>Blood pressure</dt><dd className="mt-0.5 text-ink">{item.bloodPressure || "—"}</dd></div>
                  <div><dt>Temperature</dt><dd className="mt-0.5 text-ink">{item.temperature || "—"}</dd></div>
                  <div><dt>Follow-up</dt><dd className="mt-0.5 text-ink">{item.followUp || "—"}</dd></div>
                </dl>
                {item.notes ? <p className="mt-3 text-sm text-ink-soft">{item.notes}</p> : null}
              </li>)}
            </ol>}
        </section>

        <section className="rounded-lg bg-panel ring-1 ring-black/5 overflow-hidden">
          <header className="flex items-center gap-2 border-b border-rule px-5 py-4">
            <FileText className="size-4 text-accent" /><h2 className="text-sm font-semibold">My documents</h2>
          </header>
          <div className="p-4">
            <p className="text-xs leading-relaxed text-ink-soft">Upload a medical document (PDF, JPG, PNG, WebP or text; maximum 5 MB). Files are private to your account.</p>
            <label className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-rule px-3 py-3 text-sm font-medium hover:bg-paper ${busy || !isOnline ? "opacity-50 cursor-not-allowed" : ""}`}>
              <Upload className="size-4" /> {busy ? "Uploading…" : "Upload document"}
              <input className="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,application/pdf,image/jpeg,image/png,image/webp,text/plain" disabled={busy || !isOnline} onChange={handleUpload} />
            </label>
            {!isOnline ? <p className="mt-2 text-xs text-warn">Uploads require a connection.</p> : null}
            {error ? <p role="alert" className="mt-3 rounded-md bg-err-soft p-2 text-xs text-err">{error}</p> : null}
            {notice ? <p role="status" className="mt-3 rounded-md bg-ok-soft p-2 text-xs text-ok">{notice}</p> : null}
            <div className="mt-4">
              {loadingFiles ? <p className="text-sm text-ink-soft">Loading documents…</p> : files.length === 0 ? <EmptyState icon={FileText} title="No uploaded documents" description={isOnline ? "Documents you upload will appear here." : "Connect to view your document list."} /> :
                <ul className="divide-y divide-rule">
                  {files.map((file) => <li key={file.id} className="py-3">
                    <p className="break-words text-sm font-medium">{file.filename}</p>
                    <p className="mt-1 text-xs text-ink-soft">{file.contentType} · {formatSize(file.size)}</p>
                    <p className="mt-1 text-xs text-ink-soft">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                    <button onClick={() => void handleDownload(file)} disabled={!isOnline} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline disabled:opacity-50"><Download className="size-3.5" /> Download</button>
                  </li>)}
                </ul>}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-panel p-4 ring-1 ring-black/5"><p className="text-xs text-ink-soft">{label}</p><p className="mt-1 font-mono text-sm">{value}</p></div>;
}
function formatSize(size: number) { return size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`; }
