import express from "express";

import {
  getOrders,
  loginStationaryOwner,
  updateOrderStatus,
  getProfile,
  updateProfile,
  changePassword,
  updateActiveStatus,
  getPrintingRates,
  updatePrintingRates,
} from "../controllers/stationary_owner/stationaryController";
import {
  requireAdmin,
  requireStationaryOwner,
} from "../middleware/authmiddleware";
import { getAnalytics } from "../controllers/stationary_owner/analytics_controller";

const router = express.Router();

// auth
router.post("/login", loginStationaryOwner);

//general
router.get("/printing-rates", requireStationaryOwner, getPrintingRates);
router.patch("/printing-rates", requireStationaryOwner, updatePrintingRates);

// order management
router.get("/orders", requireStationaryOwner, getOrders);
router.patch("/orders/update", requireStationaryOwner, updateOrderStatus);

router.get("/analytics", requireStationaryOwner, getAnalytics);

// profile
router.use(
  "/profile",
  requireStationaryOwner,
  router
    .get("/", getProfile)
    .patch("/update", updateProfile)
    .patch("/change-password", changePassword)
    .patch("/status", updateActiveStatus)
);

export default router;
