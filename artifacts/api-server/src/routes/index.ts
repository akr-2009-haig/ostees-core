import { Router, type IRouter } from "express";
import healthRouter from "./health";
import web3Router from "./web3";

const router: IRouter = Router();

router.use(healthRouter);
router.use(web3Router);

export default router;
