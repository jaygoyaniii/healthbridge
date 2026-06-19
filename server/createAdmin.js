import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config({ path: "./.env" });

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/healthbridge";

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const adminExists = await User.findOne({ email: "admin@healthbridge.com" });

    if (!adminExists) {
      await User.create({
        name: "Admin",
        email: "admin@healthbridge.com",
        password: "Admin@123",
        role: "admin",
        gender: "other",
        phone: "0000000000",
      });
      console.log("✅ Admin user created successfully!");
    } else {
      adminExists.password = "Admin@123";
      await adminExists.save();
      console.log("✅ Admin password forcefully reset to: adminpassword123");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
