import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../schema/userSchema";


interface JwtPayload {
  id: string;
  iat:number;
  exp:number
}

export const protect = async(req: any, res: any, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token) {
    try {
      const decodedJwt = jwt.verify(token!, process.env.JWT_SECRET!) as JwtPayload;
     
      const user = await  User.findById(decodedJwt.id).select("-password");
      
      req.user = user;

      next();
    } catch (error) {
      // console.log(error)
      return res.status(401).json({ message: "TOKEN EXPIRED" });
    }
  } else {
    return res.status(401).json({ message: "NOT AUTHORIZED, NO TOKEN FOUND" });
  }
};
