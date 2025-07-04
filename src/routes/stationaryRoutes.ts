import express from "express";

import {
  getOrders,
  loginStationaryOwner,
  updateOrderStatus,
  getProfile,
  updateProfile,
  changePassword,
  updateActiveStatus,
} from "../controllers/stationary_owner/stationaryController";
import { requireStationaryOwner } from "../middleware/authmiddleware";
import { getAnalytics } from "../controllers/stationary_owner/analytics_controller";

const router = express.Router();

// auth
router.post("/login", loginStationaryOwner);

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
