import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./db/database";
import indexRoutes from "./routes/index";

import { createServer } from "http";
import { Server } from "socket.io";
import { authenticateSocket } from "./middleware/socketAuth";

dotenv.config();

const app = express();
const server = createServer(app);

console.log("new socket server");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

console.log("authenticating socket...");
// socket auth middleware
io.use(authenticateSocket);

// socket conneciton
io.on("connection", (socket: any) => {
  console.log("User connected:", socket.userId);

  socket.join(`user_${socket.userId}`);

  if (socket.userType === "STATIONARY_OWNER") {
    socket.join(`stationary_${socket.stationaryId}`);
  }

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
  });
});
app.set("io", io);

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8001;

app.all("/", (req, res) => {
  res.status(200).json({
    message: "Server Running",
  });
});

app.use("/api", indexRoutes);

async function startServer() {
  try {
    await db.$connect();
    console.log("Database connected successfully");

    server.listen(PORT, () => {
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

export { io };
