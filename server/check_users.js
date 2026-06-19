import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/healthbridge').then(async () => {
  const users = await mongoose.connection.db.collection('users').find({ role: 'patient' }).toArray();
  console.log(users.map(u => ({ email: u.email, name: u.name, id: u._id })));
  process.exit(0);
});
