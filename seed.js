import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./server/.env" });

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/healthbridge";

const specializationSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String,
});

const Specialization = mongoose.model("Specialization", specializationSchema);

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing
    await Specialization.deleteMany();

    const specs = [
      {
        name: "Cardiology",
        description: "Heart and cardiovascular system",
        icon: "heart",
      },
      {
        name: "Neurology",
        description: "Brain and nervous system",
        icon: "brain",
      },
      {
        name: "Pediatrics",
        description: "Infants, children, and adolescents",
        icon: "baby",
      },
      {
        name: "Orthopedics",
        description: "Bones, joints, ligaments, tendons, and muscles",
        icon: "bone",
      },
      {
        name: "Dermatology",
        description: "Skin, hair, and nails",
        icon: "smile",
      },
      {
        name: "Psychiatry",
        description: "Mental health and behavior",
        icon: "user",
      },
      {
        name: "Dentistry",
        description: "Teeth and oral health",
        icon: "smile",
      },
    ];

    await Specialization.insertMany(specs);
    console.log(`✅ Successfully seeded ${specs.length} specializations!`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedData();
