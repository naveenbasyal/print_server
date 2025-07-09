import express from "express";
import bodyParser from "body-parser";

import {
  changeStudentPassword,
  findColleges,
  getMyStationaries,
  getPrintingRates,
  getStudentProfile,
  loginStudent,
  registerStudent,
  resendOtp,
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
  handleRazorpayWebhook,
  verifyPayment,
} from "../controllers/student/orderController";

const router = express.Router();
const upload = multer();

// auth
router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

//general
router.get("/find-colleges", findColleges);
router.get("/get-stationaries", requireUser, getMyStationaries);
router.get("/printing-rates", requireUser, getPrintingRates);

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
router.post(
  "/payments/webhook",
  bodyParser.raw({ type: "application/json" }),
  handleRazorpayWebhook
);
router.post("/verify-payment", requireUser, verifyPayment);

export default router;
