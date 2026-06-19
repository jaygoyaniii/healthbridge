import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/healthbridge');
    const db = mongoose.connection.db;
    const doctors = await db.collection('doctors').find({}).toArray();
    for (let doc of doctors) {
      if (typeof doc.specialization === 'string' && doc.specialization.length !== 24) {
         console.log(`Found bad specialization for doctor ${doc._id}: ${doc.specialization}`);
         // Find or create specialization
         let spec = await db.collection('specializations').findOne({ name: doc.specialization });
         if (!spec) {
            const res = await db.collection('specializations').insertOne({ name: doc.specialization, description: 'Created by fix', createdAt: new Date(), updatedAt: new Date(), __v: 0 });
            spec = { _id: res.insertedId };
         }
         await db.collection('doctors').updateOne({ _id: doc._id }, { $set: { specialization: spec._id } });
         console.log(`Fixed doctor ${doc._id}`);
      }
    }
    console.log('Done fixing');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

fixDB();
