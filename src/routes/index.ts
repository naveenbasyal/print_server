import express from "express";
import adminRoutes from "./adminRoutes";
import studentRoutes from "./studentRoutes";

const router = express.Router();

router.use("/admin", adminRoutes);
router.use("/student", studentRoutes);

export default router;
