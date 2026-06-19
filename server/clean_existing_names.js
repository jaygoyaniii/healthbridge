import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/healthbridge",
  );

  const users = await mongoose.connection.db
    .collection("users")
    .find({ role: "doctor" })
    .toArray();
  console.log(`Found ${users.length} doctors in the database.`);

  for (const user of users) {
    if (user.name && /^(dr\.\s*|dr\s+)/i.test(user.name)) {
      const cleanName = user.name.replace(/^(dr\.\s*|dr\s+)/i, "");
      console.log(`Updating name for doctor: "${user.name}" -> "${cleanName}"`);
      await mongoose.connection.db
        .collection("users")
        .updateOne({ _id: user._id }, { $set: { name: cleanName } });
    }
  }

  console.log("Cleanup completed.");
  process.exit(0);
}
run();
