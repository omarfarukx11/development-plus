import bcrypt from "bcryptjs";
import { pool } from "../../db/db";
import type { ILogin, ISingUp } from "./auth.interface";
import jwt from "jsonwebtoken"
import config from "../../config";

const createUserInDB = async (payload: ISingUp) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const allowedRoles = ['contributor', 'maintainer'];
  
  if (role && !allowedRoles.includes(role)) {
    throw new Error("Invalid role! Role must be either 'contributor' or 'maintainer'.")
  }
  const result = await pool.query(
    `
    INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *
    `,
    [name, email, hashPassword, role],
  );
  delete result.rows[0].password;
  return result;
};

const loginUserIntoDB = async (payload: ILogin) => {
  const { email, password } = payload;
  const userInfo = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);
  if (userInfo.rows.length === 0) {
    throw new Error("invalid credential");
  }
  const user = userInfo.rows[0];
  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) {
    throw new Error("invalid credential");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role : user.role,
    created_at : user.created_at,
    updated_at : user.updated_at
  };

  const token = jwt.sign(jwtPayload , config.jwtSecret as string , {expiresIn : "1d"})
  return {token , user : jwtPayload}


};

export const authService = {
  createUserInDB,
  loginUserIntoDB,
};
