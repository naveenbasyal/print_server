import db from "../../db/database";

export const getAnalytics = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const days = req.query.period || "30";

    // Find user's shop
    const shop = await db.stationary.findFirst({
      where: { ownerId: userId },
    });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get delivered orders
    const orders = await db.order.findMany({
      where: {
        stationaryId: shop.id,
        status: "DELIVERED",
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        user: { select: { name: true, email: true } },
        OrderItem: true,
      },
    });

    // Calculate revenue
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );

    // Count unique customers
    const uniqueCustomers = new Set(orders.map((o) => o.userId)).size;

    // Send response
    res.json({
      success: true,
      data: {
        overview: {
          shopName: shop.name,
          shopStatus: shop.isActive ? "Active" : "Inactive",
          reportDays: days,
        },
        revenue: {
          total: totalRevenue,
          formatted: `₹${totalRevenue}`,
          average: Math.round(totalRevenue / parseInt(days)),
          orderCount: orders.length,
        },
        customers: {
          total: uniqueCustomers,
          averageSpend:
            uniqueCustomers > 0
              ? Math.round(totalRevenue / uniqueCustomers)
              : 0,
        },

        recentOrders: orders.slice(0, 10).map((order) => ({
          id: order.id,
          customer: order.user.name,
          amount: order.totalPrice,
          date: order.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
