import express, { type Application, type Request, type Response } from "express"
import { authRouter } from "./modules/auth/auth.route";

const app: Application = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use("/", authRouter)



app.get('/', (req : Request, res : Response) => {res.send('Hello Developers!')})
export default app;