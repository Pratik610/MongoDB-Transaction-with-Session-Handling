import Account from "../schema/accountSchema";
import User from "../schema/userSchema";
import zod from "zod";

import { Response } from "express";

import { ResponseCodes } from "../constants";
import mongoose from "mongoose";

type paymentSchema = {
  sender: string;
  senderBank: string;
  receiver: string;
  receiverBank: string;
  amount: number;
};

type accountSchema = {
  userId: string;
  accountType: string;
  balance: number;
};

const verifyAccDetails = (details: accountSchema) => {
  const baseSchema = zod.object({
    userId: zod.string(),
    accountType: zod.string(),
    balance: zod.number().refine((n) => n > 0),
  });
  const response = baseSchema.safeParse(details);

  return response.success;
};

const verifyPaymentDetails = (details: paymentSchema) => {
  const baseSchema = zod.object({
    sender: zod.string(),
    senderBank: zod.string(),
    receiver: zod.string(),
    receiverBank: zod.string(),
    amount: zod.number().refine((n) => n > 0),
  });
  const response = baseSchema.safeParse(details);

  return response.success;
};

export const createAccount = async (req: any, res: Response): Promise<any> => {
  const { accountType, balance } = req.body;

  const user = req.user;

  if (
    !verifyAccDetails({ userId: String(req.user._id), accountType, balance })
  ) {
    return res
      .status(ResponseCodes.BAD_REQUEST)
      .json({ message: "Something went wrong while creating you account" });
  }

  try {
    const account = new Account({
      userId: user._id,
      accountType,
      balance,
    });

    const accountDetails = await account.save();

    return res.status(ResponseCodes.SUCCESS).json(accountDetails);
  } catch (error) {
    return res.status(ResponseCodes.BAD_REQUEST).json(error);
  }
};

export const sendMoney = async (req: any, res: Response): Promise<any> => {
  const session = await mongoose.startSession();

  await session.startTransaction();

  const { senderBank, receiver, receiverBank, amount } = req.body;
  const user = req.user;

  if (
    !verifyPaymentDetails({
      sender: String(req.user._id),
      senderBank,
      receiver,
      receiverBank,
      amount,
    })
  ) {
    await session.abortTransaction();

    return res
      .status(ResponseCodes.BAD_REQUEST)
      .json({ message: "Something went wrong, Please Check you Details" });
  }

  try {
    // get sender Account
    const senderBankDetails = await Account.findOne({
      userId: user._id,
      _id: senderBank,
    }).session(session);

    if (!senderBankDetails) {
      session.abortTransaction();

      return res
        .status(ResponseCodes.NOT_AUTHORIZED)
        .json({ message: "Failed to get Bank Details" });
    }

    if (senderBankDetails.balance < amount) {
      await session.abortTransaction();
      return res
        .status(ResponseCodes.BAD_REQUEST)
        .json({ message: "Insufficient Balance" });
    }

    const receiverDetails = await User.findById(receiver).session(session);

    if (!receiverDetails) {
      await session.abortTransaction();
      return res
        .status(ResponseCodes.NOT_FOUND)
        .json({ message: "User Not found " });
    }

    const receiverBankDetails = await Account.findOne({
      userId: receiverDetails._id,
      _id: receiverBank,
    }).session(session);

    if (!receiverBankDetails) {
      await session.abortTransaction();
      return res
        .status(ResponseCodes.NOT_AUTHORIZED)
        .json({ message: "Failed to get Bank Details" });
    }

    await Account.updateOne(
      {
        _id: senderBankDetails._id,
      },
      {
        $inc: {
          balance: -amount,
        },
      }
    ).session(session);

    await Account.updateOne(
      {
        _id: receiverBankDetails._id,
      },
      {
        $inc: {
          balance: amount,
        },
      }
    ).session(session);

    await session.commitTransaction();

    return res.status(200).json("Transaction Successful");
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(ResponseCodes.BAD_REQUEST)
      .json({ message: "Transfer Failed" });
  } finally {
    session.endSession();
  }
};
