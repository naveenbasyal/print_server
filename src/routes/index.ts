import express from "express";
import adminRoutes from "./adminRoutes";
import studentRoutes from "./studentRoutes";
import stationaryRoutes from "./stationaryRoutes";

const router = express.Router();

router.use("/admin", adminRoutes);
router.use("/student", studentRoutes);
router.use("/stationary", stationaryRoutes);

export default router;
