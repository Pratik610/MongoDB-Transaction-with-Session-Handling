import User from "../schema/userSchema";
import zod from "zod";
import validator from "validator";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateToken } from "../config/token";
import { ResponseCodes } from "../constants";

type userSchema = {
  name?: string;
  email: string;
  phoneNumber?: string;
  password: string;
};

enum ValidationMode {
  ALL = "all",
  AUTH = "auth",
}

const validate = (userData: userSchema, mode: ValidationMode): boolean => {
  const baseSchema = {
    email: zod.string().email(),
    password: zod.string().refine(validator.isStrongPassword, {
      message: "Invalid Password",
    }),
  };

  const extendedSchema = {
    ...baseSchema,
    name: zod.string(),
    phoneNumber: zod.string().refine(validator.isMobilePhone, {
      message: "Invalid phone number",
    }),
  };

  // Determine schema based on mode
  const schema = zod.object(
    mode === ValidationMode.ALL ? extendedSchema : baseSchema
  );

  const response = schema.safeParse(userData);
  if (!response.success) {
    console.error(response.error.errors);
  }
  return response.success;
};

export const signup = async (req: Request, res: Response): Promise<any> => {
  const { name, email, phoneNumber, password } = req.body;

  try {
    if (
      !validate(
        {
          name,
          email,
          phoneNumber,
          password,
        },
        ValidationMode.ALL
      )
    ) {
      return res
        .status(ResponseCodes.BAD_REQUEST)
        .json({ message: "Bad Request" });
    }

    const checkUserExists = await User.findOne({
      email,
    });

    if (checkUserExists) {
      return res
        .status(ResponseCodes.CONFLICT)
        .json({ message: `User with ${email} Already Exists ` });
    }

    const hashPassword = await bcrypt.hash(password, 15);

    const user = new User({
      name,
      email,
      phoneNumber,
      password: hashPassword,
    });

    await user.save();
    return res
      .status(ResponseCodes.SUCCESS)
      .json({ message: "Signup SuccessFull" });
  } catch (error) {
    return res.status(ResponseCodes.BAD_REQUEST).json(error);
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!validate({ email, password }, ValidationMode.AUTH)) {
    return res
      .status(ResponseCodes.BAD_REQUEST)
      .json({ message: "Bad Request" });
  }

  const user = await User.findOne({
    email,
  });

  if (!user) {
    return res
      .status(ResponseCodes.NOT_FOUND)
      .json({ message: `User Does Not Exists ` });
  }

  const checkPassword = await bcrypt.compare(password, user.password);

  if (checkPassword) {
    return res
      .status(ResponseCodes.SUCCESS)
      .json({ token: generateToken(String(user._id)) });
  } else {
    return res
      .status(ResponseCodes.NOT_AUTHORIZED)
      .json({ message: `INVALID PASSWORD` });
  }
};
