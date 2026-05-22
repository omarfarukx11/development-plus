import type { Request, Response } from "express";
import { issueService } from "./issue.service";


const createIssue = async (req: Request, res: Response) => {
   try {
    const reporterId = req.user?.id
    const newData = { ...req.body, reporter_id : reporterId};
    const result = await issueService.postIssueIntoDB(newData)
    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success : false,
      message: error.message,
      error: error,
    });
  }
}

export const issueController = {
    createIssue,
}