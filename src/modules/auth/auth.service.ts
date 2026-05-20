import bcrypt from "bcryptjs";
import { pool } from "../../db/db";
import type { ISingUp } from "./auth.interface";

const createUserInDB = async (payload: ISingUp) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
    INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'user')) RETURNING *
    `,
    [name, email, hashPassword, role],
  );
  delete result.rows[0].password;
  return result;
};

export const authService = {
  createUserInDB,
};
