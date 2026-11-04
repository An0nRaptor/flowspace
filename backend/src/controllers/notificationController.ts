import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middlewares/asyncHandler";
import {
  getNotificationsService,
  markAllNotificationsReadService,
  markNotificationReadService,
} from "../services/notificationService";
import { HTTPSTATUS } from "../config/http-config";

const notificationIdSchema = z.string().trim().min(1);

export const getNotificationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

    const { notifications, unreadCount } = await getNotificationsService(
      userId,
      pageSize
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Notifications fetched successfully.",
      notifications,
      unreadCount,
    });
  }
);

export const markNotificationReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const notificationId = notificationIdSchema.parse(req.params.id);

    await markNotificationReadService(userId, notificationId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Notification marked as read.",
    });
  }
);

export const markAllNotificationsReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    await markAllNotificationsReadService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "All notifications marked as read.",
    });
  }
);
