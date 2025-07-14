import { io } from "../server";

export class RealtimeService {
  static emitNewOrder(stationaryId: string, orderData: any) {
    io.to(`stationary_${stationaryId}`).emit("new_order", {
      type: "NEW_ORDER",
      data: orderData,
      timestamp: new Date().toISOString(),
      message: "New order received!",
    });
  }
}
