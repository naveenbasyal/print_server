import jwt from "jsonwebtoken";
import "dotenv/config";

export const generateToken = (id: string, email: string, role: string) => {
  return jwt.sign(
    {
      id,
      email,
      role,
    },
    process.env.JWT_SECRET_KEY as string,
    {
      expiresIn: "30d",
    }
  );
};
