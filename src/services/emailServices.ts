import nodemailer from "nodemailer";
import "dotenv/config";

const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const sendEmail = async (
  recipientEmail: string,
  subject: string,
  content: string
): Promise<boolean> => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error(
        "Missing EMAIL_USER or EMAIL_PASSWORD in environment variables"
      );
    }

    const transporter = createTransporter();
    console.log(
      "Creating email transporter with user:",
      process.env.EMAIL_USER,
      process.env.EMAIL_PASSWORD
    );

    const mailOptions = {
      from: `"Printify" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: content,
    };
    console.log("sending");

    const info = await transporter.sendMail(mailOptions);
    console.log("Email info:", info);
    console.log("Email options:", mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createOTPEmailTemplate = (
  otp: string,
  recipientName = "there"
): string => {
  const formattedOTP = otp.split("").join(" ");

  return `
   <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Printify Verification Code</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .mobile-padding {
                padding: 20px !important;
            }
            .mobile-text {
                font-size: 14px !important;
            }
            .otp-code {
                font-size: 36px !important;
                letter-spacing: 8px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa; min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Main Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #e2e8f0;">
                    
                    <!-- Header with Logo -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #5588ff 0%, #3366ff 100%); padding: 40px 0; text-align: center; position: relative;">
                            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #3366ff, #3366ff, #3366ff);"></div>
                            <div style="color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 2px; margin-bottom: 8px;">
                                PRINTIFY
                            </div>
                            <div style="color: #c7d2fe; font-size: 15px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                                Print on Demand Platform
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 60px 50px 50px 50px;" class="mobile-padding">
                            <!-- Greeting -->
                            <h1 style="margin: 0 0 16px 0; color: #1e293b; font-size: 32px; font-weight: 700; text-align: center; line-height: 1.2;">
                                Verify Your Email Address
                            </h1>
                            
                            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 16px; text-align: center; font-weight: 500;">
                                Complete your account setup to get started
                            </p>
                            
                            <!-- Divider -->
                            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #4f46e5, #7c3aed); margin: 32px auto; border-radius: 2px;"></div>
                            
                            <p style="margin: 0 0 24px 0; color: #1e293b; font-size: 18px; line-height: 1.6; font-weight: 500;">
                                Hello ${recipientName},
                            </p>
                            
                            <p style="margin: 0 0 32px 0; color: #475569; font-size: 16px; line-height: 1.7;" class="mobile-text">
                                Welcome to Printify! To complete your account setup and start building your print-on-demand business, please verify your email address using the verification code below.
                            </p>
                            
                            <!-- OTP Container -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 48px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #e2e8f0; border-radius: 16px; padding: 40px 30px; text-align: center; position: relative; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
                                            <div style="color: #64748b; font-size: 13px; font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1.5px;">
                                                Verification Code
                                            </div>
                                            <div style="font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; font-size: 48px; font-weight: 800; color: #5588ff; letter-spacing: 16px; margin: 20px 0; text-shadow: 0 2px 8px rgba(79, 70, 229, 0.15); line-height: 1;" class="otp-code">
                                                ${formattedOTP}
                                            </div>
                                            <div style="width: 80px; height: 4px; background: linear-gradient(90deg, #4f46e5, #7c3aed); margin: 20px auto 0; border-radius: 2px;"></div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Expiry Notice -->
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 20px 24px; margin: 32px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);">
                                <p style="margin: 0; color: #92400e; font-size: 15px; font-weight: 600; display: flex; align-items: center;">
                                    <span style="font-size: 18px; margin-right: 8px;">⏰</span>
                                    This verification code expires in <strong>10 minutes</strong>
                                </p>
                            </div>
                            
                            <!-- Instructions -->
                            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; padding: 24px; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(14, 165, 233, 0.08);">
                                <p style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 15px; font-weight: 600; display: flex; align-items: center;">
                                    <span style="font-size: 18px; margin-right: 8px;">📋</span>
                                    How to use this code:
                                </p>
                                <p style="margin: 0; color: #0369a1; font-size: 14px; line-height: 1.6; padding-left: 26px;">
                                    Return to the Printify sign-up page and enter the verification code exactly as shown above to complete your account setup.
                                </p>
                            </div>
                            
                            <!-- Security Notice -->
                            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; padding: 24px; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(34, 197, 94, 0.06);">
                                <p style="margin: 0; color: #14532d; font-size: 14px; line-height: 1.6; display: flex; align-items: flex-start;">
                                    <span style="font-size: 16px; margin-right: 8px; margin-top: 2px;">🔒</span>
                                    <span><strong>Security Notice:</strong> If you didn't request this verification code, please ignore this email. Your account remains secure and no action is required.</span>
                                </p>
                            </div>
                            
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 32px 50px; border-top: 1px solid #e2e8f0;" class="mobile-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                                            © 2025 Printify, Inc. All rights reserved.
                                        </p>
                                        <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                                            This email was sent to verify your account. 
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};

const sendOTPEmail = async (
  email: string,
  name?: string
): Promise<{ success: boolean; otp?: string }> => {
  console.log("Sending OTP email to:", email);
  if (!email) {
    throw new Error("Email address is required");
  }
  if (!name) {
    name = "there";
  }
  const otp = generateOTP();
  const subject = "Your Printify Verification Code";
  const content = createOTPEmailTemplate(otp, name);

  const success = await sendEmail(email, subject, content);

  console.log("Email sent successfully:", success);

  return {
    success,
    otp: success ? otp : undefined,
  };
};

export type OrderStatusType =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "CANCELLED"
  | "COMPLETED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export interface OrderEmailInfo {
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatusType;
  orderType: "DELIVERY" | "TAKEAWAY";
  totalPrice: number;
  deliveryAddress?: string | null | undefined;
  deliveryFee?: number | null | undefined;
  otp: string;
  createdAt: Date;
  stationaryName: string;
  stationaryPhone: string;
  stationaryAddress: string;
  collegeName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    coloured: boolean;
    duplex: boolean;
    spiral: boolean;
    hardbind: boolean;
    fileType: string;
  }>;
  paymentId: string | null;
}

const getStatusMessage = (
  status: OrderStatusType,
  orderType: "DELIVERY" | "TAKEAWAY"
): {
  title: string;
  message: string;
  color: string;
  icon: string;
  customerAction?: string;
} => {
  const statusMap = {
    PENDING: {
      title: "Order Placed! 📋",
      message:
        "Thank you for your order! Your printing request has been submitted and is waiting for the stationary to accept it. We'll notify you once it's accepted.",
      color: "#f59e0b",
      icon: "⏳",
      customerAction: "Please wait for stationary acceptance",
    },
    ACCEPTED: {
      title: "Order Accepted! ✅",
      message:
        "Great news! Your order has been accepted by the stationary and will be processed shortly. You'll receive updates as your order progresses.",
      color: "#10b981",
      icon: "✅",
      customerAction: "Your order is now in queue for processing",
    },
    IN_PROGRESS: {
      title: "Printing in Progress! 🖨️",
      message:
        "Your documents are currently being printed. Our team is working on your order and will have it ready soon.",
      color: "#3b82f6",
      icon: "🖨️",
      customerAction: "Your order is being processed",
    },
    COMPLETED: {
      title:
        orderType === "TAKEAWAY"
          ? "Order Ready for Pickup! 📦"
          : "Order Completed! ✅",
      message:
        orderType === "TAKEAWAY"
          ? "Your order has been completed and is ready for pickup! Please visit the stationary with your OTP to collect your order."
          : "Your order has been completed and is ready for delivery! Our delivery partner will contact you soon.",
      color: "#10b981",
      icon: orderType === "TAKEAWAY" ? "📦" : "✅",
      customerAction:
        orderType === "TAKEAWAY"
          ? "Visit stationary with OTP for pickup"
          : "Wait for delivery partner contact",
    },
    OUT_FOR_DELIVERY: {
      title: "Out for Delivery! 🚛",
      message:
        "Your order is out for delivery! Our delivery partner is on the way to your location. Please ensure someone is available to receive the order.",
      color: "#8b5cf6",
      icon: "🚛",
      customerAction: "Be available to receive your order",
    },
    DELIVERED: {
      title: "Order Delivered! 🎉",
      message:
        "Your order has been successfully delivered! Thank you for choosing our service. We hope you're satisfied with your printed materials.",
      color: "#10b981",
      icon: "🎉",
      customerAction: "Order completed - Thank you!",
    },
    CANCELLED: {
      title: "Order Cancelled ❌",
      message:
        "Your order has been cancelled. If you have any questions or need assistance, please contact our support team or the stationary directly.",
      color: "#ef4444",
      icon: "❌",
      customerAction: "Contact support if you have questions",
    },
  };

  return statusMap[status];
};

const formatPrice = (price: number): string => {
  return `₹${price}`;
};

const getServiceDetails = (item: OrderEmailInfo["items"][0]): string[] => {
  const services = [];
  if (item.coloured) services.push("Color");
  if (item.duplex) services.push("Duplex");
  if (item.spiral) services.push("Spiral Binding");
  if (item.hardbind) services.push("Hard Binding");
  return services;
};

const createOrderStatusEmailTemplate = (orderInfo: OrderEmailInfo): string => {
  const statusInfo = getStatusMessage(orderInfo.status, orderInfo.orderType);

  const itemsHtml = orderInfo.items
    .map((item) => {
      const services = getServiceDetails(item);
      return `
      <tr>
        <td style="padding: 16px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
          <div style="font-weight: 600; color: #1e293b; font-size: 15px; margin-bottom: 4px;">
            ${item.name}
          </div>
          <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">
            ${item.fileType.toUpperCase()} File
          </div>
          ${
            services.length > 0
              ? `
            <div style="font-size: 12px; color: #059669; background: #ecfdf5; padding: 2px 6px; border-radius: 4px; display: inline-block;">
              ${services.join(", ")}
            </div>
          `
              : ""
          }
        </td>
        <td style="padding: 16px 12px; text-align: center; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">
          ${item.quantity}
        </td>
        <td style="padding: 16px 12px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600;">
          ${formatPrice(item.price)}
        </td>
      </tr>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update - Printify</title>
        <style>
            @media only screen and (max-width: 600px) {
                .container {
                    width: 100% !important;
                    max-width: 100% !important;
                }
                .mobile-padding {
                    padding: 20px !important;
                }
                .mobile-text {
                    font-size: 14px !important;
                }
                .order-id {
                    font-size: 16px !important;
                }
                .status-badge {
                    font-size: 14px !important;
                    padding: 8px 16px !important;
                }
                .otp-code {
                    font-size: 24px !important;
                    letter-spacing: 4px !important;
                }
            }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa; min-height: 100vh;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <!-- Main Container -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #e2e8f0;">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #5588ff 0%, #3366ff 100%); padding: 40px 0; text-align: center; position: relative;">
                                <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #3366ff, #3366ff, #3366ff);"></div>
                                <div style="color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 2px; margin-bottom: 8px;">
                                    PRINTIFY
                                </div>
                                <div style="color: #c7d2fe; font-size: 15px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                                    Order Status Update
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                            <td style="padding: 50px 50px 40px 50px;" class="mobile-padding">
                                
                                <!-- Status Title -->
                                <div style="text-align: center; margin-bottom: 32px;">
                                    <div style="background: ${statusInfo.color}; color: white; display: inline-block; padding: 12px 24px; border-radius: 25px; font-size: 16px; font-weight: 600; margin-bottom: 16px;" class="status-badge">
                                        ${statusInfo.icon} ${statusInfo.title}
                                    </div>
                                    <h1 style="margin: 0 0 8px 0; color: #1e293b; font-size: 28px; font-weight: 700; line-height: 1.2;" class="order-id">
                                        Order #${orderInfo.orderId.slice(-8).toUpperCase()}
                                    </h1>
                                    <div style="color: #64748b; font-size: 14px; font-weight: 500;">
                                        ${orderInfo.orderType === "DELIVERY" ? "📦 Delivery Order" : "🏪 Takeaway Order"}
                                    </div>
                                </div>
                                
                                <!-- Greeting -->
                                <p style="margin: 0 0 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                                    Hello ${orderInfo.customerName},
                                </p>
                                
                                <!-- Status Message -->
                                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-left: 4px solid ${statusInfo.color}; padding: 24px; margin: 32px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
                                    <p style="margin: 0 0 16px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                                        ${statusInfo.message}
                                    </p>
                                    ${
                                      statusInfo.customerAction
                                        ? `
                                    <div style="background: rgba(255, 255, 255, 0.8); padding: 12px; border-radius: 8px; border: 1px solid ${statusInfo.color};">
                                        <p style="margin: 0; color: #1e293b; font-size: 14px; font-weight: 600;">
                                            📌 Next Step: ${statusInfo.customerAction}
                                        </p>
                                    </div>
                                    `
                                        : ""
                                    }
                                </div>
                                
                                <!-- OTP Section (for pickup orders) -->
                                ${
                                  orderInfo.orderType === "TAKEAWAY" &&
                                  (orderInfo.status === "COMPLETED" ||
                                    orderInfo.status === "ACCEPTED")
                                    ? `
                                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center;">
                                    <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px; font-weight: 600;">
                                        🔐 Pickup OTP
                                    </h3>
                                    <div style="font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; font-size: 36px; font-weight: 800; color: #f59e0b; letter-spacing: 8px; margin: 16px 0;" class="otp-code">
                                        ${orderInfo.otp}
                                    </div>
                                    <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                                        Show this OTP to the stationary when collecting your order
                                    </p>
                                </div>
                                `
                                    : ""
                                }
                                
                                <!-- Order Items -->
                                <div style="margin: 32px 0;">
                                    <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                                        Order Items
                                    </h3>
                                    
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                                        <thead>
                                            <tr style="background: #f8fafc;">
                                                <th style="padding: 16px 12px; text-align: left; font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Item Details</th>
                                                <th style="padding: 16px 12px; text-align: center; font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                                                <th style="padding: 16px 12px; text-align: right; font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${itemsHtml}
                                            <tr style="background: #f8fafc; border-top: 2px solid #e2e8f0;">
                                                <td style="padding: 16px 12px; font-weight: 600; color: #1e293b;" colspan="2">
                                                    Total Amount
                                                    ${orderInfo.deliveryFee ? `<br><span style="font-size: 12px; color: #64748b; font-weight: 500;">+ Delivery Fee: ${formatPrice(orderInfo.deliveryFee)}</span>` : ""}
                                                </td>
                                                <td style="padding: 16px 12px; text-align: right; font-weight: 700; color: #1e293b; font-size: 18px;">
                                                    ${formatPrice(orderInfo.totalPrice)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <!-- Stationary Details -->
                                <div style="background: #f0f9ff; padding: 24px; border-radius: 12px; margin: 32px 0; border: 1px solid #bae6fd;">
                                    <h4 style="margin: 0 0 16px 0; color: #1e40af; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                                        <span style="font-size: 18px; margin-right: 8px;">🏪</span>
                                        Stationary Details
                                    </h4>
                                    <div style="color: #1e40af; font-size: 14px; line-height: 1.6;">
                                        <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${orderInfo.stationaryName}</p>
                                        <p style="margin: 0 0 8px 0;"><strong>College:</strong> ${orderInfo.collegeName}</p>
                                        ${orderInfo.stationaryPhone ? `<p style="margin: 0 0 8px 0;"><strong>Phone:</strong> ${orderInfo.stationaryPhone}</p>` : ""}
                                        ${orderInfo.stationaryAddress ? `<p style="margin: 0;"><strong>Address:</strong> ${orderInfo.stationaryAddress}</p>` : ""}
                                    </div>
                                </div>
                                
                                <!-- Delivery Address (for delivery orders) -->
                                ${
                                  orderInfo.orderType === "DELIVERY" &&
                                  orderInfo.deliveryAddress
                                    ? `
                                <div style="background: #f0fdf4; padding: 24px; border-radius: 12px; margin: 32px 0; border: 1px solid #bbf7d0;">
                                    <h4 style="margin: 0 0 12px 0; color: #15803d; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                                        <span style="font-size: 18px; margin-right: 8px;">📍</span>
                                        Delivery Address
                                    </h4>
                                    <p style="margin: 0; color: #15803d; font-size: 14px; line-height: 1.6;">
                                        ${orderInfo.deliveryAddress}
                                    </p>
                                </div>
                                `
                                    : ""
                                }
                                
                                <!-- Order Summary -->
                                <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin: 32px 0; border: 1px solid #e2e8f0;">
                                    <h4 style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px; font-weight: 600;">
                                        Order Summary
                                    </h4>
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Order ID:</td>
                                            <td style="padding: 4px 0; color: #1e293b; font-size: 14px; font-weight: 500; text-align: right;">#${orderInfo.orderId.slice(-8).toUpperCase()}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Order Date:</td>
                                            <td style="padding: 4px 0; color: #1e293b; font-size: 14px; font-weight: 500; text-align: right;">${orderInfo.createdAt.toLocaleDateString("en-IN")}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Order Type:</td>
                                            <td style="padding: 4px 0; color: #1e293b; font-size: 14px; font-weight: 500; text-align: right;">${orderInfo.orderType}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Total Amount:</td>
                                            <td style="padding: 4px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${formatPrice(orderInfo.totalPrice)}</td>
                                        </tr>
                                        ${
                                          orderInfo.paymentId
                                            ? `
                                        <tr>
                                            <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Payment ID:</td>
                                            <td style="padding: 4px 0; color: #1e293b; font-size: 14px; font-weight: 500; text-align: right;">${orderInfo.paymentId}</td>
                                        </tr>
                                        `
                                            : ""
                                        }
                                        
                                    </table>
                                </div>
                                
                                
                                
                                <!-- Support -->
                                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; padding: 20px; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);">
                                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6; display: flex; align-items: flex-start;">
                                        <span style="font-size: 16px; margin-right: 8px; margin-top: 2px;">💬</span>
                                        <span><strong>Need Help?</strong> If you have any questions about your order, please contact the stationary directly or reach out to our support team.</span>
                                    </p>
                                </div>
                                
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 32px 50px; border-top: 1px solid #e2e8f0;" class="mobile-padding">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td align="center">
                                            <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                                                © 2025 Printify, Inc. All rights reserved.
                                            </p>
                                            <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                                                This email was sent to update you about your order status.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
};

// Main function to send order status email
export const sendOrderStatusEmail = async (
  email: string,
  orderInfo: OrderEmailInfo
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(
      `Sending order status email to: ${email} for order: ${orderInfo.orderId}`
    );

    if (!email) {
      throw new Error("Email address is required");
    }

    if (!orderInfo.orderId || !orderInfo.customerName || !orderInfo.status) {
      throw new Error("Order ID, customer name, and status are required");
    }

    const statusInfo = getStatusMessage(orderInfo.status, orderInfo.orderType);
    const subject = `${statusInfo.title} - Order #${orderInfo.orderId.slice(-8).toUpperCase()}`;
    const content = createOrderStatusEmailTemplate(orderInfo);

    const success = await sendEmail(email, subject, content);

    console.log(`Order status email sent successfully: ${success}`);

    return {
      success,
      error: success ? undefined : "Failed to send email",
    };
  } catch (error) {
    console.error("Error sending order status email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const sendOrderPlacedEmail = async (
  email: string,
  orderInfo: Omit<OrderEmailInfo, "status">
): Promise<{ success: boolean; error?: string }> => {
  return sendOrderStatusEmail(email, { ...orderInfo, status: "PENDING" });
};

export const sendOrderAcceptedEmail = async (
  email: string,
  orderInfo: Omit<OrderEmailInfo, "status">
): Promise<{ success: boolean; error?: string }> => {
  return sendOrderStatusEmail(email, { ...orderInfo, status: "ACCEPTED" });
};

export const sendOrderInProgressEmail = async (
  email: string,
  orderInfo: Omit<OrderEmailInfo, "status">
): Promise<{ success: boolean; error?: string }> => {
  return sendOrderStatusEmail(email, { ...orderInfo, status: "IN_PROGRESS" });
};

export const sendOrderCompletedEmail = async (
  email: string,
  orderInfo: Omit<OrderEmailInfo, "status">
): Promise<{ success: boolean; error?: string }> => {
  console.log("email", email);
  console.log("orderInfo", orderInfo);
  return sendOrderStatusEmail(email, { ...orderInfo, status: "COMPLETED" });
};

export const sendOrderOutForDeliveryEmail = async (
  email: string,
  orderInfo: Omit<OrderEmailInfo, "status">
): Promise<{ success: boolean; error?: string }> => {
  return sendOrderStatusEmail(email, {
    ...orderInfo,
    status: "OUT_FOR_DELIVERY",
  });
};

export const sendOrderDeliveredEmail = async (
  email: string,
  orderInfo: Omit<OrderEmailInfo, "status">
): Promise<{ success: boolean; error?: string }> => {
  return sendOrderStatusEmail(email, { ...orderInfo, status: "DELIVERED" });
};

export const sendOrderCancelledEmail = async (
  email: string,
  orderInfo: Omit<OrderEmailInfo, "status">
): Promise<{ success: boolean; error?: string }> => {
  return sendOrderStatusEmail(email, { ...orderInfo, status: "CANCELLED" });
};

// Helper function to fetch order data from database and send email
export const sendOrderStatusEmailFromDB = async (
  orderId: string,
  newStatus: OrderStatusType,
  prisma: any // Replace with your Prisma client type
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Fetch order data from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: {
            college: true,
          },
        },
        stationary: true,
        OrderItem: true,
        college: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Map database order to email format
    const orderEmailInfo: OrderEmailInfo = {
      orderId: order.id,
      customerName: order.user.name,
      customerEmail: order.user.email,
      status: newStatus,
      orderType: order.orderType,
      totalPrice: order.totalPrice,
      deliveryAddress: order.deliveryAddress,
      deliveryFee: order.deliveryFee,
      otp: order.otp,
      createdAt: order.createdAt,
      stationaryName: order.stationary.name,
      stationaryPhone: order.stationary.phone,
      stationaryAddress: order.stationary.address,
      collegeName: order.college.name,
      items: order.OrderItem.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        coloured: item.coloured,
        duplex: item.duplex,
        spiral: item.spiral,
        hardbind: item.hardbind,
        fileType: item.fileType,
      })),
      paymentId: order.paymentId,
    };

    // Send email
    return await sendOrderStatusEmail(order.user.email, orderEmailInfo);
  } catch (error) {
    console.error("Error sending order status email from DB:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
export { sendEmail, generateOTP, sendOTPEmail };
