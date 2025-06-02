import { ulid } from "ulid";
import db from "../../db/database";
import bcrypt from "bcrypt";

export const registerCollege = async (req: any, res: any) => {
  const { name, email, state, country, isVerified } = req.body;

  try {
    const collegeExists = await db.college.findFirst({
      where: {
        email: email,
      },
    });
    if (collegeExists) {
      return res.status(400).json({
        message: "College already exists",
      });
    }
    const newCollege = await db.college.create({
      data: {
        id: ulid(),
        name: name,
        email: email,
        state: state,
        country: country,
        isVerified: isVerified,
      },
    });
    return res.status(201).json({
      message: "College registered successfully",
      data: newCollege,
    });
  } catch (error: unknown) {
    console.error("Error registering college:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getColleges = async (req: any, res: any) => {
  try {
    const colleges = await db.college.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })
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
export const registerStationaryOwner = async (req: any, res: any) => {
  const { name, email, countryCode, phone, password, isVerified, collegeId } =
    req.body;
  try {
    const ownerExists = await db.user.findFirst({
      where: {
        email: email,
      },
    });
    if (ownerExists) {
      return res.status(400).json({
        message: "Owner already exists",
      });
    }
    const collegeExists = await db.college.findUnique({
      where: {
        id: collegeId,
      },
    });
    if (!collegeExists) {
      return res.status(400).json({
        message: "College does not exist",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!hashedPassword) {
      return res.status(500).json({
        message: "Error hashing password",
      });
    }
    const newOwner = await db.user.create({
      data: {
        id: ulid(),
        name,
        email,
        countryCode,
        phone,
        password: hashedPassword,
        isVerified,
        role: "STATIONARY_OWNER",
        collegeId: collegeId,
      },
    });
    return res.status(201).json({
      message: "Stationary owner registered successfully",
      data: newOwner,
    });
  } catch (error) {
    console.error("Error registering stationary owner:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const registerStationary = async (req: any, res: any) => {
  const {
    collegeId,
    name,
    email,
    countryCode,
    phone,
    isActive,
    canDeliver,
    address,
    ownerId,
  } = req.body;
  try {
    const stationaryExists = await db.stationary.findFirst({
      where: {
        email: email,
      },
    });
    if (stationaryExists) {
      return res.status(400).json({
        message: "Stationary already exists",
      });
    }
    const collegeExists = await db.college.findUnique({
      where: {
        id: collegeId,
      },
    });
    if (!collegeExists) {
      return res.status(400).json({
        message: "College does not exist",
      });
    }
    const ownerExists = await db.user.findUnique({
      where: {
        id: ownerId,
      },
    });
    if (!ownerExists) {
      return res.status(400).json({
        message: "Owner does not exist",
      });
    }
    const newStationary = await db.stationary.create({
      data: {
        id: ulid(),
        name,
        email,
        countryCode,
        phone,
        isActive,
        canDeliver,
        address,
        collegeId,
        ownerId,
      },
    });
    return res.status(201).json({
      message: "Stationary registered successfully",
      data: newStationary,
    });
  } catch (error) {
    console.error("Error registering stationary:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
