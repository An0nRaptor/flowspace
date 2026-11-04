import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import {
  commentIdSchema,
  createCommentSchema,
} from "../validation/commentValidation";
import { taskIdSchema } from "../validation/taskValidation";
import { workspaceIdSchema } from "../validation/workspaceValidation";
import { getMemberRoleInWorkspace } from "../services/memberService";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role";
import {
  createCommentService,
  deleteCommentService,
  getCommentsByTaskService,
} from "../services/commentService";
import { logActivityService } from "../services/activityService";
import { createNotificationService } from "../services/notificationService";
import { emitToWorkspace } from "../config/socket-config";
import { HTTPSTATUS } from "../config/http-config";
import { ActivityActionEnum } from "../enums/activity";
import { NotificationTypeEnum } from "../enums/notification";
import { SocketEventEnum } from "../enums/socket";
import { RolePermissions } from "../utils/rolePermission";

export const getCommentsByTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const taskId = taskIdSchema.parse(req.params.taskId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { comments } = await getCommentsByTaskService(workspaceId, taskId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Comments fetched successfully.",
      comments,
    });
  }
);

export const createCommentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = createCommentSchema.parse(req.body);
    const taskId = taskIdSchema.parse(req.params.taskId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { comment, task, mentions } = await createCommentService(
      workspaceId,
      taskId,
      userId,
      body
    );

    await logActivityService({
      workspaceId,
      userId,
      action: ActivityActionEnum.COMMENT_ADDED,
      message: `commented on "${task.title}"`,
      projectId: String(task.project),
      taskId,
    });

    await Promise.all(
      mentions.map((mentionedUserId) =>
        createNotificationService({
          userId: String(mentionedUserId),
          actorId: userId,
          type: NotificationTypeEnum.MENTION,
          message: `mentioned you in "${task.title}"`,
          workspaceId,
          projectId: String(task.project),
          taskId,
        })
      )
    );

    emitToWorkspace(workspaceId, SocketEventEnum.COMMENT_CHANGED, {
      taskId,
      actorId: String(userId),
    });

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Comment added successfully.",
      comment,
    });
  }
);

export const deleteCommentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const commentId = commentIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    // Authors delete their own comments; admins and owners can delete any.
    const canDeleteAny = RolePermissions[role].includes(
      Permissions.DELETE_TASK
    );

    const { comment } = await deleteCommentService(
      workspaceId,
      commentId,
      userId,
      canDeleteAny
    );

    emitToWorkspace(workspaceId, SocketEventEnum.COMMENT_CHANGED, {
      taskId: String(comment.task),
      actorId: String(userId),
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Comment deleted successfully.",
    });
  }
);
