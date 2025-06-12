import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (
  recipientEmail: string,
  subject: string,
  content: string
): Promise<boolean> => {
  try {
    const data = await resend.emails.send({
      from: "Printify <onboarding@resend.dev>",
      to: recipientEmail,
      subject: subject,
      html: content,
    });

    return data.error === null;
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
    </head>
    <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f6f9fc;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <!-- Main Container -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
                        
                        <!-- Header with Logo -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px 0; text-align: center;">
                                <div style="color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 1px;">
                                    PRINTIFY
                                </div>
                                <div style="color: #e0e7ff; font-size: 14px; margin-top: 5px;">
                                    Print on Demand Platform
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                            <td style="padding: 50px 40px;">
                                <!-- Greeting -->
                                <h1 style="margin: 0 0 20px 0; color: #1f2937; font-size: 28px; font-weight: 600; text-align: center; line-height: 1.3;">
                                    Verify Your Email Address
                                </h1>
                                
                                <p style="margin: 0 0 25px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                    Hi ${recipientName},
                                </p>
                                
                                <p style="margin: 0 0 35px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                    Welcome to Printify! To complete your account setup and start your print-on-demand journey, please verify your email address using the code below.
                                </p>
                                
                                <!-- OTP Container -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
                                    <tr>
                                        <td align="center">
                                            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 12px; padding: 30px; text-align: center; position: relative;">
                                                <div style="color: #64748b; font-size: 14px; font-weight: 500; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
                                                    Verification Code
                                                </div>
                                                <div style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: bold; color: #4f46e5; letter-spacing: 12px; margin: 15px 0; text-shadow: 0 2px 4px rgba(79, 70, 229, 0.1);">
                                                    ${formattedOTP}
                                                </div>
                                                <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); margin: 15px auto; border-radius: 2px;"></div>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Expiry Notice -->
                                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 30px 0; border-radius: 6px;">
                                    <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                                        ⏰ This verification code will expire in <strong>10 minutes</strong>
                                    </p>
                                </div>
                                
                                <!-- Security Notice -->
                                <div style="background-color: #f0f9ff; border: 1px solid #e0f2fe; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                    <p style="margin: 0; color: #0c4a6e; font-size: 14px; line-height: 1.5;">
                                        🔒 <strong>Security tip:</strong> If you didn't request this verification code, please ignore this email. Your account remains secure.
                                    </p>
                                </div>
                                
                                <!-- Divider -->
                                <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent); margin: 40px 0;">
                                
                                <!-- Help Section -->
                                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                                    Need help? Contact our support team at 
                                    <a href="mailto:support@printify.com" style="color: #6366f1; text-decoration: none; font-weight: 500;">support@printify.com</a>
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td align="center">
                                            <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; font-weight: 500;">
                                                © 2024 Printify, Inc. All rights reserved.
                                            </p>
                                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                                <a href="#" style="color: #6366f1; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                                                <span style="color: #d1d5db;">•</span>
                                                <a href="#" style="color: #6366f1; text-decoration: none; margin: 0 10px;">Terms of Service</a>
                                                <span style="color: #d1d5db;">•</span>
                                                <a href="#" style="color: #6366f1; text-decoration: none; margin: 0 10px;">Unsubscribe</a>
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

export { sendEmail, generateOTP, sendOTPEmail };
