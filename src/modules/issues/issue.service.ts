import { error } from "node:console";
import type { IIssue, IQuery } from "./issue.interface";
import { pool } from "../../db/db";
import { title } from "node:process";

const postIssueIntoDB = async (payload: IIssue) => {
  const { title, description, type, status, reporter_id } = payload;
  const allowedStatus = ["open", "in_progress", "resolved"];
  const allowedType = ["bug", "feature_request"];
  if (!title || title.length > 150) {
    throw new Error("Title is required and max 150 chars.");
  }
  if (!description || description.length < 20) {
    throw new Error("Description must needed & at least 20 chars.");
  }
  if (!type || (type && !allowedType.includes(type))) {
    throw new Error(
      "Type must needed & type must be 'bug' or 'feature_request'",
    );
  }
  if (status && !allowedStatus.includes(status)) {
    throw new Error(
      "Invalid Status! Status must be 'open' or 'in_progress' or 'resolved'.",
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
  if (issueResult.length === 0) {
    throw new Error("no issues found")
  }
 const reportersId= issueResult.map((issue) => issue.reporter_id);
 const reporters = await pool.query(`SELECT id,name,role FROM users WHERE id=ANY($1)`,[reportersId])
 const reporterResult = reporters.rows
 
 const issues = issueResult.map((issue) => {
   const reporterInfo = reporterResult.find((reporter) => reporter.id === issue.reporter_id)
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
 })
 return issues;
 
};

export const issueService = {
  postIssueIntoDB,
  getAllIssueFromDB,
};
