import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router()

router.post("/api/auth/singup" , authController.singUpUser)

export const authRouter = router;