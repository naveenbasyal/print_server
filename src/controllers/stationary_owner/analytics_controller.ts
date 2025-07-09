import db from "../../db/database";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  handleAsyncError,
  HttpStatus,
  sendSuccessResponse,
  sendValidationError,
} from "../../utils/responseFormatter";

export const getAnalytics = asyncHandler(async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const daysParam = req.query.period;
    const days = Number(daysParam) || 30;

    if (isNaN(days) || days <= 0 || days > 365) {
      return sendValidationError(
        res,
        "Invalid period. Use a number between 1 and 365."
      );
    }

    const shop = await db.stationary.findFirst({
      where: { ownerId: userId },
    });

    if (!shop) {
      return sendValidationError(res, "Stationary shop not found");
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const orders = await db.order.findMany({
      where: {
        stationaryId: shop.id,
        status: "DELIVERED",
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        user: { select: { name: true, email: true } },
        OrderItem: true,
        Commission: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalRevenue = orders.reduce(
      (sum, order) =>
        sum + (order.totalPrice || 0) - (order.Commission?.commissionFee || 0),
      0
    );
    const uniqueCustomers = new Set(orders.map((o) => o.userId)).size;

    const analytics = {
      overview: {
        shopName: shop.name,
        shopStatus: shop.isActive ? "Active" : "Inactive",
        reportDays: days,
      },
      revenue: {
        total: totalRevenue,
        formatted: `₹${totalRevenue}`,
        average: orders.length > 0 ? Math.round(totalRevenue / days) : 0,
        orderCount: orders.length,
      },
      customers: {
        total: uniqueCustomers,
        averageSpend:
          uniqueCustomers > 0 ? Math.round(totalRevenue / uniqueCustomers) : 0,
      },
      recentOrders: orders.slice(0, 10).map((order) => ({
        id: order.id,
        customer: order.user.name,
        amount: order.totalPrice - (order.Commission?.commissionFee || 0),
        formattedAmount: `₹${order.totalPrice - (order.Commission?.commissionFee || 0)}`,
        date: order.createdAt,
      })),
    };

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Analytics fetched",
      analytics
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error generating analytics");
  }
});
