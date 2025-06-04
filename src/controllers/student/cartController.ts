import { ulid } from "ulid";
import db from "../../db/database";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../services/cloudinaryService";

export const addCartItem = async (req: any, res: any) => {
  const userId = req.user.id;

  const files = req.files;
  const metadata = JSON.parse(req.body.metadata);
  if (!files || !metadata || files.length !== metadata.length) {
    return res.status(400).json({
      message: "Files and metadata count mismatch or missing.",
      success: false,
    });
  }
  try {
    let cart = await db.cart.findFirst({
      where: { userId },
    });

    if (!cart) {
      cart = await db.cart.create({
        data: { userId },
      });
    }

    const cartItems = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const options = metadata[i];

      const { secure_url, public_id } = await uploadToCloudinary(file);

      const cartItem = await db.cartItem.create({
        data: {
          id: ulid(),
          cartId: cart.id,
          name: options.name,
          fileUrl: secure_url,
          fileId: public_id,
          coloured: options.coloured,
          duplex: options.duplex,
          spiral: options.spiral,
          hardbind: options.hardbind,
          quantity: options.quantity,
          price: options.price,
          fileType: options.fileType,
        },
      });

      cartItems.push(cartItem);
    }
    return res.status(201).json({
      message: "Cart items added successfully.",
      success: true,
      data: cartItems,
    });
  } catch (error) {
    console.error("Error creating cart item:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false, data: error });
  }
};

export const getCartItems = async (req: any, res: any) => {
  const userId = req.user.id;

  try {
    const cart = await db.cart.findFirst({
      where: { userId },
      include: {
        cartItems: true,
      },
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Cart items retrieved successfully.",
      success: true,
      data: cart.cartItems || [],
    });
  } catch (error) {
    console.error("Error retrieving cart items:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false, data: error });
  }
};

export const deleteCartItem = async (req: any, res: any) => {
  const userId = req.user.id;
  const { itemId } = req.params;

  try {
    const cart = await db.cart.findFirst({
      where: { userId },
      select: {
        id: true,
      },
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found.",
        success: false,
      });
    }

    const cartItem = await db.cartItem.findUnique({
      where: { id: itemId, cartId: cart.id },
      select: {
        id: true,
        fileId: true,
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        message: "Cart item not found.",
        success: false,
      });
    }

    if (cartItem.fileId) {
      await deleteFromCloudinary(cartItem.fileId);
    }

    await db.cartItem.delete({
      where: { id: itemId },
    });

    return res.status(200).json({
      message: "Cart item deleted successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false, data: error });
  }
};
