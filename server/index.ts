import "dotenv/config";

import bcrypt from "bcryptjs";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { mockPatients, mockRecords } from "../src/data/mockData";

const port = Number(process.env.API_PORT ?? 5000);
const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/ruralcare";
const jwtSecret = process.env.JWT_SECRET ?? "development-only-change-me";
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is required in production");
}

const patientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  dob: { type: String, required: true },
  age: { type: Number, required: true, min: 0 },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  bloodGroup: { type: String, default: "" }, phone: { type: String, default: "" },
  address: { type: String, default: "" }, emergencyContact: { type: String, default: "" },
  allergies: { type: String, default: "" }, diseases: { type: String, default: "" },
  medications: { type: String, default: "" }, lastVisit: { type: String, required: true },
  syncStatus: { type: String, enum: ["synced", "pending", "syncing", "failed"], default: "synced" },
}, { timestamps: true });

const recordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  visitDate: { type: String, required: true }, symptoms: { type: String, default: "" },
  diagnosis: { type: String, required: true }, bloodPressure: { type: String, default: "" },
  temperature: { type: String, default: "" }, medicines: { type: String, default: "" },
  notes: { type: String, default: "" }, followUp: { type: String, default: "" },
  syncStatus: { type: String, enum: ["synced", "pending", "syncing", "failed"], default: "synced" },
  type: { type: String, enum: ["Visit", "Prescription", "Lab report"], required: true },
}, { timestamps: true });

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true },
  // Only populated for Patient accounts; never accepted from a patient API request.
  patientId: { type: String, default: null, index: true },
  clinic: { type: String, required: true, default: "" },
  phone: { type: String, required: true, default: "" },
}, { timestamps: true });

const patientFileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  filename: { type: String, required: true, maxlength: 180 },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now },
  // Files are private MongoDB records; no public/static URL is generated.
  dataBase64: { type: String, required: true, select: false },
}, { timestamps: true });

workerSchema.index(
  { patientId: 1 },
  { unique: true, partialFilterExpression: { role: "Patient", patientId: { $type: "string" } } },
);

const PatientModel = mongoose.model("Patient", patientSchema);
const RecordModel = mongoose.model("MedicalRecord", recordSchema);
const WorkerModel = mongoose.model("Worker", workerSchema);
const PatientFileModel = mongoose.model("PatientFile", patientFileSchema);

type AuthRequest = Request & { authUser?: { id: string; role: string; patientId: string | null; name: string; email: string; clinic: string; phone: string } };

function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    const payload = jwt.verify(token, jwtSecret) as { sub: string };
    if (!payload.sub) return res.status(401).json({ message: "Invalid or expired session" });
    void WorkerModel.findById(payload.sub).lean().then((user) => {
      if (!user) return res.status(401).json({ message: "Invalid or expired session" });
      req.authUser = {
        id: String(user._id), role: user.role, patientId: user.role === "Patient" ? user.patientId ?? null : null,
        name: user.name, email: user.email, clinic: user.clinic, phone: user.phone,
      };
      if (user.role === "Patient" && !user.patientId) return res.status(403).json({ message: "Patient account is not linked to a record" });
      next();
    }).catch(next);
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}
function requireStaff(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.authUser) return res.status(401).json({ message: "Authentication required" });
  if (req.authUser.role === "Patient") return res.status(403).json({ message: "Staff access required" });
  next();
}
function requirePatient(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.authUser) return res.status(401).json({ message: "Authentication required" });
  if (req.authUser.role !== "Patient" || !req.authUser.patientId) return res.status(403).json({ message: "Patient access required" });
  next();
}
function safeUser(user: any) {
  return { name: user.name, email: user.email, role: user.role, clinic: user.clinic ?? "", phone: user.phone ?? "", ...(user.role === "Patient" ? { patientId: user.patientId } : {}) };
}

async function seedDatabase() {
  if (process.env.NODE_ENV === "production") return;

  // Ensure demo patient data exists even when the database already contains other patients.
  for (const patient of mockPatients) {
    await PatientModel.updateOne(
      { id: patient.id },
      { $setOnInsert: { ...patient, syncStatus: "synced" } },
      { upsert: true },
    );
  }
  if (!(await RecordModel.exists({}))) {
    await RecordModel.insertMany(mockRecords.map((record) => ({ ...record, syncStatus: "synced" })));
  }

  // Development demo accounts: these are predictable credentials for local demos only.
  const doctorEmail = "a.okafor@ruralcare.org";
  await WorkerModel.updateOne(
    { email: doctorEmail },
    { $set: {
      name: "Dr. A. Okafor",
      passwordHash: await bcrypt.hash("demo1234", 10),
      role: "Field Health Worker",
      clinic: "North Field Clinic",
      phone: "+254 712 004 118",
    } },
    { upsert: true },
  );

  const patientEmail = "patient@example.com";
  const demoPatient = await PatientModel.findOne({ id: "PT-0248" }).lean();
  if (demoPatient) {
    await WorkerModel.updateOne(
      { email: patientEmail },
      { $set: {
        name: demoPatient.name,
        passwordHash: await bcrypt.hash("Patient123!", 10),
        role: "Patient",
        patientId: demoPatient.id,
        clinic: "",
        phone: demoPatient.phone ?? "",
      } },
      { upsert: true },
    );
  }
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json({ limit: "7mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const selectedRole = String(req.body?.selectedRole ?? "Doctor");
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  if (selectedRole !== "Doctor" && selectedRole !== "Patient") return res.status(400).json({ message: "Choose Doctor or Patient" });
  const user = await WorkerModel.findOne({ email }).lean();
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: "Invalid email or password" });
  const isPatient = user.role === "Patient";
  if ((selectedRole === "Patient") !== isPatient) {
    return res.status(403).json({ message: `This account is not registered as ${selectedRole}. Select the correct account type.` });
  }
  const token = jwt.sign({}, jwtSecret, { subject: String(user._id), expiresIn: "8h" });
  return res.json({ token, worker: safeUser(user) });
});

// Patient self-registration is enabled for this local demo. The patient must match an existing
// record by record ID, exact recorded name, and date of birth; access is then linked to that record.
app.post("/api/auth/patient-register", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const patientId = String(req.body?.patientId ?? "").trim();
  const name = String(req.body?.name ?? "").trim();
  const dob = String(req.body?.dob ?? "").trim();
  if (!email || password.length < 6 || !patientId || !name || !dob) return res.status(400).json({ message: "Patient ID, name, date of birth, email and a password of at least 6 characters are required" });
  if (await WorkerModel.exists({ email })) return res.status(409).json({ message: "An account already exists for this email" });
  const patient = await PatientModel.findOne({ id: patientId, name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }, dob }).lean();
  if (!patient) return res.status(404).json({ message: "We could not verify those details. Contact your clinic." });
  if (await WorkerModel.exists({ role: "Patient", patientId })) return res.status(409).json({ message: "A patient account already exists for this record. Contact your clinic." });
  const user = await WorkerModel.create({ name: patient.name, email, passwordHash: await bcrypt.hash(password, 12), role: "Patient", patientId: patient.id, clinic: "", phone: patient.phone ?? "" });
  const token = jwt.sign({}, jwtSecret, { subject: String(user._id), expiresIn: "8h" });
  return res.status(201).json({ token, worker: safeUser(user) });
});

app.get("/api/data", authenticate, async (req: AuthRequest, res) => {
  const user = req.authUser!;
  if (user.role === "Patient") {
    const patient = await PatientModel.findOne({ id: user.patientId }, "-_id -__v -createdAt -updatedAt").lean();
    if (!patient) return res.status(404).json({ message: "Patient record not found" });
    const records = await RecordModel.find({ patientId: user.patientId }, "-_id -__v -createdAt -updatedAt").sort({ visitDate: -1 }).lean();
    return res.json({ patients: [patient], records, worker: { name: patient.name, email: user.email, role: "Patient", clinic: "", phone: patient.phone ?? "", patientId: patient.id } });
  }
  const [patients, records] = await Promise.all([
    PatientModel.find({}, "-_id -__v -createdAt -updatedAt").sort({ name: 1 }).lean(),
    RecordModel.find({}, "-_id -__v -createdAt -updatedAt").sort({ visitDate: -1 }).lean(),
  ]);
  return res.json({ patients, records, worker: { name: user.name, email: user.email, role: user.role, clinic: user.clinic, phone: user.phone } });
});

app.get("/api/patient/me", authenticate, requirePatient, async (req: AuthRequest, res) => {
  const patientId = req.authUser!.patientId!;
  const [patient, records, files] = await Promise.all([
    PatientModel.findOne({ id: patientId }, "-_id -__v -createdAt -updatedAt").lean(),
    RecordModel.find({ patientId }, "-_id -__v -createdAt -updatedAt").sort({ visitDate: -1 }).lean(),
    PatientFileModel.find({ patientId }, "-_id -__v -dataBase64 -createdAt -updatedAt").sort({ uploadedAt: -1 }).lean(),
  ]);
  if (!patient) return res.status(404).json({ message: "Patient record not found" });
  return res.json({ patient, records, files });
});

app.get("/api/patient/me/files", authenticate, requirePatient, async (req: AuthRequest, res) => {
  const files = await PatientFileModel.find({ patientId: req.authUser!.patientId }, "-_id -__v -dataBase64 -createdAt -updatedAt").sort({ uploadedAt: -1 }).lean();
  return res.json({ files });
});

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"]);
app.post("/api/patient/me/files", authenticate, requirePatient, async (req: AuthRequest, res) => {
  const filename = String(req.body?.filename ?? "").replace(/[\\/\\r\\n]/g, "_").trim().slice(0, 180);
  const contentType = String(req.body?.contentType ?? "");
  const dataBase64 = String(req.body?.dataBase64 ?? "");
  if (!filename || !allowedTypes.has(contentType) || !dataBase64) return res.status(400).json({ message: "A filename and supported document (PDF, JPG, PNG, WebP or text) are required" });
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(dataBase64)) return res.status(400).json({ message: "Invalid file data" });
  const size = Buffer.from(dataBase64, "base64").byteLength;
  if (size < 1 || size > 5 * 1024 * 1024) return res.status(413).json({ message: "Files must be smaller than 5 MB" });
  const file = await PatientFileModel.create({ id: randomUUID(), patientId: req.authUser!.patientId!, filename, contentType, size, dataBase64, uploadedAt: new Date() });
  return res.status(201).json({ file: { id: file.id, filename: file.filename, contentType: file.contentType, size: file.size, uploadedAt: file.uploadedAt } });
});
app.get("/api/patient/me/files/:fileId", authenticate, requirePatient, async (req: AuthRequest, res) => {
  const file = await PatientFileModel.findOne({ id: req.params.fileId, patientId: req.authUser!.patientId }).select("+dataBase64").lean();
  if (!file) return res.status(404).json({ message: "Document not found" });
  const bytes = Buffer.from(file.dataBase64, "base64");
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Length", String(bytes.byteLength));
  res.setHeader("Content-Disposition", `attachment; filename="${file.filename.replace(/["\\\r\n]/g, "_")}"`);
  res.setHeader("Cache-Control", "private, no-store");
  return res.send(bytes);
});

app.post("/api/sync", authenticate, requireStaff, async (req: AuthRequest, res) => {
  const patient = req.body?.patient;
  const records = Array.isArray(req.body?.records) ? req.body.records : [];
  if (!patient?.id || !patient?.name || !patient?.dob) return res.status(400).json({ message: "A valid patient is required" });
  if (records.some((record: any) => !record?.id || record.patientId !== patient.id)) return res.status(400).json({ message: "Every record must belong to the patient" });
  const { _id, __v, createdAt, updatedAt, ...patientData } = patient;
  await PatientModel.updateOne({ id: patient.id }, { $set: { ...patientData, syncStatus: "synced" } }, { upsert: true, runValidators: true });
  if (records.length) await Promise.all(records.map((record: Record<string, unknown>) => {
    const { _id, __v, createdAt, updatedAt, ...recordData } = record as any;
    return RecordModel.updateOne({ id: record.id }, { $set: { ...recordData, syncStatus: "synced" } }, { upsert: true, runValidators: true });
  }));
  return res.json({ ok: true });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  const validation = error instanceof mongoose.Error.ValidationError;
  res.status(validation ? 400 : 500).json({ message: validation ? "Invalid request data" : "Internal server error" });
});

async function start() {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5_000 });
  await seedDatabase();
  app.listen(port, () => console.log(`RuralCare API listening on http://localhost:${port}`));
}
if (process.env.NODE_ENV !== "test") start().catch((error) => { console.error("Unable to start API:", error); process.exit(1); });

export { app, authenticate, requirePatient, requireStaff, PatientModel, RecordModel, WorkerModel, PatientFileModel };
