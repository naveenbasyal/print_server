import db from "../../db/database";
import bcrypt from "bcrypt";
import { generateToken } from "../../services/jwtService";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  handleAsyncError,
  HttpStatus,
  sendNotFoundError,
  sendSuccessResponse,
  sendValidationError,
} from "../../utils/responseFormatter";
import {
  sendOrderCompletedEmail,
  sendOrderDeliveredEmail,
  sendOrderOutForDeliveryEmail,
} from "../../services/emailServices";
import { PrismaClientExtends } from "@prisma/client";

export const loginStationaryOwner = asyncHandler(async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendValidationError(res, "Email and password are required");
    }

    const stationaryOwner = await db.user.findFirst({
      where: {
        email,
        role: "STATIONARY_OWNER",
      },
    });

    if (!stationaryOwner) {
      return sendValidationError(res, "Invalid email or password");
    }

    const matchPassword = await bcrypt.compare(
      password,
      stationaryOwner.password || ""
    );

    if (!matchPassword) {
      return sendValidationError(res, "Invalid email or password");
    }

    const token = generateToken(
      stationaryOwner.id,
      stationaryOwner.email,
      "STATIONARY_OWNER"
    );

    return sendSuccessResponse(res, HttpStatus.OK, "Login successful", {
      userId: stationaryOwner.id,
      email: stationaryOwner.email,
      name: stationaryOwner.name,
      token,
    });
  } catch (error: any) {
    return handleAsyncError(res, error, "Login failed");
  }
});

export const getOrders = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;

  try {
    const stationary = await db.stationary.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!stationary) {
      return sendValidationError(res, "Stationary is not linked to you");
    }

    const orders = await db.order.findMany({
      where: {
        stationaryId: stationary.id,

        NOT: { status: "PENDING" },
      },
      include: {
        OrderItem: true,
        college: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        Payments: {
          select: {
            status: true,
            createdAt: true,
          },
          where: {
            status: "PAID",
          },
        },
        Commission: {
          select: {
            commissionFee: true,
            commissionRate: true,
          },
        },
      },
    });

    const formattedOrders = orders
      .map((order: any) => ({
        ...order,
        totalPrice:
          order.OrderItem.reduce(
            (acc: number, item: any) => acc + item.price,
            0
          ) - (order.Commission?.commissionFee || 0),
      }))
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

    formattedOrders.forEach((order: any) => {
      delete order.Commission;
      delete order.otp;
    });

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Orders fetched",
      formattedOrders
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error fetching orders");
  }
});

export const updateOrderStatus = asyncHandler(async (req: any, res: any) => {
  try {
    const { status, orderId, otp } = req.body;

    const allowedStatus = [
      "CANCELLED",
      "IN_PROGRESS",
      "COMPLETED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    if (!allowedStatus.includes(status)) {
      return sendValidationError(res, "Invalid order status");
    }

    const order = await db.order.findFirst({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        OrderItem: true,
        stationary: true,
        college: true,
      },
    });

    if (!order) return sendNotFoundError(res, "Order not found");

    if (order.status === "DELIVERED") {
      return sendValidationError(res, "Order is already delivered");
    }

    if (status === "OUT_FOR_DELIVERY" && order.orderType === "TAKEAWAY") {
      return sendValidationError(
        res,
        "TAKEAWAY orders don't need OUT_FOR_DELIVERY status"
      );
    }

    // if (status === "COMPLETED" && order.orderType === "DELIVERY") {
    //   return sendValidationError(
    //     res,
    //     "Mark as OUT_FOR_DELIVERY first for DELIVERY type"
    //   );
    // }

    if (status === "DELIVERED") {
      if (!otp) return sendValidationError(res, "OTP is required for delivery");
      if (otp !== order.otp) return sendValidationError(res, "Invalid OTP");
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { status },
    });

    /**
     * orderId: string;
       customerName: string;
       customerEmail: string;
       status: OrderStatusType;
       orderType: "DELIVERY" | "TAKEAWAY";
       totalPrice: number;
       deliveryAddress?: string;
       deliveryFee?: number;
       otp: string;
       createdAt: Date;
       stationaryName: string;
       stationaryPhone?: string;
       stationaryAddress?: string;
       collegeName: string;
       items: Array<{
         name: string;
         quantity: number;
         price: number;
         coloured: boolean;
         duplex: boolean;
         spiral: boolean;
         hardbind: boolean;
         fileType: string;
       }>;
       paymentId?: string;
     */
    const formattedOrder = {
      orderId: order.id,
      customerName: order.user.name,
      customerEmail: order.user.email,
      status: status,
      orderType: order.orderType,
      totalPrice: order.totalPrice,
      deliveryAddress:
        order.orderType === "DELIVERY" ? order.deliveryAddress : undefined,
      deliveryFee:
        order.orderType === "DELIVERY" ? order.deliveryFee : undefined,
      otp: order.otp,
      createdAt: order.createdAt,
      stationaryName: order.stationary.name,
      stationaryPhone: order.stationary.phone,
      stationaryAddress: order.stationary.address,
      collegeName: order.college.name,

      items: order.OrderItem.map((item) => {
        return {
          name: item.name,
          quantity: item.quantity,
          price: order.totalPrice,
          coloured: item.coloured,
          duplex: item.duplex,
          spiral: item.spiral,
          hardbind: item.hardbind,
          fileType: item.fileType,
        };
      }),
      paymentId: order.paymentId,
    };

    if (status === "COMPLETED" && order.orderType === "TAKEAWAY") {
      await sendOrderCompletedEmail(order.user.email, formattedOrder);
    } else if (
      status === "OUT_FOR_DELIVERY" &&
      order.orderType === "DELIVERY"
    ) {
      await sendOrderOutForDeliveryEmail(order.user.email, formattedOrder);
    } else if (status === "DELIVERED") {
      await sendOrderDeliveredEmail(order.user.email, formattedOrder);
    }
    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Order status updated successfully",
      updatedOrder
    );
  } catch (error: any) {
    return handleAsyncError(res, error, "Error updating order status");
  }
});

// ======================= PROFILE CONTROLLER =======================

export const getProfile = asyncHandler(async (req: any, res: any) => {
  try {
    const { id } = req.user;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        college: true,
        Stationary: true,
      },
    });

    if (!user) {
      return sendValidationError(res, "User not found");
    }

    const { password, ...userWithoutPassword } = user;

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Profile fetched successfully",
      userWithoutPassword
    );
  } catch (error) {
    return handleAsyncError(res, error, "Profile fetch error");
  }
});

export const updateProfile = asyncHandler(async (req: any, res: any) => {
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
        return sendValidationError(res, "Phone number already in use");
      }

      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
        return sendValidationError(
          res,
          "Invalid phone number format. Must be 10 digits."
        );
      }
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Profile updated successfully",
      userWithoutPassword
    );
  } catch (error) {
    return handleAsyncError(res, error, "Profile update error");
  }
});

export const changePassword = asyncHandler(async (req: any, res: any) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendValidationError(
        res,
        "Both current and new passwords are required"
      );
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return sendValidationError(res, "User not found");

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return sendValidationError(
        res,
        "New password cannot be same as current password"
      );
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return sendValidationError(res, "Current password is incorrect");
    }

    if (newPassword.length < 6) {
      return sendValidationError(
        res,
        "New password must be at least 6 characters long"
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id },
      data: { password: hashedNewPassword },
    });

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Password updated successfully"
    );
  } catch (error) {
    return handleAsyncError(res, error, "Password change error");
  }
});

export const updateActiveStatus = asyncHandler(async (req: any, res: any) => {
  try {
    const { id } = req.user;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return sendValidationError(res, "isActive is required");
    }
    if (typeof isActive !== "boolean") {
      return sendValidationError(res, "isActive must be a boolean value");
    }

    const stationary = await db.stationary.findFirst({
      where: { ownerId: id },
    });

    if (!stationary) {
      return sendValidationError(res, "Stationary not found for this owner");
    }

    const updatedStationary = await db.stationary.update({
      where: { id: stationary.id },
      data: { isActive },
    });

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      `Shop status updated to ${isActive ? "active" : "inactive"}`,
      updatedStationary
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error updating shop status");
  }
});

// ======================= PRINTING RATES CONTROLLER =======================

export const getPrintingRates = asyncHandler(async (req: any, res: any) => {
  try {
    const { id } = req.user;

    const stationary = await db.stationary.findFirst({
      where: { ownerId: id },
    });

    if (!stationary) {
      return sendValidationError(res, "Stationary not found for this owner");
    }

    const printingRates = await db.printingRates.findFirst({
      where: { stationaryId: stationary.id },
    });

    if (!printingRates) {
      return sendValidationError(
        res,
        "Printing rates not found for this stationary"
      );
    }

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Printing rates fetched successfully",
      {
        colorRate: printingRates.colorRate,
        bwRate: printingRates.bwRate,
        duplexExtra: printingRates.duplexExtra,
        hardbindRate: printingRates.hardbindRate,
        spiralRate: printingRates.spiralRate,
      }
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error fetching printing rates");
  }
});

export const updatePrintingRates = asyncHandler(async (req: any, res: any) => {
  try {
    const { id } = req.user;
    const { colorRate, bwRate, duplexExtra, hardbindRate, spiralRate } =
      req.body;

    const stationary = await db.stationary.findFirst({
      where: { ownerId: id },
    });

    if (!stationary) {
      return sendValidationError(res, "Stationary not found for this owner");
    }

    const updatedRates = await db.printingRates.update({
      where: { stationaryId: stationary.id },
      data: { colorRate, bwRate, duplexExtra, hardbindRate, spiralRate },
    });

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Printing rates updated successfully",
      updatedRates
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error updating printing rates");
  }
});
