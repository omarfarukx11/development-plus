import { error } from "node:console";
import type { IIssue } from "./issue.interface";
import { pool } from "../../db/db";

const postIssueIntoDB = async (payload: IIssue) => {
  const { title, description, type,status, reporter_id } = payload;
  if (!title || title.length > 150) {
    throw new Error("Title is required and max 150 chars.");
  }
  if (!description || description.length < 20) {
    throw new Error("Description must be at least 20 chars.");
  }
  if (type !== "bug" && type !== "feature_request") {
    throw new Error("Type must be bug or feature_request");
  }
  const result = await pool.query(`
    INSERT INTO issues (title, description, type, status, reporter_id) 
    VALUES ($1, $2, $3,COALESCE($4,'open'), $5) 
    RETURNING *
        `,[title,description,type,status,reporter_id]);
    return result
};

export const issueService = {
  postIssueIntoDB,
};
