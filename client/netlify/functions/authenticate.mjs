const jwt = require("jsonwebtoken");

const ADMIN_VAR_NAME = "NETLIFY_ADMIN_PASSWORD";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const { password } = JSON.parse(event.body);
  const adminPassword = process.env[ADMIN_VAR_NAME];
  const jwtSecret = process.env.JWT_SECRET;

  console.log(adminPassword, jwtSecret);

  if (!adminPassword || !jwtSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server configuration error" }),
    };
  }

  if (password !== adminPassword) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Invalid credentials" }),
    };
  }

  // Access granted
  const token = jwt.sign({ role: "admin", userId: "backdoor" }, jwtSecret, {
    expiresIn: "1d",
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ token }),
  };
};
