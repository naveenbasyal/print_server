import jwt from "jsonwebtoken";
import "dotenv/config";
import db from "../db/database";

export const authenticateSocket = async (socket: any, next: any) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!);
    } catch (verifyError) {
      console.error("[SocketAuth] Token verification failed:", verifyError);
      return next(new Error("Authentication failed"));
    }

    const user = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        Stationary: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      console.error("[SocketAuth] User not found for ID:", decoded.id);
      return next(new Error("User not found"));
    }

    socket.userId = user.id;
    socket.userType = user.role;

    // If user is stationary owner, get their stationary ID
    if (user.role === "STATIONARY_OWNER" && user.Stationary.length > 0) {
      socket.stationaryId = user.Stationary[0].id;
    }

    next();
  } catch (error) {
    console.error("[SocketAuth] Authentication failed with error:", error);
    next(new Error("Authentication failed"));
  }
};
