import express from "express";

import {
  changeStudentPassword,
  findColleges,
  getStudentProfile,
  loginStudent,
  registerStudent,
  verifyOtp,
} from "../controllers/student/authController";
import { requireUser } from "../middleware/authmiddleware";
import multer from "multer";
import {
  addCartItem,
  deleteCartItem,
  getCartItems,
} from "../controllers/student/cartController";
import {
  createOrder,
  getOrders,
  verifyPayment,
} from "../controllers/student/orderController";

const router = express.Router();
const upload = multer();

// auth
router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.post("/verify-otp", verifyOtp);

router.get("/find-colleges", findColleges);

// cart and orders
router.get("/cart", requireUser, getCartItems);
router.post("/upload", requireUser, upload.array("files"), addCartItem);
router.delete("/cart/:itemId", requireUser, deleteCartItem);
router.get("/orders", requireUser, getOrders);

// profile
router.get("/profile", requireUser, getStudentProfile);
router.patch("/change-password", requireUser, changeStudentPassword);

// Payments
router.post("/create-order", requireUser, createOrder);
router.post("/verify-payment", requireUser, verifyPayment);

export default router;
