import Razorpay from "razorpay";

import crypto from "crypto";
import { ulid } from "ulid";

const razorpay = new Razorpay({
  key_id: "rzp_test_yQG26LZF4tUxWj",
  key_secret: "vSWs7VlWPYmIxV0eMHa9F62H",
});
const verifyRazorpaySignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean => {
  const secret = "vSWs7VlWPYmIxV0eMHa9F62H";
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const generatedSignature = hmac.digest("hex");
  return generatedSignature === razorpaySignature;
};

export const initiatePayment = async (
  amount: number,
  userId: string,
  orderId: string
) => {
  try {
    const paymentOptions = {
      amount: amount * 100,
      currency: "INR",
      receipt: `rcpt_${ulid().substring(0, 30)}`,
      notes: {
        userId,
        orderId,
      },
    };

    console.log(
      "[initiatePayment] Creating Razorpay order with options:",
      paymentOptions
    );
    const order = await razorpay.orders.create(paymentOptions);

    console.log(`[initiatePayment] Razorpay order created. Order ID: ${order}`);

    return {
      order,
      paymentOptions,
      amountInRupee: amount,
      amountInPaise: amount * 100,
    };
  } catch (error: any) {
    console.error("[initiatePayment] Error initiating payment:", error.message);
    throw Error(error.message);
  }
};
export const handlePaymentSuccess = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  if (![razorpayOrderId, razorpayPaymentId, razorpaySignature].every(Boolean)) {
    console.warn(
      "[handlePaymentSuccess] Missing required fields in request body."
    );
    return {
      success: false,
      message: "Order ID, Payment ID, and Signature are required",
    };
  }

  if (
    !verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    )
  ) {
    console.warn("[handlePaymentSuccess] Invalid Razorpay signature.");
    return {
      success: false,
      message: "Invalid Signature",
    };
  }

  try {
    console.log(
      `[handlePaymentSuccess] Fetching payment from Razorpay for paymentId: ${razorpayPaymentId}`
    );
    const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);
    console.log(
      "[handlePaymentSuccess] Razorpay payment fetched:",
      JSON.stringify(razorpayPayment, null, 2)
    );

    if (
      razorpayPayment.order_id !== razorpayOrderId ||
      razorpayPayment.status !== "captured"
    ) {
      console.warn(
        `[handlePaymentSuccess] Payment not successful or order mismatch. order_id: ${razorpayPayment.order_id}, expected: ${razorpayOrderId}, status: ${razorpayPayment.status}`
      );
      return {
        success: false,
        message: `Payment not successfull or order mismatch (status=${razorpayPayment.status})`,
      };
    }

    return {
      success: true,
      message: "Verified",
      data: razorpayPayment,
    };
  } catch (err: any) {
    console.error("[handlePaymentSuccess] Error:", err);
    throw Error(err.message);
  }
};
