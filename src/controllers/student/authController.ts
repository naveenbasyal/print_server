import { ulid } from "ulid";
import db from "../../db/database";
import bcrypt from "bcrypt";
import { sendEmail, sendOTPEmail } from "../../services/emailServices";

export const registerStudent = async (req: any, res: any) => {
  const { name, email, password, collegeId } = req.body;
  try {
    const [studentExists, collegeExists] = await Promise.all([
      await db.user.findFirst({
        where: {
          email: email,
        },
      }),
      await db.college.findUnique({
        where: {
          id: collegeId,
        },
      }),
    ]);
    if (!collegeExists) {
      return res.status(400).json({
        message: "College does not exist",
      });
    }
    if (studentExists && studentExists.isVerified) {
      return res.status(400).json({
        message: "Student already exists, please login",
      });
    } else if (studentExists && !studentExists.isVerified) {
      return res.status(400).json({
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

    const sendOtp = await sendOTPEmail(email);

    return res.status(201).json({
      message: "Student registered successfully",
      data: newStudent,
    });
  } catch (error) {}
};

export const findColleges = async (req: any, res: any) => {
  const { country, state } = req.params;

  try {
    const colleges = await db.college.findMany({
      where: {
        country: country,
        state: state,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.status(200).json({
      message: "Colleges retrieved successfully",
      data: colleges,
    });
  } catch (error: unknown) {
    console.error("Error retrieving colleges:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
