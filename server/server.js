import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import { socketHandler } from "./socket/socketHandler.js";

import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import medicalRecordRoutes from "./routes/medicalRecordRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
const httpServer = createServer(app);

/* ─── Socket.io ─── */
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
  pingTimeout: 60000,
});
global.io = io;

/* ─── Security ─── */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

/* ─── Rate Limiting ─── */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});

/* ─── Middleware ─── */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* ─── API Routes ─── */
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/doctors", generalLimiter, doctorRoutes);
app.use("/api/appointments", generalLimiter, appointmentRoutes);
app.use("/api/chat", generalLimiter, chatRoutes);
app.use("/api/prescriptions", generalLimiter, prescriptionRoutes);
app.use("/api/medical-records", generalLimiter, medicalRecordRoutes);
app.use("/api/reviews", generalLimiter, reviewRoutes);
app.use("/api/notifications", generalLimiter, notificationRoutes);
app.use("/api/admin", generalLimiter, adminRoutes);
app.use("/api/public", generalLimiter, publicRoutes);

/* ─── Health Check ─── */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ─── Error Handling ─── */
app.use(notFound);
app.use(errorHandler);

/* ─── Start Server ─── */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    socketHandler(io);

    httpServer.listen(PORT, () => {
      console.log(`\n✨ HealthBridge Server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   Client URL:  ${process.env.CLIENT_URL}\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
