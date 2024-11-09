import { Router } from "express";
import {createAccount,sendMoney} from '../controllers/accountControllers'

import { protect } from "../middleware/auth";

export const accountRouter = Router();


accountRouter.post('/create',protect ,createAccount)
accountRouter.post('/transfer',protect ,sendMoney)



