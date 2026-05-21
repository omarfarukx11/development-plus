import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router()

router.post("/api/auth/singup" , authController.singUpUser)
router.post("/api/auth/login" , authController.loginUser)

export const authRouter = router;