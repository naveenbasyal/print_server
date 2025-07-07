import { ulid } from "ulid";
import db from "../../db/database";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../services/cloudinaryService";
import {
  sendSuccessResponse,
  sendValidationError,
  sendNotFoundError,
  handleAsyncError,
  HttpStatus,
} from "../../utils/responseFormatter";
import { asyncHandler } from "../../utils/asyncHandler";

export const addCartItem = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;
  const files = req.files;
  const metadata = JSON.parse(req.body.metadata);

  if (!files || !metadata || files.length !== metadata.length) {
    return sendValidationError(
      res,
      "Files and metadata count mismatch or missing."
    );
  }

  const itemIds = Array.from({ length: files.length }, () => ulid());
  let uploadResults: any[] = [];

  try {
    const [uploadResultsData, existingCart] = await Promise.all([
      Promise.all(
        files.map((file: any, idx: number) =>
          uploadToCloudinary(file)
            .then(({ secure_url, public_id }) => ({
              secure_url,
              public_id,
              metadata: metadata[idx],
              id: itemIds[idx],
            }))
            .catch(() => {
              throw new Error(`Upload failed for file ${file.originalname}`);
            })
        )
      ),

      db.cart.findFirst({ where: { userId } }),
    ]);

    uploadResults = uploadResultsData;
    const cartItems = await db.$transaction(async (tx) => {
      const cart = existingCart || (await tx.cart.create({ data: { userId } }));

      const cartItemData = uploadResults.map((item) => ({
        id: item.id,
        cartId: cart.id,
        name: item.metadata.name,
        fileUrl: item.secure_url,
        fileId: item.public_id,
        coloured: item.metadata.coloured,
        duplex: item.metadata.duplex,
        spiral: item.metadata.spiral,
        hardbind: item.metadata.hardbind,
        quantity: item.metadata.quantity,
        price: item.metadata.price,
        fileType: item.metadata.fileType,
      }));

      await tx.cartItem.createMany({
        data: cartItemData,
        skipDuplicates: true,
      });

      return tx.cartItem.findMany({
        where: { id: { in: itemIds } },
      });
    });

    return sendSuccessResponse(
      res,
      HttpStatus.CREATED,
      "Cart items added successfully.",
      cartItems
    );
  } catch (error) {
    if (uploadResults.length > 0) {
      Promise.allSettled(
        uploadResults.map((f) => deleteFromCloudinary(f.public_id))
      ).catch(() => {
        console.error("Cleanup failed for some files");
      });
    }

    return handleAsyncError(res, error, "Error creating cart item");
  }
});
export const getCartItems = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;

  try {
    const cart = await db.cart.findFirst({
      where: { userId },
      include: {
        cartItems: true,
      },
    });

    if (!cart) {
      return sendNotFoundError(res, "Cart not found.");
    }

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Cart items retrieved successfully.",
      cart.cartItems || []
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error retrieving cart items");
  }
});

export const deleteCartItem = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;
  const itemId = req.params.itemId;

  try {
    const cartItem = await db.cartItem.findUnique({
      where: { id: itemId },
      include: { Cart: true },
    });
    if (!itemId) {
      return sendValidationError(res, "Item ID is required.");
    }
    if (!cartItem) {
      return sendNotFoundError(res, "Cart item not found.");
    }

    if (cartItem.Cart && cartItem.Cart.userId !== userId) {
      return sendNotFoundError(res, "Cart does not belong to user.");
    }

    await db.cartItem.delete({
      where: { id: itemId },
    });

    if (cartItem.fileId) {
      await deleteFromCloudinary(cartItem.fileId);
    }

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Cart item deleted successfully."
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error deleting cart item");
  }
});
