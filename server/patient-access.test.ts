import "dotenv/config";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { createServer, type Server } from "node:http";
process.env.NODE_ENV = "test";
const { app, PatientModel, RecordModel, WorkerModel, PatientFileModel } = await import("./index");

const uri = process.env.MONGODB_URI_TEST;
if (!uri) throw new Error("Set MONGODB_URI_TEST to a disposable test database.");
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const aId = `SEC-A-${suffix}`;
const bId = `SEC-B-${suffix}`;
const aEmail = `patient-a-${suffix}@test.invalid`;
const bEmail = `patient-b-${suffix}@test.invalid`;
const staffEmail = `staff-${suffix}@test.invalid`;
const password = "test-password-123";
let server: Server;
let baseUrl = "";
let aFileId = "";
let bFileId = "";

async function login(email: string) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  return (await response.json() as { token: string }).token;
}
function auth(token: string) { return { authorization: `Bearer ${token}` }; }

before(async () => {
  await mongoose.connect(uri!, { serverSelectionTimeoutMS: 5000 });
  const passwordHash = await bcrypt.hash(password, 4);
  await PatientModel.create([
    { id: aId, name: "Security Patient A", dob: "1990-01-01", age: 36, gender: "Other", lastVisit: "2026-01-01" },
    { id: bId, name: "Security Patient B", dob: "1991-01-01", age: 35, gender: "Other", lastVisit: "2026-01-02" },
  ]);
  await RecordModel.create([
    { id: `REC-A-${suffix}`, patientId: aId, visitDate: "2026-01-01", diagnosis: "A diagnosis", type: "Visit" },
    { id: `REC-B-${suffix}`, patientId: bId, visitDate: "2026-01-02", diagnosis: "B diagnosis", type: "Visit" },
  ]);
  const [aUser, bUser] = await WorkerModel.create([
    { name: "Security Patient A", email: aEmail, passwordHash, role: "Patient", patientId: aId, clinic: "", phone: "" },
    { name: "Security Patient B", email: bEmail, passwordHash, role: "Patient", patientId: bId, clinic: "", phone: "" },
  ]);
  await WorkerModel.create({ name: "Test Staff", email: staffEmail, passwordHash, role: "Doctor", clinic: "Test", phone: "" });
  const [aFile, bFile] = await PatientFileModel.create([
    { id: `FILE-A-${suffix}`, patientId: aId, filename: "a.txt", contentType: "text/plain", size: 5, dataBase64: Buffer.from("A file").toString("base64") },
    { id: `FILE-B-${suffix}`, patientId: bId, filename: "b.txt", contentType: "text/plain", size: 5, dataBase64: Buffer.from("B file").toString("base64") },
  ]);
  aFileId = aFile.id; bFileId = bFile.id;
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not start test server");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  await Promise.all([
    PatientModel.deleteMany({ id: { $in: [aId, bId] } }),
    RecordModel.deleteMany({ patientId: { $in: [aId, bId] } }),
    WorkerModel.deleteMany({ email: { $in: [aEmail, bEmail, staffEmail] } }),
    PatientFileModel.deleteMany({ patientId: { $in: [aId, bId] } }),
  ]);
  await mongoose.disconnect();
});

test("patient data endpoint returns only the authenticated patient's records", async () => {
  const token = await login(aEmail);
  const response = await fetch(`${baseUrl}/api/data`, { headers: auth(token) });
  assert.equal(response.status, 200);
  const body = await response.json() as { patients: Array<{ id: string }>; records: Array<{ patientId: string; diagnosis: string }> };
  assert.deepEqual(body.patients.map((p) => p.id), [aId]);
  assert.ok(body.records.every((record) => record.patientId === aId));
  assert.ok(!JSON.stringify(body).includes("B diagnosis"));
});

test("patient cannot download another patient's file by changing its file ID", async () => {
  const token = await login(aEmail);
  const own = await fetch(`${baseUrl}/api/patient/me/files/${encodeURIComponent(aFileId)}`, { headers: auth(token) });
  assert.equal(own.status, 200);
  assert.equal(await own.text(), "A file");
  const other = await fetch(`${baseUrl}/api/patient/me/files/${encodeURIComponent(bFileId)}`, { headers: auth(token) });
  assert.equal(other.status, 404);
  assert.ok(!(await other.text()).includes("B file"));
});

test("patient cannot invoke staff sync endpoints; staff retain access to clinic data", async () => {
  const patientToken = await login(aEmail);
  const forbidden = await fetch(`${baseUrl}/api/sync`, {
    method: "POST", headers: { ...auth(patientToken), "content-type": "application/json" },
    body: JSON.stringify({ patient: { id: bId, name: "Security Patient B", dob: "1991-01-01" }, records: [] }),
  });
  assert.equal(forbidden.status, 403);
  const staffToken = await login(staffEmail);
  const staffData = await fetch(`${baseUrl}/api/data`, { headers: auth(staffToken) });
  assert.equal(staffData.status, 200);
  const body = await staffData.json() as { patients: Array<{ id: string }> };
  assert.ok(body.patients.some((patient) => patient.id === aId));
  assert.ok(body.patients.some((patient) => patient.id === bId));
});
