import db from "../../db/database";
import bcrypt from "bcrypt";
import { generateToken } from "../../services/jwtService";

export const loginStationaryOwner = async (req: any, res: any) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }
  try {
    const stationaryOwner = await db.user.findFirst({
      where: {
        email: email,
        role: "STATIONARY_OWNER",
      },
    });
    if (!stationaryOwner) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const matchPassword = await bcrypt.compare(
      password,
      stationaryOwner?.password || ""
    );
    if (!matchPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    const token = generateToken(
      stationaryOwner.id,
      stationaryOwner.email,
      "STATIONARY_OWNER"
    );
    return res.status(200).json({
      success: true,

      message: "Login successful",
      data: {
        userId: stationaryOwner.id,
        email: stationaryOwner.email,
        token: token,
      },
    });
  } catch (error: unknown) {
    console.error("Error logging in stationary owner:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getOrders = async (req: any, res: any) => {
  const userId = req.user.id;

  try {
    return await db.$transaction(async (tx) => {
      const stationary = await tx.stationary.findFirst({
        where: {
          ownerId: userId,
        },
        select: {
          id: true,
        },
      });

      if (!stationary) {
        return res.status(400).json({
          message: "Stationary is not linked to the user",
          success: false,
        });
      }

      const orders = await tx.order.findMany({
        where: {
          stationaryId: stationary.id,
        },
        include: {
          OrderItem: true,
        },
      });

      return res.status(200).json({
        message: "Orders fetched",
        success: true,
        data: orders,
      });
    });
  } catch (error) {
    console.log("Error fetching orders", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateOrderStatus = async (req: any, res: any) => {
  try {
    const allowedStatus = [
      "PENDING",
      "ACCEPTED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ];
    const { status, orderId } = req.body();

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: status,
      },
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
