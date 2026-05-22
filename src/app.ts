import express, { type Application, type Request, type Response } from "express"
import { authRouter } from "./modules/auth/auth.route";
import { issueRouter } from "./modules/issues/issue.route";
import globalErrorHandler from "./middleware/globalErrorHandler";

const app: Application = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRouter)
app.use("/api/issues", issueRouter)
app.get('/', (req : Request, res : Response) => {res.send('Hello Developers!')})
app.use(globalErrorHandler)
export default app;