import { ulid } from "ulid";
import db from "../../db/database";
import bcrypt from "bcrypt";
import { generateToken } from "../../services/jwtService";

export const adminLogin = async (req: any, res: any) => {
  const { email, password } = req.body;
  try {
    const staff = await db.staff.findFirst({
      where: {
        email: email,
        role: "ADMIN",
      },
    });
    if (!staff) {
      const hashedPassword = await bcrypt.hash(password, 10);
      if (!hashedPassword) {
        return res.status(500).json({
          message: "Error hashing password",
          success: false,
        });
      }
      const newStaff = await db.staff.create({
        data: {
          id: ulid(),
          name: "jetha",
          email: email,
          password: hashedPassword,
          role: "ADMIN",
        },
      });
      const token = generateToken(newStaff.id, newStaff.email, "ADMIN");
      return res.status(201).json({
        success: true,
        message: "Staff created successfully",
        data: {
          userId: newStaff.id,
          email: newStaff.email,
          token: token,
        },
      });
    }
    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password",
        success: false,
      });
    }
    const token = generateToken(staff.id, staff.email, "ADMIN");
    return res.status(200).json({
      success: true,

      message: "Login successful",
      data: {
        userId: staff.id,
        email: staff.email,
        token: token,
      },
    });
  } catch (error) {
    console.error("Error during admin login:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
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
        success: false,
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
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!hashedPassword) {
      return res.status(500).json({
        message: "Error hashing password",
        success: false,
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
      success: true,
    });
  } catch (error) {
    console.error("Error registering stationary owner:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,

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
    colorRate,
    bwRate,
    duplexExtra,
    hardbindRate,
    spiralRate,
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

    if (newStationary) {
      console.log("andr hu");
      await db.printingRates.create({
        data: {
          id: ulid(),
          stationaryId: newStationary.id,
          colorRate,
          bwRate,
          duplexExtra,
          hardbindRate,
          spiralRate,
        },
      });
    }
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
