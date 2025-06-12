import { ulid } from "ulid";
import db from "../../db/database";
import bcrypt from "bcrypt";
import { sendEmail, sendOTPEmail } from "../../services/emailServices";
import { generateToken } from "../../services/jwtService";

export const registerStudent = async (req: any, res: any) => {
  const { name, email, password, collegeId } = req.body;

  try {
    const [studentExists, collegeExists] = await Promise.all([
      db.user.findFirst({
        where: {
          email: email,
        },
      }),
      db.college.findUnique({
        where: {
          id: collegeId,
        },
      }),
    ]);

    if (!collegeExists) {
      return res.status(400).json({
        success: false,

        message: "College does not exist",
      });
    }
    if (studentExists && studentExists.isVerified) {
      return res.status(400).json({
        success: false,

        message: "Student already exists, please login",
      });
    } else if (studentExists && !studentExists.isVerified) {
      const result = await sendOTPEmail(email, name);
      console.log("result", result);
      return res.status(400).json({
        success: false,
        message: "Student already exists, please verify your account",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await db.user.create({
      data: {
        id: ulid(),
        name,
        email,
        password: hashedPassword,
        collegeId,
        role: "CUSTOMER",
        isVerified: false,
      },
    });

    const sendOtp = await sendOTPEmail(email, name);

    if (sendOtp && sendOtp.success) {
      if (sendOtp.otp) {
        await db.verificationOtp.create({
          data: {
            id: ulid(),
            userId: newStudent.id,
            otp: sendOtp.otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "OTP sent to your email, Please verify your account",
        data: {
          userId: newStudent.id,
          email: newStudent.email,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP, please try again later",
        data: sendOtp,
      });
    }
  } catch (error) {
    console.error("Error registering student:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,

      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const verifyOtp = async (req: any, res: any) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    return res.status(400).json({
      success: false,

      message: "User ID and OTP are required",
    });
  }

  try {
    const user = await db.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        email: true,
        isVerified: true,
      },
    });
    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }
    if (user?.isVerified) {
      return res.status(400).json({
        success: false,

        message: "User is already verified",
      });
    }

    const verificationOtp = await db.verificationOtp.findFirst({
      where: {
        userId: userId,
        otp: otp,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!verificationOtp) {
      return res.status(400).json({
        success: false,

        message: "Invalid or expired OTP",
      });
    }

    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        isVerified: true,
      },
    });

    await db.verificationOtp.delete({
      where: {
        id: verificationOtp.id,
      },
    });

    const token = generateToken(userId, user.email, "CUSTOMER");
    return res.status(200).json({
      message: "OTP verified successfully",
      data: {
        userId: userId,
        email: user.email,
        token: token,
      },
      success: true,
    });
  } catch (error: unknown) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,

      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const loginStudent = async (req: any, res: any) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }
  try {
    const student = await db.user.findFirst({
      where: {
        email: email,
        role: "CUSTOMER",
      },
    });
    if (!student) {
      return res.status(400).json({
        success: false,

        message: "Invalid email or password",
      });
    }
    if (!student.isVerified) {
      await sendOTPEmail(email, student?.name);
      return res.status(400).json({
        success: false,

        message:
          "Your account is not verified, please check your email for the OTP",
      });
    }
    const matchPassword = await bcrypt.compare(
      password,
      student?.password || ""
    );
    if (!matchPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    const token = generateToken(student.id, student.email, "CUSTOMER");
    return res.status(200).json({
      success: true,

      message: "Login successful",
      data: {
        userId: student.id,
        email: student.email,
        token: token,
      },
    });
  } catch (error: unknown) {
    console.error("Error logging in student:", error);
    return res.status(500).json({
      success: false,

      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const findColleges = async (req: any, res: any) => {
  const { country, state } = req.query;
  if (!country || !state) {
    return res.status(400).json({
      success: false,

      message: "Country and state are required",
    });
  }

  try {
    const colleges = await db.college.findMany({
      where: {
        state: {
          equals: state.trim(),
          mode: "insensitive",
        },
        country: {
          equals: country.trim(),
          mode: "insensitive",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,

      message: "Colleges retrieved successfully",
      data: colleges,
    });
  } catch (error: unknown) {
    console.error("Error retrieving colleges:", error);
    return res.status(500).json({
      success: false,

      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
