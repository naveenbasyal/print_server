import express from "express";

import {
  findColleges,
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
  verifyPayment,
} from "../controllers/student/orderController";

const router = express.Router();
const upload = multer();

router.get("/find-colleges", findColleges);
router.post("/register", registerStudent);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginStudent);
router.post("/upload", requireUser, upload.array("files"), addCartItem);
router.get("/cart", requireUser, getCartItems);
router.delete("/cart/:itemId", requireUser, deleteCartItem);
router.post("/create-order", requireUser, createOrder);
router.post("/verify-payment", requireUser, verifyPayment);

export default router;
