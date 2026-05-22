import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router()

router.post("/singup" , authController.singUpUser)
router.post("/login" , authController.loginUser)

export const authRouter = router;