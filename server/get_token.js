import mongoose from 'mongoose';
import dotenv from 'dotenv';
import generateToken from './utils/generateToken.js';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/healthbridge').then(async () => {
  const users = await mongoose.connection.db.collection('users').find({ role: 'patient' }).toArray();
  if (users.length > 0) {
    const user = users[0];
    const token = generateToken(user._id);
    console.log(token);
  }
  process.exit(0);
});
