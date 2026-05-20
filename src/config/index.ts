import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const config = {
  connection_String: process.env.CONNECTION_STRING as string,
  port : process.env.PORT,
  jwtSecret : process.env.JWT_SECRET,
  refresh_Secret : process.env.REFRESH_SECRET
};

export default config;