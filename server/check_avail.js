import mongoose from 'mongoose';
import Doctor from './models/Doctor.js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/healthbridge";

const check = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connected");
  
  const docs = await Doctor.find().lean();
  for (const doc of docs) {
    if (doc.availability && doc.availability.length > 0) {
      console.log(`Doctor ${doc._id} availability:`, JSON.stringify(doc.availability[0], null, 2));
      break;
    }
  }
  
  process.exit(0);
};

check();
