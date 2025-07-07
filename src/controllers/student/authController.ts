import { ulid } from "ulid";
import db from "../../db/database";
import bcrypt from "bcrypt";
import { sendEmail, sendOTPEmail } from "../../services/emailServices";
import { generateToken } from "../../services/jwtService";
import {
  sendSuccessResponse,
  sendValidationError,
  sendNotFoundError,
  sendInternalServerError,
  handleAsyncError,
  HttpStatus,
} from "../../utils/responseFormatter";
import { asyncHandler } from "../../utils/asyncHandler";

export const registerStudent = asyncHandler(async (req: any, res: any) => {
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
      return sendValidationError(res, "College does not exist");
    }

    if (studentExists && studentExists.isVerified) {
      return sendValidationError(res, "Student already exists, please login");
    } else if (studentExists && !studentExists.isVerified) {
      const result = await sendOTPEmail(email, name);
      console.log("result", result);
      return sendValidationError(
        res,
        "Student already exists, please verify your account"
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.$transaction(async (tx) => {
      const newStudent = await tx.user.create({
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
      if (!sendOtp.success || !sendOtp.otp) {
        throw new Error("Failed to send OTP, please try again later");
      }

      await tx.verificationOtp.create({
        data: {
          id: ulid(),
          userId: newStudent.id,
          otp: sendOtp.otp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      return {
        success: true,
        userId: newStudent.id,
        email: newStudent.email,
      };
    });

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "OTP sent to your email, Please verify your account",
      {
        userId: result.userId,
        email: result.email,
      }
    );
  } catch (error: any) {
    return handleAsyncError(
      res,
      error,
      error.message || "Error registering student"
    );
  }
});

export const verifyOtp = asyncHandler(async (req: any, res: any) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return sendValidationError(res, "User ID and OTP are required");
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
      return sendNotFoundError(res, "User not found");
    }

    if (user?.isVerified) {
      return sendValidationError(res, "User is already verified");
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
      return sendValidationError(res, "Invalid or expired OTP");
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

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "OTP verified successfully",
      {
        userId: userId,
        email: user.email,
        token: token,
      }
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error verifying OTP");
  }
});

export const loginStudent = asyncHandler(async (req: any, res: any) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendValidationError(res, "Email and password are required");
  }

  try {
    const student = await db.user.findFirst({
      where: {
        email: email,
        role: "CUSTOMER",
      },
    });

    if (!student) {
      return sendValidationError(res, "Invalid email or password");
    }

    if (!student.isVerified) {
      await sendOTPEmail(email, student?.name);
      return sendValidationError(
        res,
        "Your account is not verified, please check your email for the OTP"
      );
    }

    const matchPassword = await bcrypt.compare(
      password,
      student?.password || ""
    );

    if (!matchPassword) {
      return sendValidationError(res, "Invalid email or password");
    }

    const token = generateToken(student.id, student.email, "CUSTOMER");

    return sendSuccessResponse(res, HttpStatus.OK, "Login successful", {
      userId: student.id,
      email: student.email,
      token: token,
    });
  } catch (error) {
    return handleAsyncError(res, error, "Error logging in student");
  }
});

export const findColleges = asyncHandler(async (req: any, res: any) => {
  const { country, state } = req.query;

  if (!country || !state) {
    return sendValidationError(res, "Country and state are required");
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

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Colleges retrieved successfully",
      colleges
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error retrieving colleges");
  }
});

export const getStudentProfile = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;

  try {
    const student = await db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        countryCode: true,
        college: {
          select: {
            id: true,
            name: true,
            country: true,
            state: true,
            Stationary: true,
          },
        },
      },
    });

    if (!student) {
      return sendNotFoundError(res, "Student not found");
    }

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Student profile retrieved successfully",
      student
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error retrieving student profile");
  }
});

export const updateStudentProfile = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;
  const { name } = req.body;

  try {
    const student = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!student) {
      return sendNotFoundError(res, "Student not found");
    }

    const updatedStudent = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
      },
    });

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Student profile updated successfully",
      updatedStudent
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error updating student profile");
  }
});

export const changeStudentPassword = asyncHandler(
  async (req: any, res: any) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    try {
      const student = await db.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!student) {
        return sendNotFoundError(res, "Student not found");
      }

      const matchCurrentPassword = await bcrypt.compare(
        currentPassword,
        student.password || ""
      );

      if (!matchCurrentPassword) {
        return sendValidationError(res, "Old password is incorrect");
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      const updatedStudent = await db.user.update({
        where: {
          id: userId,
        },
        data: {
          password: hashedNewPassword,
        },
      });

      const { password, ...rest } = updatedStudent;

      return sendSuccessResponse(
        res,
        HttpStatus.OK,
        "Password changed successfully",
        rest
      );
    } catch (error) {
      return handleAsyncError(res, error, "Error changing student password");
    }
  }
);

export const getPrintingRates = asyncHandler(async (req: any, res: any) => {
  const { stationaryId } = req.query;

  try {
    const stationary = await db.stationary.findFirst({
      where: {
        id: stationaryId,
      },
    });

    if (!stationary) {
      return sendNotFoundError(res, "Stationary not found");
    }

    const printingRates = await db.printingRates.findFirst({
      where: {
        stationaryId: stationary.id,
      },
    });

    if (!printingRates) {
      return sendNotFoundError(
        res,
        "Printing rates not found for this stationary"
      );
    }

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Printing rates fetched successfully",
      {
        colorRate: printingRates.colorRate,
        bwRate: printingRates.bwRate,
        duplexExtra: printingRates.duplexExtra,
        hardbindRate: printingRates.hardbindRate,
        spiralRate: printingRates.spiralRate,
      }
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error fetching printing rates");
  }
});

export const getMyStationaries = asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;

  try {
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        collegeId: true,
      },
    });

    if (!user) {
      return sendNotFoundError(res, "User not found");
    }
    const stationaries = await db.stationary.findMany({
      where: {
        collegeId: user?.collegeId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sendSuccessResponse(
      res,
      HttpStatus.OK,
      "Stationaries retrieved successfully",
      stationaries
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error retrieving stationaries");
  }
});
