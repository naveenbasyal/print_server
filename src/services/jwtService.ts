import jwt from "jsonwebtoken";

const generateToken = (id, email) => {
  return jwt.sign(
    {
      id,
      email,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "30d",
    }
  );
};
