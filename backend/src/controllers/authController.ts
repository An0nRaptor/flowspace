import passport from "passport";
import { config } from "../config/app-config";
import { HTTPSTATUS } from "../config/http-config";
import { asyncHandler } from "../middlewares/asyncHandler";
import { registerUserService } from "../services/authService";
import { createDemoAccountService } from "../services/demoService";
import { registerSchema } from "../validation/authValidation";
import { Express, NextFunction, Request, Response } from "express";

export const googleLoginCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const currentWorkspace = req.user?.currentWorkspace;

    if (!currentWorkspace) {
      return res.redirect(
        `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`
      );
    }

    return res.redirect(
      `${config.FRONTEND_ORIGIN}/workspace/${currentWorkspace}`
    );
  }
);

export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = registerSchema.parse({
      ...req.body,
    });
    await registerUserService(body);

    res.status(HTTPSTATUS.CREATED).json({
      message: "User created successfully.",
    });
  }
);

export const loginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      (
        err: Error | null,
        user: Express.User | false,
        info: { message: string } | undefined
      ) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(HTTPSTATUS.UNAUTHORIZED).json({
            message: info?.message || "Invalid email or password.",
          });
        }

        req.login(user, (err) => {
          if (err) {
            return next(err);
          }

          return res.status(HTTPSTATUS.OK).json({
            message: "Logged in successfully.",
            user,
          });
        });
      }
    )(req, res, next);
  }
);

// A few demo workspaces per visitor per hour is plenty.
const DEMO_LIMIT_PER_HOUR = 5;
const demoRequests = new Map<string, number[]>();

export const demoLoginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || "unknown";
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const recent = (demoRequests.get(ip) || []).filter((t) => t > hourAgo);

    if (recent.length >= DEMO_LIMIT_PER_HOUR) {
      return res.status(HTTPSTATUS.TOO_MANY_REQUESTS).json({
        message: "Too many demo accounts from this network. Try again later.",
      });
    }
    demoRequests.set(ip, [...recent, Date.now()]);

    const { user } = await createDemoAccountService();

    req.login(user as Express.User, (err) => {
      if (err) {
        return next(err);
      }

      return res.status(HTTPSTATUS.OK).json({
        message: "Logged in to the demo workspace.",
        user,
      });
    });
  }
);

export const logOutContoller = asyncHandler(
  async (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error.", err);
        return res
          .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
          .json({ error: "Falied to logout." });
      }
    });

    req.session = null;
    return res
      .status(HTTPSTATUS.OK)
      .json({ message: "Logged out successfully." });
  }
);
