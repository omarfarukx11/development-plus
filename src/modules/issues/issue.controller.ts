import type { Request, Response } from "express";
import { issueService } from "./issue.service";

const createIssue = async (req: Request, res: Response) => {
  try {
    const reporterId = req.user?.id;
    const newData = { ...req.body, reporter_id: reporterId };
    const result = await issueService.postIssueIntoDB(newData);
    return res.status(201).json({
      success: true,
      message: "Issues created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await issueService.getAllIssueFromDB(req.query);
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issues Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Fetch all issue successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getSingleUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await issueService.getSingleIssueFromDB(id as string);
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Fetch issue successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reporterId = req.user?.id;
    const role = req.user?.role;
    const newData = { ...req.body, reporter_id : reporterId , role : role };
    const result = await issueService.updateIssueIntoDB(newData, id as string);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Fetch issue successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const deleteIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  const role = req.user?.role;
  try {
     const result = await issueService.deleteIssueFromDB(role, id as string);
     res.status(200).json({
      success: true,
      message: "Issue Deleted successfully",
    });
  } catch (error : any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
}

export const issueController = {
  createIssue,
  getAllUsers,
  getSingleUsers,
  updateIssue,
  deleteIssue
};
