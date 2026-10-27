import type { MedicalRecord, Patient, SyncItem, Worker } from "@/data/mockData";
import { mockPatients, mockRecords, mockSyncQueue, mockWorker } from "@/data/mockData";

export const API_BASE_URL = import.meta.env["VITE_API_URL"] ?? "/api";
export const AUTH_KEY = "ruralcare:token";
export const AUTH_USER_KEY = "ruralcare:authenticated-user:v1";
const PATIENT_CACHE_KEY = "ruralcare:patient-session-cache:v1";

export interface CacheShape {
  patients: Patient[];
  records: MedicalRecord[];
  syncQueue: SyncItem[];
}

export interface AuthResponse {
  token: string;
  worker: Worker;
}

const CACHE_KEY = "ruralcare:cache:v1";

export function readLocalCache(): CacheShape | null {
  if (typeof window === "undefined") return null;
  try {
    const user = JSON.parse(window.sessionStorage.getItem(AUTH_USER_KEY) ?? "null") as { role?: string } | null;
    const raw = user?.role === "Patient"
      ? window.sessionStorage.getItem(PATIENT_CACHE_KEY)
      : window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheShape) : null;
  } catch {
    return null;
  }
}

export function writeLocalCache(data: CacheShape) {
  if (typeof window === "undefined") return;
  const user = JSON.parse(window.sessionStorage.getItem(AUTH_USER_KEY) ?? "null") as { role?: string } | null;
  if (user?.role === "Patient") {
    window.sessionStorage.setItem(PATIENT_CACHE_KEY, JSON.stringify(data));
    window.localStorage.removeItem(CACHE_KEY);
  } else {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  }
}

export function clearLocalCache() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CACHE_KEY);
  window.sessionStorage.removeItem(PATIENT_CACHE_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers },
  });
  const body = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(body.message ?? `Request failed (${response.status})`);
  return body;
}

export function login(email: string, password: string, selectedRole: "Doctor" | "Patient") {
  const doctor = email.trim().toLowerCase() === "a.okafor@ruralcare.org" && password === "demo1234";
  const patient = email.trim().toLowerCase() === "patient@example.com" && password === "Patient123!";
  if (selectedRole === "Doctor" && doctor) return Promise.resolve({ token: "demo-doctor", worker: mockWorker });
  if (selectedRole === "Patient" && patient) {
    const record = mockPatients[0];
    return Promise.resolve({
      token: "demo-patient",
      worker: { ...mockWorker, name: record.name, email, role: "Patient", clinic: "", phone: record.phone, patientId: record.id },
    });
  }
  return Promise.reject(new Error("Use the demo credentials shown below."));
}

export function registerPatient(input: { patientId: string; name: string; dob: string; email: string; password: string }) {
  const record = mockPatients.find((patient) => patient.id === input.patientId && patient.name === input.name && patient.dob === input.dob);
  if (!record || input.password.length < 6) return Promise.reject(new Error("Details must match a demo patient record and password must be at least 6 characters."));
  return Promise.resolve({
    token: "demo-patient",
    worker: { ...mockWorker, name: record.name, email: input.email, role: "Patient", clinic: "", phone: record.phone, patientId: record.id },
  });
}

export async function listPatientFiles(token: string): Promise<PatientFile[]> {
  void token;
  return [];
}

export async function uploadPatientFile(token: string, file: File): Promise<PatientFile> {
  void token; void file;
  throw new Error("Document uploads require the optional MongoDB API.");
}

export async function downloadPatientFile(token: string, file: PatientFile): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/patient/me/files/${encodeURIComponent(file.id)}`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? `Download failed (${response.status})`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = file.filename; anchor.rel = "noopener";
  anchor.click(); URL.revokeObjectURL(url);
}

export async function fetchInitialData(token: string): Promise<CacheShape & { worker: Worker }> {
  const isPatient = token === "demo-patient";
  const cached = readLocalCache();
  const pendingIds = new Set(
    cached?.syncQueue.filter((item) => item.status !== "synced").map((item) => item.patientId),
  );
  return {
    worker: isPatient ? { ...mockWorker, name: mockPatients[0].name, email: "patient@example.com", role: "Patient", clinic: "", phone: mockPatients[0].phone, patientId: mockPatients[0].id } : mockWorker,
    patients: isPatient ? mockPatients.filter((patient) => patient.id === mockPatients[0].id) : [...safeCachedPatients.filter((patient) => pendingIds.has(patient.id)), ...mockPatients.filter((patient) => !pendingIds.has(patient.id))],
    records: isPatient ? mockRecords.filter((record) => record.patientId === mockPatients[0].id) : [...safeCachedRecords.filter((record) => pendingIds.has(record.patientId)), ...mockRecords.filter((record) => !pendingIds.has(record.patientId))],
    syncQueue: isPatient ? [] : (safeCachedQueue.length ? safeCachedQueue : mockSyncQueue),
  };
}

export async function pushChange(
  item: SyncItem,
  patients: Patient[],
  records: MedicalRecord[],
  token: string,
): Promise<boolean> {
  void item; void patients; void records; void token;
  return true;
}
