import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Missing or invalid authorization header.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: payload.id,
      email: payload.email,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}