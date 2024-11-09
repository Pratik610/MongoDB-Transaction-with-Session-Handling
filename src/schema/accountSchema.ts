import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    balance: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    accountType: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Account = mongoose.model("Account", accountSchema);

export default Account;
