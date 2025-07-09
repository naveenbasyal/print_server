import { ulid } from "ulid";
import db from "../../db/database";
import bcrypt from "bcrypt";
import { generateToken } from "../../services/jwtService";
import {
  sendSuccessResponse,
  sendValidationError,
  handleAsyncError,
  HttpStatus,
} from "../../utils/responseFormatter";
import { asyncHandler } from "../../utils/asyncHandler";


// Flow
// 1. Admin login
// 2. Register college
// 3. Get colleges
// 4. Register stationary owner
// 5. Register stationary shop
export const adminLogin = asyncHandler(async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const staff = await db.staff.findFirst({ where: { email, role: "ADMIN" } });

    if (!staff) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newStaff = await db.staff.create({
        data: {
          id: ulid(),
          name: "jetha",
          email,
          password: hashedPassword,
          role: "ADMIN",
        },
      });
      const token = generateToken(newStaff.id, newStaff.email, "ADMIN");
      return sendSuccessResponse(
        res,
        HttpStatus.CREATED,
        "Staff created successfully",
        {
          userId: newStaff.id,
          email: newStaff.email,
          token,
        }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      return sendValidationError(res, "Invalid password");
    }

    const token = generateToken(staff.id, staff.email, "ADMIN");
    return sendSuccessResponse(res, HttpStatus.OK, "Login successful", {
      userId: staff.id,
      email: staff.email,
      token,
    });
  } catch (error) {
    return handleAsyncError(res, error, "Error during admin login");
  }
});

export const registerCollege = asyncHandler(async (req: any, res: any) => {
  try {
    const { name, email, state, country, isVerified } = req.body;

    const collegeExists = await db.college.findFirst({ where: { email } });
    if (collegeExists)
      return sendValidationError(res, "College already exists");

    const newCollege = await db.college.create({
      data: { id: ulid(), name, email, state, country, isVerified },
    });

    return sendSuccessResponse(
      res,
      HttpStatus.CREATED,
      "College registered successfully",
      newCollege
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error registering college");
  }
});

export const getColleges = asyncHandler(async (req: any, res: any) => {
  try {
    const colleges = await db.college.findMany({
      orderBy: { createdAt: "desc" },
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

export const registerStationaryOwner = asyncHandler(
  async (req: any, res: any) => {
    try {
      const {
        name,
        email,
        countryCode,
        phone,
        password,
        isVerified,
        collegeId,
      } = req.body;

      const ownerExists = await db.user.findFirst({ where: { email } });
      if (ownerExists) return sendValidationError(res, "Owner already exists");

      const collegeExists = await db.college.findUnique({
        where: { id: collegeId },
      });
      if (!collegeExists)
        return sendValidationError(res, "College does not exist");

      const hashedPassword = await bcrypt.hash(password, 10);

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
          collegeId,
        },
      });

      return sendSuccessResponse(
        res,
        HttpStatus.CREATED,
        "Stationary owner registered successfully",
        newOwner
      );
    } catch (error) {
      return handleAsyncError(res, error, "Error registering stationary owner");
    }
  }
);

export const registerStationary = asyncHandler(async (req: any, res: any) => {
  try {
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

    const stationaryExists = await db.stationary.findFirst({
      where: { email },
    });
    if (stationaryExists)
      return sendValidationError(res, "Stationary already exists");

    const collegeExists = await db.college.findUnique({
      where: { id: collegeId },
    });
    if (!collegeExists)
      return sendValidationError(res, "College does not exist");

    const ownerExists = await db.user.findUnique({ where: { id: ownerId } });
    if (!ownerExists) return sendValidationError(res, "Owner does not exist");

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

    return sendSuccessResponse(
      res,
      HttpStatus.CREATED,
      "Stationary registered successfully",
      newStationary
    );
  } catch (error) {
    return handleAsyncError(res, error, "Error registering stationary");
  }
});
