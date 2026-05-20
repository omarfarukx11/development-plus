import type { Request, Response } from "express";
import { authService } from "./auth.service";


const singUpUser = async (req : Request , res : Response) => {
  try {
    const result = await authService.createUserInDB(req.body) 
    res.status(201).json({
      success: true,
      message: "user created successfully",
      data: result.rows[0],
    });
  } catch (error : any) {
    res.status(500).json({
      success : false,
      message: error.message,
      error: error,
    });
  }
}

export const authController = {
    singUpUser,
}