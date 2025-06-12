import express from "express";

import {
  getOrders,
  loginStationaryOwner,
} from "../controllers/stationary_owner/stationaryController";
import { requireStationaryOwner } from "../middleware/authmiddleware";

const router = express.Router();

router.post("/login", loginStationaryOwner);
router.get("/orders", requireStationaryOwner, getOrders);

export default router;
