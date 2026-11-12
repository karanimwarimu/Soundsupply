import { Router, type IRouter } from "express";
import { createCheckoutSession } from "../lib/checkout";

const router: IRouter = Router();

router.post("/checkout/session", async (req, res) => {
  const result = await createCheckoutSession(req.body, process.env);
  res.status(result.status).json(result.body);
});

export default router;
