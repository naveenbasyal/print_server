import { ulid } from "ulid";
import db from "../../db/database";
import { deleteFromCloudinary } from "../../services/cloudinaryService";
import {
  handlePaymentSuccess,
  initiatePayment,
} from "../../services/paymentService";

export const createOrder = async (req: any, res: any) => {
  const userId = req?.user?.id;
  try {
    const { stationaryId, orderType, deliveryAddress } = req.body;

    if (orderType === "DELIVERY" && !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "Please provide delivery address also",
      });
    }
    // TODO: validate paymentId from razorpay sdk later

    const [cart, user] = await Promise.all([
      await db.cart.findFirst({
        where: {
          userId: userId,
        },
        select: {
          id: true,
        },
      }),
      await db.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          collegeId: true,
        },
      }),
    ]);

    if (!cart) {
      return res
        .status(404)
        .json({ message: "Cart not found.", success: false });
    }
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found.", success: false });
    }

    const stationary = await db.stationary.findFirst({
      where: {
        id: stationaryId,
        collegeId: user?.collegeId,
      },
    });

    if (!stationary) {
      return res.status(404).json({
        message: "Stationary not found or it does not belong to you",
        success: false,
      });
    }

    // fetch all cart items of user
    const cartItems = await db.cartItem.findMany({
      where: {
        cartId: cart?.id,
      },
    });
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    console.log("cartItems", cartItems);

    // generate otp
    const otp = Math.floor(100000 + Math.random() * 900000);
    const totalAmount = cartItems
      .map((item) => item.price)
      .reduce((acc, price) => acc + price, 0);

    const newOrder = await db.order.create({
      data: {
        id: ulid(),
        userId,
        collegeId: user?.collegeId,
        cartId: cart?.id,
        status: "PENDING",
        totalPrice: totalAmount,
        stationaryId: stationaryId,
        otp: otp.toString(),
        orderType: orderType,
        deliveryAddress: orderType === "DELIVERY" ? deliveryAddress : null,
        deliveryFee: orderType === "DELIVERY" ? 20 : 0,
      },
    });
    console.log("newOrder", newOrder);

    //crate order item
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
    const newPayment = await initiatePayment(totalAmount, userId, newOrder.id);

    await db.payments.create({
      data: {
        id: ulid(),
        orderId: newOrder.id,
        status: "PENDING",
        transactionId: newPayment.order.id,
      },
    });

    //delete the cartitems

    await db.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    // TODO: delete files from cloudinary also using fileid present in cartItem table -baadme krega stationary owner jab completed kar deaga

    //initiate payment

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        newOrder,
        newPayment,
        newOrderItems,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error });
  }
};

export const verifyPayment = async (req: any, res: any) => {
  const userId = req.user.id;

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  try {
    const verification = await handlePaymentSuccess(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
    console.log("verification", verification);

    if (verification.data?.status === "captured") {
      //payment ka status
      const payment = await db.payments.findFirst({
        where: {
          transactionId: razorpayOrderId,
        },
      });
      if (!payment) {
        return res.status(400).json({
          success: false,
          message: "Payment not found",
        });
      }
      await db.payments.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paymentId: razorpayPaymentId,
        },
      });
      //order ka status change krna to ACCEPTED
      const order = await db.order.findFirst({
        where: {
          id: payment.orderId,
          userId,
        },
      });
      if (!order) {
        return res.status(400).json({
          success: false,
          message: "Order not found",
        });
      }
      await db.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "ACCEPTED",
          paymentId: verification.data.id,
        },
      });
    }
    return res.status(verification?.success ? 200 : 400).json({
      success: verification.success,
      message: verification.message,
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getOrders = async (req: any, res: any) => {
  const userId = req.user.id;
  try {
    const orders = await db.order.findMany({
      where: {
        userId,
      },
      include: {
        OrderItem: true,
        stationary: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
