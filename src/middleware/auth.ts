import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { pool } from "../db/db";
import config from "../config";



const auth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
   try {
     const token = req.headers.authorization;
    if (!token) {
     return res.status(401).json({
        success: false,
        message: "unauthorize access",
      });
    }
    const decode = jwt.verify(
      token as string,
      config.jwtSecret as string,
    ) as JwtPayload;

    const userData = await pool.query(
        'SELECT id, name, email, role FROM users WHERE email=$1',
        [decode.email]
      );
    const user = userData.rows[0]
    if(userData.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }
     if(roles.length && !roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: "forbidden access",
      });
    }
    req.user = decode
    next();
   } catch (error) {
      return res.status(401).json({
        success: false,
        message: "unauthorized access - invalid token",
      });
   }
  };
};

export default auth;
