import { NotificationTypeEnumType } from "../enums/notification";
import { SocketEventEnum } from "../enums/socket";
import NotificationModel from "../models/Notification";
import { emitToUser } from "../config/socket-config";
import { NotFoundException } from "../utils/appError";

export const createNotificationService = async (notification: {
  userId: string;
  type: NotificationTypeEnumType;
  message: string;
  workspaceId: string;
  actorId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
}) => {
  // Nobody needs a notification about their own action.
  if (
    notification.actorId &&
    String(notification.actorId) === String(notification.userId)
  ) {
    return null;
  }

  try {
    const created = await NotificationModel.create({
      user: notification.userId,
      type: notification.type,
      message: notification.message,
      workspace: notification.workspaceId,
      actor: notification.actorId || null,
      project: notification.projectId || null,
      task: notification.taskId || null,
    });

    emitToUser(notification.userId, SocketEventEnum.NOTIFICATION_NEW, {
      notificationId: String(created._id),
    });
    return created;
  } catch (error) {
    console.error("Failed to create notification", error);
    return null;
  }
};

export const getNotificationsService = async (
  userId: string,
  pageSize: number
) => {
  const [notifications, unreadCount] = await Promise.all([
    NotificationModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .populate("actor", "_id name profilePicture")
      .populate("task", "_id title taskCode")
      .populate("project", "_id name emoji"),
    NotificationModel.countDocuments({ user: userId, read: false }),
  ]);

  return { notifications, unreadCount };
};

export const markNotificationReadService = async (
  userId: string,
  notificationId: string
) => {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new NotFoundException("Notification not found.");
  }

  return { notification };
};

export const markAllNotificationsReadService = async (userId: string) => {
  await NotificationModel.updateMany(
    { user: userId, read: false },
    { read: true }
  );
};
