import { error } from "node:console";
import type { IIssue, IIssueTwo, IQuery } from "./issue.interface";
import { pool } from "../../db/db";
import { title } from "node:process";
import { issueStatus, issueType, userRole } from "../../utility";

const postIssueIntoDB = async (payload: IIssue) => {
  const { title, description, type, status, reporter_id } = payload;
  const allowedStatus = [
    issueStatus.open,
    issueStatus.progress,
    issueStatus.resolved,
  ];
  const allowedType = [issueType.bug, issueType.feature_request];
  if (!title || title.length > 150) {
    throw new Error("Title is required and cannot exceed 150 characters.");
  }

  if (!description || description.length < 20) {
    throw new Error(
      "Description is required and must be at least 20 characters long.",
    );
  }

  if (!type || !allowedType.includes(type)) {
    throw new Error(
      "Invalid type. Please specify type as either 'bug' or 'feature_request'.",
    );
  }

  if (status && !allowedStatus.includes(status)) {
    throw new Error(
      "Invalid status. Allowed values are 'open', 'in_progress', or 'resolved'.",
    );
  }
  const result = await pool.query(
    `
    INSERT INTO issues (title, description, type, status, reporter_id) 
    VALUES ($1, $2, $3,COALESCE($4,'open'), $5) 
    RETURNING *
        `,
    [title, description, type, status, reporter_id],
  );
  return result;
};

const getAllIssueFromDB = async (payload: IQuery) => {
  const { sort, type, status } = payload;
  const orderStyle = sort === "oldest" ? "ASC" : "DESC";
  const result = await pool.query(
    `SELECT * FROM issues 
     WHERE ($1::text IS NULL OR type=$1) 
       AND ($2::text IS NULL OR status=$2)
     ORDER BY created_at ${orderStyle}`,
    [type || null, status || null],
  );
  const issueResult = result.rows;
  const reportersId = issueResult.map((issue) => issue.reporter_id);
  const reporters = await pool.query(
    `SELECT id,name,role FROM users WHERE id=ANY($1)`,
    [reportersId],
  );
  const reporterResult = reporters.rows;

  const issues = issueResult.map((issue) => {
    const reporterInfo = reporterResult.find(
      (reporter) => reporter.id === issue.reporter_id,
    );
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterInfo,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    };
  });
  return issues;
};

const getSingleIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `SELECT * FROM issues 
     WHERE id=$1`,
    [id],
  );
  const issueResult = result.rows;
  const reportersId = issueResult.map((issue) => issue.reporter_id);
  const reporters = await pool.query(
    `SELECT id,name,role FROM users WHERE id=ANY($1)`,
    [reportersId],
  );
  const reporterResult = reporters.rows;

  const issues = issueResult.map((issue) => {
    const reporterInfo = reporterResult.find(
      (reporter) => reporter.id === issue.reporter_id,
    );
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterInfo,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    };
  });
  return issues;
};

const updateIssueIntoDB = async (payload: IIssueTwo, id: string) => {
  const { title, description, type, status, reporter_id, role } = payload;

  const checkIssueStatus = await pool.query(
    `SELECT reporter_id, status FROM issues WHERE id = $1`,
    [id],
  );

  if (checkIssueStatus.rows.length === 0) {
    throw new Error("Not found");
  }
  const issue = checkIssueStatus.rows[0];

  if (role === userRole.contributor) {
    if (issue.reporter_id !== reporter_id) {
      throw new Error("Access denied You can only manage your own issues.");
    }
    if (issue.status !== issueStatus.open) {
      throw new Error("you can only update your open type issues");
    }
  }
  const result = await pool.query(
    `
    UPDATE issues SET 
    title=COALESCE($1, title),
    description=COALESCE($2, description),
    type=COALESCE($3, type),
    status=COALESCE($4, status),
    updated_at=NOW()
    WHERE id=$5 
    RETURNING *
    `,
    [title, description, type, status, id],
  );
  return result;
};

const deleteIssueFromDB = async (role: string, id: string) => {
  if (role !== userRole.maintainer) {
    throw new Error("You do not have permission to delete this issue.");
  }
  const result = await pool.query(
    `DELETE FROM issues WHERE id=$1 RETURNING *`,
    [id],
  );
  return result;
};

export const issueService = {
  postIssueIntoDB,
  getAllIssueFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB,
};
