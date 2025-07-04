import express from "express";
import {
  getColleges,
  registerCollege,
  registerStationary,
  registerStationaryOwner,
} from "../controllers/admin/adminController";

const router = express.Router();

router.post("/register-college", registerCollege);
router.get("/get-colleges", getColleges);

router.post("/register-stationary-owner", registerStationaryOwner);
router.post("/register-stationary", registerStationary);

export default router;
