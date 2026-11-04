import express, { Request, Response } from "express";
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
import authRoutes from "./routes/authRoute";
import userRoutes from "./routes/userRoute";
import isAuthenticated from "./middlewares/isAuthenticated";
import workspaceRoutes from "./routes/workspaceRoute";
import memberRoutes from "./routes/memberRoute";
import projectRoutes from "./routes/projectRoute";
import taskRoutes from "./routes/taskRoute";
import commentRoutes from "./routes/commentRoute";
import labelRoutes from "./routes/labelRoute";
import activityRoutes from "./routes/activityRoute";
import notificationRoutes from "./routes/notificationRoute";
import { createServer } from "http";
import { initSocket } from "./config/socket-config";
import { startReminderScheduler } from "./services/reminderService";

const app = express();
const httpServer = createServer(app);

const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(
  cors({
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
  name: "session",
  keys: [config.SESSION_SECRET],
  maxAge: 24 * 60 * 60 * 1000,
  secure: config.NODE_ENV === "production",
  httpOnly: true,
  sameSite: "lax",
});
app.use(sessionMiddleware);

// Live updates share the same login session as the REST API.
initSocket(httpServer, sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
      message: "FlowSpace API is running.",
    });
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);
app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoutes);
app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoutes);
app.use(`${BASE_PATH}/project`, isAuthenticated, projectRoutes);
app.use(`${BASE_PATH}/task`, isAuthenticated, taskRoutes);
app.use(`${BASE_PATH}/comment`, isAuthenticated, commentRoutes);
app.use(`${BASE_PATH}/label`, isAuthenticated, labelRoutes);
app.use(`${BASE_PATH}/activity`, isAuthenticated, activityRoutes);
app.use(`${BASE_PATH}/notification`, isAuthenticated, notificationRoutes);

app.use(errorHandler);

httpServer.listen(config.PORT, async () => {
  console.log(`Server is running on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();
  startReminderScheduler();
});
