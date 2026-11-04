import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import {
  checklistItemIdSchema,
  createChecklistItemSchema,
  createTaskSchema,
  taskIdSchema,
  updateChecklistItemSchema,
  updateTaskSchema,
} from "../validation/taskValidation";
import { projectIdSchema } from "../validation/projectValidation";
import { workspaceIdSchema } from "../validation/workspaceValidation";
import { getMemberRoleInWorkspace } from "../services/memberService";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role";
import {
  addChecklistItemService,
  createTaskService,
  deleteChecklistItemService,
  deleteTaskService,
  getAllTasksService,
  getTaskByIdService,
  updateChecklistItemService,
  updateTaskService,
} from "../services/taskService";
import {
  deleteAttachmentService,
  getAttachmentStreamService,
  uploadAttachmentService,
} from "../services/attachmentService";
import { logActivityService } from "../services/activityService";
import { createNotificationService } from "../services/notificationService";
import { emitToWorkspace } from "../config/socket-config";
import { HTTPSTATUS } from "../config/http-config";
import { ActivityActionEnum } from "../enums/activity";
import { NotificationTypeEnum } from "../enums/notification";
import { SocketEventEnum } from "../enums/socket";
import UserModel from "../models/User";
import { BadRequestException } from "../utils/appError";
import { formatEnumLabel } from "../utils/format";

const emitTaskChanged = (
  workspaceId: string,
  userId: string,
  task: { _id: unknown; project: unknown }
) => {
  emitToWorkspace(workspaceId, SocketEventEnum.TASK_CHANGED, {
    taskId: String(task._id),
    projectId: String(task.project),
    actorId: String(userId),
  });
};

const notifyAssignee = async (
  workspaceId: string,
  userId: string,
  task: { _id: unknown; project: unknown; title: string },
  assigneeId: string
) => {
  const assignee = await UserModel.findById(assigneeId).select("name");

  await logActivityService({
    workspaceId,
    userId,
    action: ActivityActionEnum.TASK_ASSIGNED,
    message: `assigned "${task.title}" to ${assignee?.name || "a member"}`,
    projectId: String(task.project),
    taskId: String(task._id),
  });

  await createNotificationService({
    userId: assigneeId,
    actorId: userId,
    type: NotificationTypeEnum.ASSIGNED,
    message: `assigned you to "${task.title}"`,
    workspaceId,
    projectId: String(task.project),
    taskId: String(task._id),
  });
};

export const createTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = createTaskSchema.parse(req.body);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);

    roleGuard(role, [Permissions.CREATE_TASK]);

    const { task } = await createTaskService(
      workspaceId,
      projectId,
      userId,
      body
    );

    await logActivityService({
      workspaceId,
      userId,
      action: ActivityActionEnum.TASK_CREATED,
      message: `created "${task.title}"`,
      projectId,
      taskId: String(task._id),
    });

    if (task.assignedTo) {
      await notifyAssignee(workspaceId, userId, task, String(task.assignedTo));
    }

    emitTaskChanged(workspaceId, userId, task);

    return res.status(HTTPSTATUS.OK).json({
      message: "Task created successfully.",
      task,
    });
  }
);

export const updateTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const body = updateTaskSchema.parse(req.body);
    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { updatedTask, previousTask } = await updateTaskService(
      workspaceId,
      projectId,
      taskId,
      body
    );

    const statusChanged = previousTask.status !== updatedTask.status;
    const newAssigneeId = updatedTask.assignedTo
      ? String(updatedTask.assignedTo)
      : null;
    const assigneeChanged =
      String(previousTask.assignedTo || "") !== String(newAssigneeId || "");

    if (statusChanged) {
      await logActivityService({
        workspaceId,
        userId,
        action: ActivityActionEnum.TASK_MOVED,
        message: `moved "${updatedTask.title}" from ${formatEnumLabel(
          previousTask.status
        )} to ${formatEnumLabel(updatedTask.status)}`,
        projectId,
        taskId,
      });
    }

    if (assigneeChanged && newAssigneeId) {
      await notifyAssignee(workspaceId, userId, updatedTask, newAssigneeId);
    }

    if (!statusChanged && !(assigneeChanged && newAssigneeId)) {
      await logActivityService({
        workspaceId,
        userId,
        action: ActivityActionEnum.TASK_UPDATED,
        message: `updated "${updatedTask.title}"`,
        projectId,
        taskId,
      });
    }

    emitTaskChanged(workspaceId, userId, updatedTask);

    return res.status(HTTPSTATUS.OK).json({
      message: "Task updated successfull.",
      task: updatedTask,
    });
  }
);

export const getAllTasksController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const filters = {
      projectId: req.query.projectId as string | undefined,
      status: req.query.status
        ? (req.query.status as string)?.split(",")
        : undefined,
      priority: req.query.priority
        ? (req.query.priority as string)?.split(",")
        : undefined,
      assignedTo: req.query.assignedTo
        ? (req.query.assignedTo as string).split(",")
        : undefined,
      labels: req.query.labels
        ? (req.query.labels as string).split(",")
        : undefined,
      keyword: req.query.keyword as string | undefined,
      dueDate: req.query.dueDate as string | undefined,
      dueFrom: req.query.dueFrom as string | undefined,
      dueTo: req.query.dueTo as string | undefined,
    };

    const pagination = {
      pageSize: parseInt(req.query.pageSize as string) || 10,
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
    };

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const result = await getAllTasksService(workspaceId, filters, pagination);

    return res.status(HTTPSTATUS.OK).json({
      message: "All tasks fetched successfully.",
      ...result,
    });
  }
);

export const getTaskByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const task = await getTaskByIdService(workspaceId, projectId, taskId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Task fetched successfully.",
      task,
    });
  }
);

export const deleteTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const taskId = taskIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_TASK]);
    const task = await deleteTaskService(workspaceId, taskId);

    await logActivityService({
      workspaceId,
      userId,
      action: ActivityActionEnum.TASK_DELETED,
      message: `deleted "${task.title}"`,
      projectId: String(task.project),
    });

    emitTaskChanged(workspaceId, userId, task);

    return res.status(HTTPSTATUS.OK).json({
      message: "Task deleted successfully.",
    });
  }
);

//******** CHECKLIST ****************

export const addChecklistItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { text } = createChecklistItemSchema.parse(req.body);
    const taskId = taskIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { task } = await addChecklistItemService(workspaceId, taskId, text);

    emitTaskChanged(workspaceId, userId, task);

    return res.status(HTTPSTATUS.OK).json({
      message: "Checklist item added successfully.",
      checklist: task.checklist,
    });
  }
);

export const updateChecklistItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = updateChecklistItemSchema.parse(req.body);
    const taskId = taskIdSchema.parse(req.params.id);
    const itemId = checklistItemIdSchema.parse(req.params.itemId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { task, item, justCompleted } = await updateChecklistItemService(
      workspaceId,
      taskId,
      itemId,
      body
    );

    if (justCompleted) {
      await logActivityService({
        workspaceId,
        userId,
        action: ActivityActionEnum.CHECKLIST_COMPLETED,
        message: `completed "${item.text}" in "${task.title}"`,
        projectId: String(task.project),
        taskId,
      });
    }

    emitTaskChanged(workspaceId, userId, task);

    return res.status(HTTPSTATUS.OK).json({
      message: "Checklist item updated successfully.",
      checklist: task.checklist,
    });
  }
);

export const deleteChecklistItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const taskId = taskIdSchema.parse(req.params.id);
    const itemId = checklistItemIdSchema.parse(req.params.itemId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { task } = await deleteChecklistItemService(
      workspaceId,
      taskId,
      itemId
    );

    emitTaskChanged(workspaceId, userId, task);

    return res.status(HTTPSTATUS.OK).json({
      message: "Checklist item deleted successfully.",
      checklist: task.checklist,
    });
  }
);

//******** ATTACHMENTS ****************

// Only these types are shown inline; everything else downloads.
const INLINE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
];

export const uploadAttachmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const taskId = taskIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    if (!req.file) {
      throw new BadRequestException("Please choose a file to upload.");
    }

    const { task, attachment } = await uploadAttachmentService(
      workspaceId,
      taskId,
      userId,
      req.file
    );

    await logActivityService({
      workspaceId,
      userId,
      action: ActivityActionEnum.ATTACHMENT_ADDED,
      message: `attached "${attachment.name}" to "${task.title}"`,
      projectId: String(task.project),
      taskId,
    });

    emitTaskChanged(workspaceId, userId, task);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "File uploaded successfully.",
      attachment,
    });
  }
);

export const downloadAttachmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const taskId = taskIdSchema.parse(req.params.id);
    const attachmentId = taskIdSchema.parse(req.params.attachmentId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { attachment, stream } = await getAttachmentStreamService(
      workspaceId,
      taskId,
      attachmentId
    );

    const inline =
      req.query.inline === "1" &&
      INLINE_MIME_TYPES.includes(attachment.mimeType);

    res.setHeader(
      "Content-Type",
      inline ? attachment.mimeType : "application/octet-stream"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Disposition",
      `${
        inline ? "inline" : "attachment"
      }; filename*=UTF-8''${encodeURIComponent(attachment.name)}`
    );

    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(HTTPSTATUS.NOT_FOUND).json({ message: "File not found." });
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  }
);

export const deleteAttachmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const taskId = taskIdSchema.parse(req.params.id);
    const attachmentId = taskIdSchema.parse(req.params.attachmentId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { task } = await deleteAttachmentService(
      workspaceId,
      taskId,
      attachmentId
    );

    emitTaskChanged(workspaceId, userId, task);

    return res.status(HTTPSTATUS.OK).json({
      message: "Attachment deleted successfully.",
    });
  }
);
