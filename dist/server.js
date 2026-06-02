
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/db/db.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_String: process.env.CONNECTION_STRING,
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  refresh_Secret: process.env.REFRESH_SECRET
};
var config_default = config;

// src/db/db.ts
var pool = new Pool({
  connectionString: config_default.connection_String
});
var initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(200) NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
      type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
      status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
      reporter_id INT NOT NULL,

      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
      )
      `);
    console.log("database connected successfully");
  } catch (error2) {
    console.log(error2);
  }
};

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
var createUserInDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const allowedRoles = ["contributor", "maintainer"];
  if (role && !allowedRoles.includes(role)) {
    throw new Error("Invalid role! Role must be either 'contributor' or 'maintainer'.");
  }
  const result = await pool.query(
    `
    INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *
    `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userInfo = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email
  ]);
  if (userInfo.rows.length === 0) {
    throw new Error("invalid credential");
  }
  const user = userInfo.rows[0];
  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) {
    throw new Error("invalid credential");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
  const token = jwt.sign(jwtPayload, config_default.jwtSecret, { expiresIn: "1d" });
  return { token, user: jwtPayload };
};
var authService = {
  createUserInDB,
  loginUserIntoDB
};

// src/modules/auth/auth.controller.ts
var singUpUser = async (req, res) => {
  try {
    const result = await authService.createUserInDB(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error2) {
    res.status(500).json({
      success: false,
      message: error2.message,
      error: error2
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error2) {
    res.status(500).json({
      success: false,
      message: error2.message,
      error: error2
    });
  }
};
var authController = {
  singUpUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/singup", authController.singUpUser);
router.post("/login", authController.loginUser);
var authRouter = router;

// src/modules/issues/issue.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issue.service.ts
import "console";
import "process";

// src/utility/index.ts
var userRole = {
  contributor: "contributor",
  maintainer: "maintainer"
};
var issueStatus = {
  open: "open",
  progress: "in_progress",
  resolved: "resolved"
};
var issueType = {
  bug: "bug",
  feature_request: "feature_request"
};

// src/modules/issues/issue.service.ts
var postIssueIntoDB = async (payload) => {
  const { title: title2, description, type, status, reporter_id } = payload;
  const allowedStatus = [
    issueStatus.open,
    issueStatus.progress,
    issueStatus.resolved
  ];
  const allowedType = [issueType.bug, issueType.feature_request];
  if (!title2 || title2.length > 150) {
    throw new Error("Title is required and cannot exceed 150 characters.");
  }
  if (!description || description.length < 20) {
    throw new Error(
      "Description is required and must be at least 20 characters long."
    );
  }
  if (!type || !allowedType.includes(type)) {
    throw new Error(
      "Invalid type. Please specify type as either 'bug' or 'feature_request'."
    );
  }
  if (status && !allowedStatus.includes(status)) {
    throw new Error(
      "Invalid status. Allowed values are 'open', 'in_progress', or 'resolved'."
    );
  }
  const result = await pool.query(
    `
    INSERT INTO issues (title, description, type, status, reporter_id) 
    VALUES ($1, $2, $3,COALESCE($4,'open'), $5) 
    RETURNING *
        `,
    [title2, description, type, status, reporter_id]
  );
  return result;
};
var getAllIssueFromDB = async (payload) => {
  const { sort, type, status } = payload;
  const orderStyle = sort === "oldest" ? "ASC" : "DESC";
  const result = await pool.query(
    `SELECT * FROM issues 
     WHERE ($1::text IS NULL OR type=$1) 
       AND ($2::text IS NULL OR status=$2)
     ORDER BY created_at ${orderStyle}`,
    [type || null, status || null]
  );
  const issueResult = result.rows;
  const reportersId = issueResult.map((issue) => issue.reporter_id);
  const reporters = await pool.query(
    `SELECT id,name,role FROM users WHERE id=ANY($1)`,
    [reportersId]
  );
  const reporterResult = reporters.rows;
  const issues = issueResult.map((issue) => {
    const reporterInfo = reporterResult.find(
      (reporter) => reporter.id === issue.reporter_id
    );
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterInfo,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });
  return issues;
};
var getSingleIssueFromDB = async (id) => {
  const result = await pool.query(
    `SELECT * FROM issues 
     WHERE id=$1`,
    [id]
  );
  const issueResult = result.rows;
  const reportersId = issueResult.map((issue) => issue.reporter_id);
  const reporters = await pool.query(
    `SELECT id,name,role FROM users WHERE id=ANY($1)`,
    [reportersId]
  );
  const reporterResult = reporters.rows;
  const issues = issueResult.map((issue) => {
    const reporterInfo = reporterResult.find(
      (reporter) => reporter.id === issue.reporter_id
    );
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterInfo,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });
  return issues;
};
var updateIssueIntoDB = async (payload, id) => {
  const { title: title2, description, type, status, reporter_id, role } = payload;
  const checkIssueStatus = await pool.query(
    `SELECT reporter_id, status FROM issues WHERE id = $1`,
    [id]
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
    [title2, description, type, status, id]
  );
  return result;
};
var deleteIssueFromDB = async (role, id) => {
  if (role !== userRole.maintainer) {
    throw new Error("You do not have permission to delete this issue.");
  }
  const result = await pool.query(
    `DELETE FROM issues WHERE id=$1 RETURNING *`,
    [id]
  );
  return result;
};
var issueService = {
  postIssueIntoDB,
  getAllIssueFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/utility/sendRespones.ts
var sendResponse = (res, data) => {
  return res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendRespones_default = sendResponse;

// src/modules/issues/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const reporterId = req.user?.id;
    const newData = { ...req.body, reporter_id: reporterId };
    const result = await issueService.postIssueIntoDB(newData);
    sendRespones_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (error2) {
    sendRespones_default(res, {
      statusCode: 500,
      success: false,
      message: error2.message,
      error: error2
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await issueService.getAllIssueFromDB(req.query);
    if (result.length === 0) {
      sendRespones_default(res, {
        statusCode: 404,
        success: false,
        message: "Issues Not Found"
      });
    }
    sendRespones_default(res, {
      statusCode: 200,
      success: true,
      message: "All issues retrieved successfully",
      data: result
    });
  } catch (error2) {
    sendRespones_default(res, {
      statusCode: 500,
      success: false,
      message: error2.message,
      error: error2
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issueService.getSingleIssueFromDB(id);
    if (result.length === 0) {
      sendRespones_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue Not Found"
      });
    }
    sendRespones_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error2) {
    sendRespones_default(res, {
      statusCode: 500,
      success: false,
      message: error2.message,
      error: error2
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const reporterId = req.user?.id;
    const role = req.user?.role;
    const newData = { ...req.body, reporter_id: reporterId, role };
    const result = await issueService.updateIssueIntoDB(newData, id);
    if (result.rows.length === 0) {
      sendRespones_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue Not Found"
      });
    }
    sendRespones_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue Updated successfully",
      data: result.rows[0]
    });
  } catch (error2) {
    sendRespones_default(res, {
      statusCode: 500,
      success: false,
      message: error2.message,
      error: error2
    });
  }
};
var deleteIssue = async (req, res) => {
  const { id } = req.params;
  const role = req.user?.role;
  try {
    const result = await issueService.deleteIssueFromDB(role, id);
    sendRespones_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue Deleted successfully"
    });
  } catch (error2) {
    sendRespones_default(res, {
      statusCode: 500,
      success: false,
      message: error2.message,
      error: error2
    });
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "unauthorize access"
        });
      }
      const decode = jwt2.verify(
        token,
        config_default.jwtSecret
      );
      const userData = await pool.query(
        "SELECT id, name, email, role FROM users WHERE email=$1",
        [decode.email]
      );
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "user not found"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "forbidden access"
        });
      }
      req.user = decode;
      next();
    } catch (error2) {
      return res.status(401).json({
        success: false,
        message: "unauthorized access - invalid token"
      });
    }
  };
};
var auth_default = auth;

// src/modules/issues/issue.route.ts
var router2 = Router2();
router2.post("/", auth_default(userRole.contributor, userRole.maintainer), issueController.createIssue);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth_default(userRole.contributor, userRole.maintainer), issueController.updateIssue);
router2.delete("/:id", auth_default(userRole.contributor, userRole.maintainer), issueController.deleteIssue);
var issueRouter = router2;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter);
app.get("/", (req, res) => {
  res.send("Hello Developers!");
});
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map