import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task";
import CommentModel from "../models/Comment";
import LabelModel from "../models/Label";
import MemberModel from "../models/Member";
import ProjectModel from "../models/Project";
import TaskModel from "../models/Task";
import { BadRequestException, NotFoundException } from "../utils/appError";
import { deleteAttachmentFilesService } from "./attachmentService";

const TASK_LIST_POPULATE = [
  { path: "assignedTo", select: "_id name profilePicture" },
  { path: "project", select: "_id emoji name" },
  { path: "labels", select: "_id name color" },
];

const validateLabelsInWorkspace = async (
  workspaceId: string,
  labels?: string[]
) => {
  if (!labels || labels.length === 0) return;

  const count = await LabelModel.countDocuments({
    _id: { $in: labels },
    workspace: workspaceId,
  });

  if (count !== new Set(labels).size) {
    throw new BadRequestException(
      "One or more labels do not belong to this workspace."
    );
  }
};

const validateAssigneeInWorkspace = async (
  workspaceId: string,
  assignedTo?: string | null
) => {
  if (!assignedTo) return;

  const IsAssignedUserMember = await MemberModel.exists({
    userId: assignedTo,
    workspaceId,
  });

  if (!IsAssignedUserMember) {
    throw new BadRequestException(
      "Assigned user is not a member of this workspace."
    );
  }
};

export const createTaskService = async (
  workspaceId: string,
  projectId: string,
  userId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
    labels?: string[];
  }
) => {
  const { title, description, priority, status, assignedTo, dueDate, labels } =
    body;

  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace."
    );
  }

  await validateAssigneeInWorkspace(workspaceId, assignedTo);
  await validateLabelsInWorkspace(workspaceId, labels);

  const task = new TaskModel({
    title,
    description,
    priority: priority || TaskPriorityEnum.MEDIUM,
    status: status || TaskStatusEnum.TODO,
    assignedTo,
    createdBy: userId,
    workspace: workspaceId,
    project: projectId,
    dueDate,
    labels: labels || [],
  });

  await task.save();
  return { task };
};

export const updateTaskService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
    labels?: string[];
  }
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace."
    );
  }

  const task = await TaskModel.findById(taskId);

  if (!task || task.project.toString() !== projectId.toString()) {
    throw new NotFoundException(
      "Task not found or does not belong to this project."
    );
  }

  await validateAssigneeInWorkspace(workspaceId, body.assignedTo);
  await validateLabelsInWorkspace(workspaceId, body.labels);

  const update: Record<string, any> = { ...body };

  // A new due date or a new assignee should get fresh reminders.
  const dueDateChanged =
    body.dueDate !== undefined &&
    (task.dueDate ? task.dueDate.toISOString() : "") !==
      (body.dueDate ? new Date(body.dueDate).toISOString() : "");
  const assigneeChanged =
    body.assignedTo !== undefined &&
    String(task.assignedTo || "") !== String(body.assignedTo || "");

  if (dueDateChanged || assigneeChanged) {
    update.dueSoonReminderSent = false;
    update.overdueReminderSent = false;
  }

  const updatedTask = await TaskModel.findByIdAndUpdate(taskId, update, {
    new: true,
  });

  if (!updatedTask) {
    throw new BadRequestException("Failed to update task.");
  }

  return { updatedTask, previousTask: task };
};

export const getAllTasksService = async (
  workspaceId: string,
  filters: {
    projectId?: string;
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    labels?: string[];
    keyword?: string;
    dueDate?: string;
    dueFrom?: string;
    dueTo?: string;
  },

  pagination: {
    pageSize: number;
    pageNumber: number;
  }
) => {
  const query: Record<string, any> = {
    workspace: workspaceId,
  };

  if (filters.projectId) {
    query.project = filters.projectId;
  }

  if (filters.status && filters.status?.length > 0) {
    query.status = { $in: filters.status };
  }

  if (filters.priority && filters.priority?.length > 0) {
    query.priority = { $in: filters.priority };
  }

  if (filters.assignedTo && filters.assignedTo?.length > 0) {
    query.assignedTo = { $in: filters.assignedTo };
  }

  if (filters.labels && filters.labels?.length > 0) {
    query.labels = { $in: filters.labels };
  }

  if (filters.keyword && filters.keyword !== undefined) {
    query.title = { $regex: filters.keyword, $options: "i" };
  }

  if (filters.dueDate) {
    query.dueDate = {
      $eq: new Date(filters.dueDate),
    };
  }

  // Date range, used by the calendar view
  if (filters.dueFrom || filters.dueTo) {
    query.dueDate = {
      ...(filters.dueFrom && { $gte: new Date(filters.dueFrom) }),
      ...(filters.dueTo && { $lte: new Date(filters.dueTo) }),
    };
  }

  //   Pagination Setup
  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [tasks, totalCount] = await Promise.all([
    TaskModel.find(query)
      .select("-attachments")
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate(TASK_LIST_POPULATE),
    TaskModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    tasks,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};

export const getTaskByIdService = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace."
    );
  }
  const task = await TaskModel.findOne({
    _id: taskId,
    workspace: workspaceId,
    project: projectId,
  })
    .populate(TASK_LIST_POPULATE)
    .populate("attachments.uploadedBy", "_id name profilePicture");

  if (!task) {
    throw new NotFoundException("Task not found.");
  }

  return task;
};

export const deleteTaskService = async (
  workspaceId: string,
  taskId: string
) => {
  const task = await TaskModel.findOneAndDelete({
    _id: taskId,
    workspace: workspaceId,
  });

  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace."
    );
  }

  await CommentModel.deleteMany({ task: task._id });
  await deleteAttachmentFilesService(
    task.attachments.map((attachment) => attachment.fileId)
  );

  return task;
};

//******** CHECKLIST ****************

const getTaskInWorkspace = async (workspaceId: string, taskId: string) => {
  const task = await TaskModel.findOne({
    _id: taskId,
    workspace: workspaceId,
  });

  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace."
    );
  }
  return task;
};

export const addChecklistItemService = async (
  workspaceId: string,
  taskId: string,
  text: string
) => {
  const task = await getTaskInWorkspace(workspaceId, taskId);

  if (task.checklist.length >= 50) {
    throw new BadRequestException("A checklist can have up to 50 items.");
  }

  task.checklist.push({ text, completed: false });
  await task.save();

  return { task };
};

export const updateChecklistItemService = async (
  workspaceId: string,
  taskId: string,
  itemId: string,
  body: { text?: string; completed?: boolean }
) => {
  const task = await getTaskInWorkspace(workspaceId, taskId);
  const item = task.checklist.id(itemId);

  if (!item) {
    throw new NotFoundException("Checklist item not found.");
  }

  const wasCompleted = item.completed;
  if (body.text !== undefined) item.text = body.text;
  if (body.completed !== undefined) item.completed = body.completed;
  await task.save();

  return { task, item, justCompleted: !wasCompleted && item.completed };
};

export const deleteChecklistItemService = async (
  workspaceId: string,
  taskId: string,
  itemId: string
) => {
  const task = await getTaskInWorkspace(workspaceId, taskId);
  const item = task.checklist.id(itemId);

  if (!item) {
    throw new NotFoundException("Checklist item not found.");
  }

  item.deleteOne();
  await task.save();

  return { task };
};
