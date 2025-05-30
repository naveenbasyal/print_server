import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./db/database";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5001;

app.all("/", (req, res) => {
  res.status(200).json({
    message: "Server Running",
  });
});

async function startServer() {
  try {
    await db.$connect();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await db.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await db.$disconnect();
  process.exit(0);
});

startServer();
