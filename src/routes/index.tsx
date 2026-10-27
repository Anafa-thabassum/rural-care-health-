import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, WifiOff, Database } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Field, TextInput } from "@/components/Field";
import { ActionButton } from "@/components/ActionButton";
import { login, registerPatient } from "@/services/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — RuralCare field records" },
      {
        name: "description",
        content:
          "Sign in to RuralCare to open patient histories offline and sync changes automatically when connectivity returns.",
      },
      { property: "og:title", content: "Sign in — RuralCare field records" },
      {
        property: "og:description",
        content: "Offline-first patient records for rural healthcare workers.",
      },
    ],
  }),
  component: LoginPage,
});

const highlights = [
  {
    icon: WifiOff,
    title: "Works offline",
    body: "Full patient history available with no connection.",
  },
  {
    icon: Database,
    title: "Local-first storage",
    body: "Changes are written to the device immediately.",
  },
  {
    icon: ShieldCheck,
    title: "Automatic sync",
    body: "Queued edits upload the moment you're back online.",
  },
];

function LoginPage() {
  const { signIn, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"Doctor" | "Patient">("Doctor");
  const [email, setEmail] = useState("a.okafor@ruralcare.org");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [registration, setRegistration] = useState({ patientId: "", name: "", dob: "", email: "", password: "" });

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard" });
  }, [isAuthenticated, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const auth = registerMode
        ? await registerPatient(registration)
        : await login(email, password, selectedRole);
      signIn(auth);
      navigate({ to: auth.worker.role === "Patient" ? "/patient" : "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-accent text-paper p-10">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center size-8 rounded-md bg-paper text-accent font-mono text-xs font-medium">
            RC
          </span>
          <p className="text-[15px] font-semibold tracking-tight">RuralCare</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">
            Field health records
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight max-w-[18ch] text-balance">
            Patient histories that don't need a signal.
          </h2>
          <ul className="mt-8 space-y-5">
            {highlights.map((h) => (
              <li key={h.title} className="flex gap-3">
                <h.icon className="size-4 mt-0.5 shrink-0 opacity-80" />
                <div>
                  <p className="text-sm font-medium">{h.title}</p>
                  <p className="text-sm opacity-75 text-pretty max-w-[36ch]">{h.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-[11px] opacity-60">North Field Clinic · Secure workspace</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={submit} className="w-full max-w-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            Secure account access
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">{registerMode ? "Create patient account" : "Welcome back"}</h1>
          <p className="mt-1.5 text-sm text-ink-soft text-pretty">
            {registerMode ? "Use the details on your clinic record to create an account." : "Sign in with your clinic or patient account."}
          </p>

          {!registerMode ? (
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1" role="group" aria-label="Choose account type">
              <button
                type="button"
                onClick={() => { setSelectedRole("Doctor"); setEmail("a.okafor@ruralcare.org"); setPassword("demo1234"); setError(null); }}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition ${selectedRole === "Doctor" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                aria-pressed={selectedRole === "Doctor"}
              >Doctor / Staff</button>
              <button
                type="button"
                onClick={() => { setSelectedRole("Patient"); setEmail("patient@example.com"); setPassword("Patient123!"); setError(null); }}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition ${selectedRole === "Patient" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                aria-pressed={selectedRole === "Patient"}
              >Patient</button>
            </div>
          ) : null}

          <div className={`${registerMode ? "mt-6" : "mt-4"} space-y-4`}>
            {registerMode ? <>
              <Field label="Patient record ID" htmlFor="patientId"><TextInput id="patientId" value={registration.patientId} onChange={(e) => setRegistration((v) => ({ ...v, patientId: e.target.value }))} required /></Field>
              <Field label="Full name as recorded by clinic" htmlFor="patientName"><TextInput id="patientName" value={registration.name} onChange={(e) => setRegistration((v) => ({ ...v, name: e.target.value }))} required /></Field>
              <Field label="Date of birth" htmlFor="patientDob"><TextInput id="patientDob" type="date" value={registration.dob} onChange={(e) => setRegistration((v) => ({ ...v, dob: e.target.value }))} required /></Field>
            </> : null}
            <Field label="Email" htmlFor="email">
              <TextInput
                id="email"
                type="email"
                value={registerMode ? registration.email : email}
                autoComplete="email"
                onChange={(e) => { setEmail(e.target.value); setRegistration((v) => ({ ...v, email: e.target.value })); }}
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <TextInput
                id="password"
                type="password"
                value={registerMode ? registration.password : password}
                autoComplete={registerMode ? "new-password" : "current-password"}
                onChange={(e) => { setPassword(e.target.value); setRegistration((v) => ({ ...v, password: e.target.value })); }}
              />
            </Field>
          </div>

          {error ? (
            <p className="mt-3 rounded-md bg-err-soft px-3 py-2 text-sm text-err">{error}</p>
          ) : null}

          <ActionButton type="submit" size="block" disabled={busy} className="mt-6">
            {busy ? "Please wait…" : registerMode ? "Create patient account" : "Sign in"}
          </ActionButton>
          <button type="button" onClick={() => { setRegisterMode((v) => !v); setError(null); }} className="mt-4 w-full text-sm text-accent hover:underline">
            {registerMode ? "Already have an account? Sign in" : "Patient? Create an account"}
          </button>
          {!registerMode ? (
            <div className="mt-4 rounded-md border border-border p-3 text-xs text-ink-soft">
              <p className="font-medium text-foreground">Demo {selectedRole.toLowerCase()} login</p>
              <p className="mt-1">Email: {selectedRole === "Doctor" ? "a.okafor@ruralcare.org" : "patient@example.com"}</p>
              <p>Password: {selectedRole === "Doctor" ? "demo1234" : "Patient123!"}</p>
            </div>
          ) : null}
          <p className="mt-4 text-xs text-ink-soft text-center">
            Frontend demo mode — no database required.
          </p>
        </form>
      </div>
    </div>
  );
}
