/**
 * Mock data for the RuralCare frontend demo.
 * Replace this module with real REST responses from the future
 * Node.js/Express + MongoDB backend — the shapes below are the contract.
 */

export type SyncStatus = "synced" | "pending" | "syncing" | "failed";
export type Gender = "Male" | "Female" | "Other";

export interface Patient {
  id: string;
  name: string;
  dob: string;
  age: number;
  gender: Gender;
  bloodGroup: string;
  phone: string;
  address: string;
  emergencyContact: string;
  allergies: string;
  diseases: string;
  medications: string;
  lastVisit: string;
  syncStatus: SyncStatus;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  visitDate: string;
  symptoms: string;
  diagnosis: string;
  bloodPressure: string;
  temperature: string;
  medicines: string;
  notes: string;
  followUp: string;
  syncStatus: SyncStatus;
  type: "Visit" | "Prescription" | "Lab report";
}

export interface SyncItem {
  id: string;
  patientId: string;
  patientName: string;
  changeType: string;
  date: string;
  status: SyncStatus;
}

export interface Worker {
  name: string;
  email: string;
  role: string;
  clinic: string;
  phone: string;
  patientId?: string;
}

export const mockWorker: Worker = {
  name: "Dr. A. Okafor",
  email: "a.okafor@ruralcare.org",
  role: "Field Health Worker",
  clinic: "North Field Clinic",
  phone: "+254 712 004 118",
};

export const mockPatients: Patient[] = [
  {
    id: "PT-0248",
    name: "Ekwueme Chukwu",
    dob: "1972-03-14",
    age: 54,
    gender: "Male",
    bloodGroup: "O+",
    phone: "+254 711 240 118",
    address: "Kibale Village, North District",
    emergencyContact: "Ada Chukwu · +254 711 240 220",
    allergies: "Penicillin",
    diseases: "Hypertension, Type 2 diabetes",
    medications: "Amlodipine 5mg, Metformin 500mg",
    lastVisit: "2026-08-20",
    syncStatus: "pending",
  },
  {
    id: "PT-0231",
    name: "Fatima Bello",
    dob: "1994-07-02",
    age: 32,
    gender: "Female",
    bloodGroup: "A+",
    phone: "+254 733 118 900",
    address: "Nyakera Trading Centre",
    emergencyContact: "Yusuf Bello · +254 733 118 901",
    allergies: "None recorded",
    diseases: "Anaemia",
    medications: "Ferrous sulphate 200mg",
    lastVisit: "2026-08-21",
    syncStatus: "failed",
  },
  {
    id: "PT-0209",
    name: "José Mwangi",
    dob: "1985-01-28",
    age: 41,
    gender: "Male",
    bloodGroup: "B+",
    phone: "+254 720 553 447",
    address: "Sagana Ward, Plot 14",
    emergencyContact: "Miriam Mwangi · +254 720 553 448",
    allergies: "Sulfa drugs",
    diseases: "Asthma",
    medications: "Salbutamol inhaler",
    lastVisit: "2026-08-22",
    syncStatus: "synced",
  },
  {
    id: "PT-0198",
    name: "Grace Achieng",
    dob: "1999-11-09",
    age: 27,
    gender: "Female",
    bloodGroup: "AB+",
    phone: "+254 701 889 234",
    address: "Lakeside Road, Bondo",
    emergencyContact: "Peter Achieng · +254 701 889 235",
    allergies: "Latex",
    diseases: "None recorded",
    medications: "Prenatal vitamins",
    lastVisit: "2026-08-23",
    syncStatus: "syncing",
  },
  {
    id: "PT-0187",
    name: "Samuel Kiptoo",
    dob: "1961-05-30",
    age: 65,
    gender: "Male",
    bloodGroup: "O-",
    phone: "+254 726 442 019",
    address: "Kaptagat Hills",
    emergencyContact: "Ruth Kiptoo · +254 726 442 020",
    allergies: "Aspirin",
    diseases: "Arthritis, Hypertension",
    medications: "Losartan 50mg",
    lastVisit: "2026-08-18",
    syncStatus: "synced",
  },
  {
    id: "PT-0166",
    name: "Amina Yusuf",
    dob: "2014-09-12",
    age: 11,
    gender: "Female",
    bloodGroup: "B-",
    phone: "+254 799 331 004",
    address: "Garissa Road, House 7",
    emergencyContact: "Halima Yusuf · +254 799 331 005",
    allergies: "None recorded",
    diseases: "Sickle cell trait",
    medications: "Folic acid",
    lastVisit: "2026-08-15",
    syncStatus: "pending",
  },
];

export const mockRecords: MedicalRecord[] = [
  {
    id: "MR-1042",
    patientId: "PT-0248",
    visitDate: "2026-08-20",
    symptoms: "Fever, headache, fatigue for three days",
    diagnosis: "Fever — suspected malaria",
    bloodPressure: "130/85",
    temperature: "38.4 °C",
    medicines: "Paracetamol 500mg, Artemether-lumefantrine",
    notes: "Patient advised rest and fluids. Return if fever persists 48h.",
    followUp: "2026-08-27",
    syncStatus: "pending",
    type: "Visit",
  },
  {
    id: "MR-1038",
    patientId: "PT-0248",
    visitDate: "2026-06-02",
    symptoms: "Routine blood pressure check",
    diagnosis: "Hypertension — controlled",
    bloodPressure: "128/82",
    temperature: "36.8 °C",
    medicines: "Amlodipine 5mg continued",
    notes: "Salt intake counselling given.",
    followUp: "2026-09-02",
    syncStatus: "synced",
    type: "Visit",
  },
  {
    id: "MR-1031",
    patientId: "PT-0231",
    visitDate: "2026-08-21",
    symptoms: "Dizziness, shortness of breath on exertion",
    diagnosis: "Iron deficiency anaemia",
    bloodPressure: "104/68",
    temperature: "36.6 °C",
    medicines: "Ferrous sulphate 200mg twice daily",
    notes: "Haemoglobin 9.1 g/dL. Dietary advice provided.",
    followUp: "2026-09-21",
    syncStatus: "failed",
    type: "Lab report",
  },
  {
    id: "MR-1026",
    patientId: "PT-0209",
    visitDate: "2026-08-22",
    symptoms: "Night-time wheezing",
    diagnosis: "Mild persistent asthma",
    bloodPressure: "118/76",
    temperature: "36.5 °C",
    medicines: "Salbutamol inhaler, spacer issued",
    notes: "Inhaler technique demonstrated and confirmed.",
    followUp: "2026-10-22",
    syncStatus: "synced",
    type: "Prescription",
  },
  {
    id: "MR-1019",
    patientId: "PT-0198",
    visitDate: "2026-08-23",
    symptoms: "Antenatal check, 22 weeks",
    diagnosis: "Normal pregnancy progression",
    bloodPressure: "112/70",
    temperature: "36.7 °C",
    medicines: "Prenatal vitamins, folic acid",
    notes: "Foetal heartbeat normal. Next scan scheduled.",
    followUp: "2026-09-20",
    syncStatus: "syncing",
    type: "Visit",
  },
  {
    id: "MR-1011",
    patientId: "PT-0187",
    visitDate: "2026-08-18",
    symptoms: "Joint pain in both knees",
    diagnosis: "Osteoarthritis flare",
    bloodPressure: "142/88",
    temperature: "36.9 °C",
    medicines: "Ibuprofen 400mg (short course)",
    notes: "Aspirin avoided due to allergy. Physiotherapy referral.",
    followUp: "2026-09-18",
    syncStatus: "synced",
    type: "Visit",
  },
];

export const mockSyncQueue: SyncItem[] = [
  {
    id: "SQ-01",
    patientId: "PT-0248",
    patientName: "Ekwueme Chukwu",
    changeType: "New medical record",
    date: "2026-08-30 09:12",
    status: "pending",
  },
  {
    id: "SQ-02",
    patientId: "PT-0231",
    patientName: "Fatima Bello",
    changeType: "Visit note edited",
    date: "2026-08-30 08:47",
    status: "pending",
  },
  {
    id: "SQ-03",
    patientId: "PT-0209",
    patientName: "José Mwangi",
    changeType: "Lab report upload",
    date: "2026-08-30 08:20",
    status: "failed",
  },
  {
    id: "SQ-04",
    patientId: "PT-0166",
    patientName: "Amina Yusuf",
    changeType: "Patient registration",
    date: "2026-08-29 17:05",
    status: "pending",
  },
  {
    id: "SQ-05",
    patientId: "PT-0198",
    patientName: "Grace Achieng",
    changeType: "Prescription added",
    date: "2026-08-29 15:40",
    status: "synced",
  },
];
