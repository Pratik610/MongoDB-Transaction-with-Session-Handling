import jwt from "jsonwebtoken";

// generate token when login
const generateToken = (id: string) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });
};

export { generateToken };
