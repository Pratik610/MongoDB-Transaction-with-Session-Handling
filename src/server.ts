import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import { userRouter } from "./routes/userRoutes";
import { accountRouter } from "./routes/accountRoutes";
import { notFound, errorHandler } from "./middleware/errorMiddleware";
import { rateLimit } from "express-rate-limit";

dotenv.config();
const app = express();
connectDB();

app.use(express.json());

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 1 minutes
  limit: 300, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  message: "Server Rate Limit Reacher, Retry after 5 mins",
});

app.use(limiter);

app.use("/api/v1/user", userRouter);
app.use("/api/v1/account", accountRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(process.env.PORT, () =>
  console.log(`Server Running on PORT: ${process.env.PORT}`)
);
