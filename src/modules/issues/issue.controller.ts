import type { Request, Response } from "express";
import { issueService } from "./issue.service";
import sendResponse from "../../utility/sendRespones";

const createIssue = async (req: Request, res: Response) => {
  try {
    const reporterId = req.user?.id;
    const newData = { ...req.body, reporter_id: reporterId };
    const result = await issueService.postIssueIntoDB(newData);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const result = await issueService.getAllIssueFromDB(req.query);
    if (result.length === 0) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issues Not Found",
      });
    }
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All issues retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await issueService.getSingleIssueFromDB(id as string);
    if (result.length === 0) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue Not Found",
      });
    }
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
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
    const newData = { ...req.body, reporter_id: reporterId, role: role };
    const result = await issueService.updateIssueIntoDB(newData, id as string);
    if (result.rows.length === 0) {
      sendResponse( res ,{
      statusCode: 404,
        success: false,
        message: "Issue Not Found",
      });
    }
    sendResponse( res ,{
      statusCode: 200,
      success: true,
      message: "Issue Updated successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    sendResponse( res ,{
      statusCode: 500,
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
    sendResponse( res ,{
      statusCode: 200,
      success: true,
      message: "Issue Deleted successfully",
    });
  } catch (error: any) {
    sendResponse( res ,{
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
