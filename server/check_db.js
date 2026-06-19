import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/healthbridge').then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  const doctors = await db.collection('doctors').find({}).toArray();
  const appointments = await db.collection('appointments').find({}).toArray();
  const prescriptions = await db.collection('prescriptions').find({}).toArray();
  const records = await db.collection('medicalrecords').find({}).toArray();
  
  console.log('--- USERS ---');
  console.log(users.map(u => ({ id: u._id, role: u.role, name: u.name })));
  console.log('\n--- DOCTORS ---');
  console.log(doctors.map(d => ({ id: d._id, userId: d.userId, isApproved: d.isApproved, isAvailable: d.isAvailable })));
  console.log('\n--- APPOINTMENTS ---');
  console.log(appointments.map(a => ({ id: a._id, patientId: a.patientId, doctorId: a.doctorId })));
  console.log('\n--- PRESCRIPTIONS ---');
  console.log(prescriptions.length);
  console.log('\n--- MEDICAL RECORDS ---');
  console.log(records.length);
  
  process.exit(0);
});
