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
          college: true,
          user: true,
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
      "CANCELLED",
      "ACCEPTED",
      "IN_PROGRESS",

      "COMPLETED",
      "OUT_FOR_DELIVERY",
      "DELIVERED", //need otp
    ];
    const { status, orderId, otp } = req.body;

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }
    const order = await db.order.findFirst({
      where: {
        id: orderId,
      },
    });
    console.log("order", order);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
        success: false,
      });
    }
    if (order.status === "DELIVERED") {
      return res.status(400).json({
        message: "Order is already Delivered.",
        success: false,
      });
    }
    if (status === "OUT_FOR_DELIVERY" && order.orderType === "TAKEAWAY") {
      return res.status(400).json({
        message: "Customer will come to you because it is TAKEAWAY",
        success: false,
      });
    }

    if (status === "DELIVERED" && !otp) {
      return res.status(404).json({
        message: "OTP Is Required.",
        success: false,
      });
    }
    if (status === "DELIVERED" && otp && otp !== order.otp) {
      return res.status(404).json({
        message: "Wrong OTP, kick his ass",
        success: false,
      });
    }
    const updatedRecord = await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: status,
      },
    });
    return res.status(500).json({
      success: false,
      message: "Updated",
      data: updatedRecord,
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

// ======================= PROFILE CONTROLLER =======================

export const getProfile = async (req: any, res: any) => {
  try {
    const { id } = req.user;

    const user = await db.user.findUnique({
      where: { id: id },
      include: {
        college: true,
        Stationary: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: true, message: "User not found" });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res
      .status(500)
      .json({ success: true, message: "Internal server error", error });
  }
};

export const updateProfile = async (req: any, res: any) => {
  try {
    const { id } = req.user;
    const { name, phone } = req.body;

    if (phone) {
      const existingUser = await db.user.findFirst({
        where: {
          phone,
          NOT: { id },
        },
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ success: true, message: "Phone number already in use" });
      }
    }

    const phoneRegex = /^\d{10}$/;
    if (phone && !phoneRegex.test(phone)) {
      return res.status(400).json({
        success: true,
        message: "Invalid phone number format. Must be 10 digits.",
      });
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res
      .status(500)
      .json({ success: true, message: "Internal server error", error });
  }
};

export const changePassword = async (req: any, res: any) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: true,
        message: "Current password and new password are required",
      });
    }

    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ success: true, message: "User not found" });
    }
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as the current password",
      });
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return res
        .status(400)
        .json({ success: true, message: "Current password is incorrect" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: true,
        message: "New password must be at least 6 characters long",
      });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id },
      data: {
        password: hashedNewPassword,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    return res
      .status(500)
      .json({ success: true, message: "Internal server error", error });
  }
};

export const updateActiveStatus = async (req: any, res: any) => {
  try {
    const { id } = req.user;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const stationary = await db.stationary.findFirst({
      where: {
        ownerId: id,
      },
    });

    if (!stationary) {
      return res.status(404).json({
        success: false,
        message: "Stationary not found for this owner",
      });
    }

    const updatedStationary = await db.stationary.update({
      where: {
        id: stationary.id,
      },
      data: { isActive },
    });

    return res.status(200).json({
      success: true,
      message: `Shop status updated to ${isActive ? "active" : "inactive"}`,
      data: updatedStationary,
    });
  } catch (error) {
    console.error("Error updating shop status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ======================= PRINTING RATES CONTROLLER =======================

export const getPrintingRates = async (req: any, res: any) => {
  try {
    const { id } = req.user;

    const stationary = await db.stationary.findFirst({
      where: {
        ownerId: id,
      },
    });

    if (!stationary) {
      return res.status(404).json({
        success: false,
        message: "Stationary not found for this owner",
      });
    }

    const printingRates = await db.printingRates.findFirst({
      where: {
        stationaryId: stationary.id,
      },
    });
    if (!printingRates) {
      return res.status(404).json({
        success: false,
        message: "Printing rates not found for this stationary",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Printing rates fetched successfully",
      data: {
        colorRate: printingRates.colorRate,
        bwRate: printingRates.bwRate,
        duplexExtra: printingRates.duplexExtra,
        hardbindRate: printingRates.hardbindRate,
        spiralRate: printingRates.spiralRate,
      },
    });
  } catch (error) {
    console.error("Error fetching printing rates:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updatePrintingRates = async (req: any, res: any) => {
  try {
    const { id } = req.user;
    const { colorRate, bwRate, duplexExtra, hardbindRate, spiralRate } =
      req.body;

    const stationary = await db.stationary.findFirst({
      where: {
        ownerId: id,
      },
    });

    if (!stationary) {
      return res.status(404).json({
        success: false,
        message: "Stationary not found for this owner",
      });
    }

    const updatedRates = await db.printingRates.update({
      where: {
        stationaryId: stationary.id,
      },
      data: {
        colorRate,
        bwRate,
        duplexExtra,
        hardbindRate,
        spiralRate,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Printing rates updated successfully",
      data: updatedRates,
    });
  } catch (error) {
    console.error("Error updating printing rates:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
