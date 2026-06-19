import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

async function run() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/healthbridge",
  );
  const users = await mongoose.connection.db
    .collection("users")
    .find({ role: "patient" })
    .toArray();
  const user = users[0];
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_ACCESS_SECRET || "fallback",
    { expiresIn: "30d" },
  );

  console.log("Testing as:", user.name, user.email);
  const opts = { headers: { Authorization: `Bearer ${token}` } };

  try {
    const apptRes = await fetch(
      "http://localhost:5000/api/appointments?limit=100",
      opts,
    );
    console.log("Appointments:", apptRes.status, await apptRes.text());
  } catch (e) {
    console.error("Appt err", e);
  }

  try {
    const presRes = await fetch(
      "http://localhost:5000/api/prescriptions?limit=50",
      opts,
    );
    console.log("Prescriptions:", presRes.status, await presRes.text());
  } catch (e) {
    console.error("Presc err", e);
  }

  try {
    const recRes = await fetch(
      "http://localhost:5000/api/medical-records?limit=50",
      opts,
    );
    console.log("Records:", recRes.status, await recRes.text());
  } catch (e) {
    console.error("Rec err", e);
  }

  try {
    const findDocRes = await fetch("http://localhost:5000/api/doctors", opts);
    console.log(
      "Find Doctors:",
      findDocRes.status,
      (await findDocRes.text()).substring(0, 100),
    );
  } catch (e) {
    console.error("Find Doc err", e);
  }

  process.exit(0);
}
run();
