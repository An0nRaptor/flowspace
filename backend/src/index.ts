import express, { NextFunction, Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import passport from "passport";
import "./config/passport-config";
import session from "cookie-session";
import { config } from "./config/app-config";
import connectDatabase from "./config/database-config";
import { errorHandler } from "./middlewares/errorHandler";
import { HTTPSTATUS } from "./config/http-config";
import { asyncHandler } from "./middlewares/asyncHandler";
import { BadRequestException } from "./utils/appError";
import authRoutes from "./routes/authRoute";
import userRoutes from "./routes/userRoute";
import isAuthenticated from "./middlewares/isAuthenticated";
import workspaceRoutes from "./routes/workspaceRoute";
import memberRoutes from "./routes/memberRoute";
import projectRoutes from "./routes/projectRoute";
import taskRoutes from "./routes/taskRoute";

const app = express();

const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: "session",
    keys: [config.SESSION_SECRET],
    maxAge: 24 * 60 * 1000,
    secure: config.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new BadRequestException("This is a bad req");

    res.status(HTTPSTATUS.OK).json({
      message: "Hello World",
    });
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);
app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoutes);
app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoutes);
app.use(`${BASE_PATH}/project`, isAuthenticated, projectRoutes);
app.use(`${BASE_PATH}/task`, isAuthenticated, taskRoutes);

app.use(errorHandler);

app.listen(config.PORT, async () => {
  console.log(`Server is running on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();
});
