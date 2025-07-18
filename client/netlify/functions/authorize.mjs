const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return { statusCode: 500, body: "Server configuration error" };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { statusCode: 401, body: "Authorization token required" };
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.role !== "admin") {
      return { statusCode: 403, body: "Forbidden: Insufficient permissions" };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "valid" }),
    };
  } catch (error) {
    console.error("JWT verification error:", error);
    return {
      statusCode: 401,
      body: "Unauthorized: Invalid or expired token",
    };
  }
};
