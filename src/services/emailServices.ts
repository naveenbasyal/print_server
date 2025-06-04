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

const sendOTPEmail = async (
  email: string
): Promise<{ success: boolean; otp?: string }> => {
  const otp = generateOTP();

  const subject = "Your Verification Code";
  const content = `
        <div>
            <h1>Verification Code</h1>
            <p>Your six-digit verification code is:</p>
            <h2 style="letter-spacing: 3px; font-size: 24px;">${otp}</h2>
            <p>This code will expire in 10 minutes.</p>
        </div>
    `;

  const success = await sendEmail(email, subject, content);
  console.log("success", success);

  return {
    success,
    otp: success ? otp : undefined,
  };
};

export { sendEmail, generateOTP, sendOTPEmail };
