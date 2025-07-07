import jwt from "jsonwebtoken";

export const requireUser = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
      id: string;
      email: string;
      role: string;
    };

    if (decoded.role !== "CUSTOMER") {
      return res.status(403).json({ message: "Access denied", success: false });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token", success: false });
  }
};

export const requireStationaryOwner = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "No token provided", success: false });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
      id: string;
      email: string;
      role: string;
    };

    if (decoded.role !== "STATIONARY_OWNER") {
      return res.status(403).json({ message: "Access denied", success: false });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token", success: false });
  }
};

export const requireAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
      id: string;
      email: string;
      role: string;
    };
    console.log("decoded", decoded);

    const allowedRoles = ["ADMIN", "STAFF"];
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied", success: false });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token", success: false });
  }
};
