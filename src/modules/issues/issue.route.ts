import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/auth";
import { userRole } from "../../types";



const router = Router()
router.post("/" , auth("contributor", "maintainer"), issueController.createIssue)
router.get("/" , issueController.getAllUsers) 
router.get("/:id" , issueController.getSingleUsers) 
router.patch("/:id" ,auth("maintainer", "contributor"), issueController.updateIssue) 
router.delete("/:id",auth(userRole.contributor , userRole.maintainer), issueController.deleteIssue) 
export const issueRouter = router;