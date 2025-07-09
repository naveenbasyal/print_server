import { ulid } from "ulid";
import db from "../../db/database";

import {
  handlePaymentSuccess,
  initiatePayment,
} from "../../services/paymentService";
import crypto from "crypto";
import {
  sendSuccessResponse,
  sendValidationError,
  sendNotFoundError,
  handleAsyncError,
  HttpStatus,
} from "../../utils/responseFormatter";
import { asyncHandler } from "../../utils/asyncHandler";

export const createOrder = asyncHandler(async (req: any, res: any) => {
  const userId = req?.user?.id;
  const { stationaryId, orderType, deliveryAddress } = req.body;

  if (orderType === "DELIVERY" && !deliveryAddress) {
    return sendValidationError(res, "Please provide delivery address also");
  }

  const PLATFORM_FEE = 5; //for us
  const DELIVERY_FEE = 20; //for partner = orderAmount + DELIVERY_FEE

  try {
    const [cart, user] = await Promise.all([
      db.cart.findFirst({
        where: {
          userId: userId,
        },
        select: {
          id: true,
        },
      }),
      db.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          collegeId: true,
        },
      }),
    ]);

    if (!cart) {
      return sendNotFoundError(res, "Cart not found");
    }

    if (!user) {
      return sendNotFoundError(res, "User not found");
    }

    const stationary = await db.stationary.findFirst({
      where: {
        id: stationaryId,
        collegeId: user?.collegeId,
      },
    });

    if (!stationary) {
      return sendNotFoundError(
        res,
        "Stationary not found or it does not belong to you"
      );
    }

    if (orderType === "DELIVERY" && !stationary.canDeliver) {
      return sendValidationError(
        res,
        "This stationary does not provide delivery service"
      );
    }

    const cartItems = await db.cartItem.findMany({
      where: {
        cartId: cart?.id,
      },
    });

    if (cartItems.length === 0) {
      return sendValidationError(res, "Cart is empty");
    }

    console.log("cartItems", cartItems);

    // generate otp
    const otp = Math.floor(100000 + Math.random() * 900000);
    const totalAmount = cartItems
      .map((item) => item.price)
      .reduce((acc, price) => acc + price, 0);
    const totalPrice =
      orderType === "DELIVERY" ? totalAmount + DELIVERY_FEE : totalAmount;

    const grandTotal = totalPrice + PLATFORM_FEE;

    const newOrder = await db.order.create({
      data: {
        id: ulid(),
        userId,
        collegeId: user?.collegeId,
        stationaryId: stationaryId,
        cartId: cart?.id,
        status: "PENDING",
        totalPrice: totalPrice,
        otp: otp.toString(),
        orderType: orderType,
        deliveryAddress: orderType === "DELIVERY" ? deliveryAddress : null,
        deliveryFee: orderType === "DELIVERY" ? DELIVERY_FEE : 0,
      },
    });
    console.log("newOrder", newOrder);

    const orderItemData = cartItems.map(
      ({ cartId, createdAt, updatedAt, fileId, ...item }) => {
        return {
          ...item,
          id: ulid(),
          orderId: newOrder.id,
        };
      }
    );
    console.log("orderItemData", orderItemData);

    const newOrderItems = await db.orderItem.createMany({
      data: orderItemData,
    });

    const newPayment = await initiatePayment(grandTotal, userId, newOrder.id);

    await db.payments.create({
      data: {
        id: ulid(),
        orderId: newOrder.id,
        status: "PENDING",
        transactionId: newPayment.order.id,
      },
    });

    await db.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return sendSuccessResponse(
      res,
      HttpStatus.CREATED,
      "Order created successfully",
      {
        newOrder,
        newPayment,
        newOrderItems,
      }
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error creating order");
  }
});

export const verifyPayment = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  try {
    const existingPayment = await db.payments.findFirst({
      where: {
        paymentId: razorpayPaymentId,
        status: "PAID",
      },
    });

    if (existingPayment) {
      return sendSuccessResponse(
        res,
        HttpStatus.OK,
        "Payment already verified"
      );
    }

    const verification = await handlePaymentSuccess(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
    console.log("verification", verification);

    if (verification.data?.status === "captured") {
      const payment = await db.payments.findFirst({
        where: {
          transactionId: razorpayOrderId,
        },
      });

      if (!payment) {
        return sendNotFoundError(res, "Payment not found");
      }

      //order ka status change krna to ACCEPTED
      const order = await db.order.findFirst({
        where: {
          id: payment.orderId,
          userId,
        },
      });

      if (!order) {
        return sendNotFoundError(res, "Order not found");
      }
      const razorpayData = verification.data;

      //raxprpya ne jo kata on total amount
      const razorpayFee = Math.ceil(razorpayData.fee / 100);
      //razorpay ne jo tax lagaya(GST)
      const gstOnRzpFee = Math.ceil(razorpayData.tax / 100);

      // Platform and commission
      const PLATFORM_FEE = 5;
      const COMMISSION_RATE = 5; // 5%
      const COMMISSION_FEE = Math.ceil(
        order.totalPrice * (COMMISSION_RATE / 100)
      );

      const NET_EARNING =
        PLATFORM_FEE + COMMISSION_FEE - razorpayFee - gstOnRzpFee;

      await db.$transaction([
        db.payments.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            paymentId: razorpayPaymentId,
          },
        }),
        db.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: "ACCEPTED",
            paymentId: verification.data.id,
          },
        }),
        db.commission.create({
          data: {
            id: ulid(),
            orderId: order.id,
            stationaryId: order.stationaryId,
            platformFee: PLATFORM_FEE,
            commissionRate: COMMISSION_RATE,
            commissionFee: COMMISSION_FEE,
            razorpayFee,
            gstOnRzpFee,
            netEarnings: NET_EARNING,
            status: "PENDING",
          },
        }),
      ]);
    }

    const statusCode = verification?.success
      ? HttpStatus.OK
      : HttpStatus.BAD_REQUEST;

    if (verification.success) {
      return sendSuccessResponse(res, statusCode, verification.message);
    } else {
      return sendValidationError(res, verification.message);
    }
  } catch (error: any) {
    return handleAsyncError(res, error, "Error verifying payment");
  }
});

export const handleRazorpayWebhook = asyncHandler(
  async (req: any, res: any) => {
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body;
    console.log("[Webhook] Received body:", body);

    const expectedSignature = crypto
      .createHmac("sha256", "secret_123")
      .update(req.body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("[Webhook] Invalid signature");
      return sendValidationError(res, "Invalid signature");
    }
    console.log("[Webhook] Valid signature received");

    try {
      const webhookPayload = JSON.parse(body);
      console.log("webhookPayload", webhookPayload);
      const event = webhookPayload.event;

      if (event === "payment.captured") {
        const paymentId = webhookPayload.payload.payment.entity.id;
        const orderId = webhookPayload.payload.payment.entity.order_id;

        const existingPayment = await db.payments.findFirst({
          where: {
            paymentId: paymentId,
          },
        });

        if (existingPayment) {
          console.log("[Webhook] Payment already processed");
          return sendSuccessResponse(res, HttpStatus.OK, "Already handled");
        }

        const paymentRecord = await db.payments.findFirst({
          where: {
            transactionId: orderId,
          },
        });

        if (!paymentRecord) {
          console.error("[Webhook] No matching payment found in DB");
          return sendNotFoundError(res, "Payment not found");
        }

        await db.$transaction([
          db.payments.update({
            where: { id: paymentRecord.id },
            data: {
              paymentId: paymentId,
              status: "PAID",
            },
          }),
          db.order.update({
            where: { id: paymentRecord.orderId },
            data: {
              status: "ACCEPTED",
              paymentId: paymentId,
            },
          }),
        ]);

        console.log("[Webhook] Payment processed via webhook");
        return sendSuccessResponse(res, HttpStatus.OK, "Payment processed");
      }

      return sendSuccessResponse(res, HttpStatus.OK, "Unhandled event");
    } catch (error: any) {
      return handleAsyncError(res, error, "[Webhook] Error handling webhook");
    }
  }
);

export const getOrders = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;

  try {
    const orders = await db.order.findMany({
      where: {
        userId,
      },
      include: {
        OrderItem: true,
        stationary: true,
        Commission: {
          select: {
            platformFee: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const formattedOrders = orders.map((order) => ({
      ...order,
      platformFee: order.Commission?.platformFee ?? 0,
    }));

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Orders fetched successfully",
      formattedOrders
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error fetching orders");
  }
});
