import express from "express";
import {
  adminLogin,
  getColleges,
  registerCollege,
  registerStationary,
  registerStationaryOwner,
} from "../controllers/admin/adminController";
import { requireAdmin } from "../middleware/authmiddleware";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/get-colleges", getColleges);
router.post("/register-college", requireAdmin, registerCollege);

router.post("/register-stationary", requireAdmin, registerStationary);
router.post(
  "/register-stationary-owner",
  requireAdmin,
  registerStationaryOwner
);

export default router;
