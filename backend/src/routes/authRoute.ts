import { Router } from "express";
import passport from "passport";
import { config } from "../config/app-config";
import {
  googleLoginCallback,
  loginController,
  logOutContoller,
  registerUserController,
} from "../controllers/authController";

const failedUrl = `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;

const authRoutes = Router();

authRoutes.post("/register", registerUserController);
authRoutes.post("/login",loginController);
authRoutes.post("/logout", logOutContoller);

authRoutes.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

authRoutes.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: failedUrl }),
  googleLoginCallback
);

export default authRoutes;
