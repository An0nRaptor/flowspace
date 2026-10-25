import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { HTTPSTATUS } from "../config/http-config";
import { getCurrentUserService } from "../services/userService";

export const getCurrentUserController = asyncHandler(
  
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const { user } = await getCurrentUserService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User fetched successfully.",
      user,
    });
  }
);
