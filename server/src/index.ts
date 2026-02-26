import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import mongoose from "mongoose";
import photosRouter from "./routes/photos";
import authRouter from "./routes/auth";
import commentsRouter from "./routes/comments";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin } : {}));
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ontheway-server" });
});
app.use("/auth", authRouter);
app.use("/photos", photosRouter);
app.use("/comments", commentsRouter);

const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  mongoose.connect(mongoUri).then(
    () => console.log("MongoDB connected"),
    (err) => console.error("MongoDB connection error:", err)
  );
} else {
  console.warn("MONGODB_URI not set; photo API will fail until configured.");
}

app.listen(port, () => {
  console.log(`OnTheWay server listening on http://localhost:${port}`);
});

