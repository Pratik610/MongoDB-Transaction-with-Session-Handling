import { Router } from "express";
import { signup,login } from "../controllers/userControllers";


export const userRouter = Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);


