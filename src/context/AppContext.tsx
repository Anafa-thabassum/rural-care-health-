import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type MedicalRecord,
  type Patient,
  type SyncItem,
  type Worker,
} from "@/data/mockData";
import {
  AUTH_KEY,
  AUTH_USER_KEY,
  clearLocalCache,
  fetchInitialData,
  pushChange,
  readLocalCache,
  writeLocalCache,
  type AuthResponse,
} from "@/services/api";

interface AppState {
  worker: Worker;
  isAuthenticated: boolean;
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
  isOnline: boolean;
  toggleOnline: () => void;
  patients: Patient[];
  records: MedicalRecord[];
  syncQueue: SyncItem[];
  addPatient: (p: Omit<Patient, "id" | "syncStatus" | "lastVisit" | "age">) => Patient;
  addRecord: (r: Omit<MedicalRecord, "id" | "syncStatus">) => MedicalRecord;
  isSyncing: boolean;
  syncProgress: number;
  syncNow: () => void;
  lastSync: string | null;
  pendingCount: number;
}

const AppContext = createContext<AppState | null>(null);
const todayISO = () => new Date().toISOString().slice(0, 10);

function ageFromDob(dob: string) {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return Math.max(0, age);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [worker, setWorker] = useState<Worker>({
    name: "",
    email: "",
    role: "",
    clinic: "",
    phone: "",
  });
  const [isOnline, setOnline] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([]);
  const [isSyncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = window.sessionStorage.getItem(AUTH_KEY);
    const savedUserRaw = window.sessionStorage.getItem(AUTH_USER_KEY);
    let savedUser: Worker | null = null;
    try { savedUser = savedUserRaw ? JSON.parse(savedUserRaw) as Worker : null; } catch { savedUser = null; }
    const cached = savedToken && !savedUser ? null : readLocalCache();
    if (cached) {
      setPatients(cached.patients);
      setRecords(cached.records);
      setSyncQueue(cached.syncQueue);
    }
    if (!savedToken) return;
    setToken(savedToken);
    setAuthenticated(true);
    void fetchInitialData(savedToken)
      .then((data) => {
        setPatients(data.patients);
        setRecords(data.records);
        setSyncQueue(data.syncQueue);
        setWorker(data.worker);
      })
      .catch(() => setOnline(false));
  }, []);

  useEffect(() => {
    writeLocalCache({ patients, records, syncQueue });
  }, [patients, records, syncQueue]);

  const signIn = useCallback((auth: AuthResponse) => {
    setWorker(auth.worker);
    setToken(auth.token);
    setAuthenticated(true);
    setOnline(true);
    if (auth.worker.role === "Patient" && auth.worker.patientId) {
      const ownId = auth.worker.patientId;
      setPatients((list) => list.filter((item) => item.id === ownId));
      setRecords((list) => list.filter((item) => item.patientId === ownId));
      setSyncQueue((list) => list.filter((item) => item.patientId === ownId));
    }
    window.sessionStorage.setItem(AUTH_KEY, auth.token);
    window.sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(auth.worker));
    void fetchInitialData(auth.token)
      .then((data) => {
        setPatients(data.patients);
        setRecords(data.records);
        setSyncQueue(data.syncQueue);
      })
      .catch(() => setOnline(false));
  }, []);

  const signOut = useCallback(() => {
    setAuthenticated(false);
    setToken(null);
    window.sessionStorage.removeItem(AUTH_KEY);
    window.sessionStorage.removeItem(AUTH_USER_KEY);
    // Patient data should not remain on a shared device after the patient signs out.
    if (worker.role === "Patient") {
      setPatients([]);
      setRecords([]);
      setSyncQueue([]);
      clearLocalCache();
    }
  }, [worker.role]);

  const enqueue = useCallback((item: Omit<SyncItem, "id" | "status">) => {
    setSyncQueue((queue) => [{ ...item, id: crypto.randomUUID(), status: "pending" }, ...queue]);
  }, []);

  const addPatient: AppState["addPatient"] = useCallback(
    (input) => {
      const patient: Patient = {
        ...input,
        id: `PT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        age: ageFromDob(input.dob),
        lastVisit: todayISO(),
        syncStatus: "pending",
      };
      setPatients((list) => [patient, ...list]);
      enqueue({
        patientId: patient.id,
        patientName: patient.name,
        changeType: "Patient registration",
        date: new Date().toISOString().slice(0, 16).replace("T", " "),
      });
      return patient;
    },
    [enqueue],
  );

  const addRecord: AppState["addRecord"] = useCallback(
    (input) => {
      const record: MedicalRecord = {
        ...input,
        id: `MR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        syncStatus: "pending",
      };
      setRecords((list) => [record, ...list]);
      const patient = patients.find((entry) => entry.id === record.patientId);
      setPatients((list) =>
        list.map((entry) =>
          entry.id === record.patientId
            ? { ...entry, lastVisit: record.visitDate, syncStatus: "pending" }
            : entry,
        ),
      );
      enqueue({
        patientId: record.patientId,
        patientName: patient?.name ?? record.patientId,
        changeType: `New ${record.type.toLowerCase()}`,
        date: new Date().toISOString().slice(0, 16).replace("T", " "),
      });
      return record;
    },
    [enqueue, patients],
  );

  const syncNow = useCallback(async () => {
    if (isSyncing || !isOnline || !token) return;
    const queued = syncQueue.filter((item) => item.status !== "synced");
    if (!queued.length) return;
    setSyncing(true);
    setSyncProgress(0);

    for (let index = 0; index < queued.length; index++) {
      const item = queued[index];
      if (!item) continue;
      setSyncQueue((queue) =>
        queue.map((entry) => (entry.id === item.id ? { ...entry, status: "syncing" } : entry)),
      );
      const ok = await pushChange(item, patients, records, token);
      setSyncQueue((queue) =>
        queue.map((entry) =>
          entry.id === item.id ? { ...entry, status: ok ? "synced" : "failed" } : entry,
        ),
      );
      if (ok) {
        setPatients((list) =>
          list.map((entry) =>
            entry.id === item.patientId ? { ...entry, syncStatus: "synced" } : entry,
          ),
        );
        setRecords((list) =>
          list.map((entry) =>
            entry.patientId === item.patientId ? { ...entry, syncStatus: "synced" } : entry,
          ),
        );
      }
      setSyncProgress(Math.round(((index + 1) / queued.length) * 100));
    }
    setLastSync(new Date().toISOString().slice(0, 16).replace("T", " "));
    setSyncing(false);
  }, [isOnline, isSyncing, patients, records, syncQueue, token]);

  useEffect(() => {
    if (!isOnline || isSyncing || !token || !syncQueue.some((item) => item.status === "pending"))
      return;
    const timer = window.setTimeout(() => void syncNow(), 800);
    return () => window.clearTimeout(timer);
  }, [isOnline, isSyncing, syncNow, syncQueue, token]);

  const pendingCount = syncQueue.filter((item) => item.status !== "synced").length;
  const value = useMemo<AppState>(
    () => ({
      worker,
      isAuthenticated,
      signIn,
      signOut,
      isOnline,
      toggleOnline: () => setOnline((value) => !value),
      patients,
      records,
      syncQueue,
      addPatient,
      addRecord,
      isSyncing,
      syncProgress,
      syncNow,
      lastSync,
      pendingCount,
    }),
    [
      worker,
      isAuthenticated,
      signIn,
      signOut,
      isOnline,
      patients,
      records,
      syncQueue,
      addPatient,
      addRecord,
      isSyncing,
      syncProgress,
      syncNow,
      lastSync,
      pendingCount,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
