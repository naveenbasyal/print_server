import { ulid } from "ulid";
import db from "../../db/database";

export const createOrder = async (req: any, res: any) => {
  const userId = req?.user?.id;
  try {
    const { paymentId, stationaryId, orderType, deliveryAddress } = req.body;

    if (!paymentId || !stationaryId) {
      return res.status(400).json({
        message: "Required data: paymentId & stationaryId",
        success: false,
      });
    }

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

    const newOrder = await db.order.create({
      data: {
        id: ulid(),
        userId,
        paymentId,
        collegeId: user?.collegeId,
        cartId: cart?.id,
        status: "PENDING",
        totalPrice: cartItems
          .map((item) => item.price)
          .reduce((acc, price) => acc + price, 0),
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

    //delete the cartitems

    await db.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });
    // TODO: delete fiels from cloudinary also using fileid present in cartItem table

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        newOrder,
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
