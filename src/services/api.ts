import type { MedicalRecord, Patient, SyncItem, Worker } from "@/data/mockData";

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
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, selectedRole }),
  });
}

export function registerPatient(input: { patientId: string; name: string; dob: string; email: string; password: string }) {
  return request<AuthResponse>("/auth/patient-register", { method: "POST", body: JSON.stringify(input) });
}

export async function listPatientFiles(token: string): Promise<PatientFile[]> {
  const result = await request<{ files: PatientFile[] }>("/patient/me/files", { headers: { authorization: `Bearer ${token}` } });
  return result.files;
}

export async function uploadPatientFile(token: string, file: File): Promise<PatientFile> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Choose a file smaller than 5 MB.");
  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read this file."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
  const result = await request<{ file: PatientFile }>("/patient/me/files", {
    method: "POST", headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ filename: file.name, contentType: file.type, dataBase64 }),
  });
  return result.file;
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
  const remote = await request<{ patients: Patient[]; records: MedicalRecord[]; worker: Worker }>(
    "/data",
    {
      headers: { authorization: `Bearer ${token}` },
    },
  );
  const cached = readLocalCache();
  const pendingIds = new Set(
    cached?.syncQueue.filter((item) => item.status !== "synced").map((item) => item.patientId),
  );
  return {
    worker: remote.worker,
    patients: [
      ...(safeCachedPatients.filter((patient) => pendingIds.has(patient.id))),
      ...remote.patients.filter((patient) => !pendingIds.has(patient.id)),
    ],
    records: [
      ...(safeCachedRecords.filter((record) => pendingIds.has(record.patientId))),
      ...remote.records.filter((record) => !pendingIds.has(record.patientId)),
    ],
    syncQueue: safeCachedQueue,
  };
}

export async function pushChange(
  item: SyncItem,
  patients: Patient[],
  records: MedicalRecord[],
  token: string,
): Promise<boolean> {
  const patient = patients.find((entry) => entry.id === item.patientId);
  if (!patient) return false;
  try {
    await request<{ ok: boolean }>("/sync", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        patient,
        records: records.filter((record) => record.patientId === item.patientId),
      }),
    });
    return true;
  } catch {
    return false;
  }
}
