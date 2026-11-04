import { ActivityActionEnumType } from "../enums/activity";
import { SocketEventEnum } from "../enums/socket";
import ActivityModel from "../models/Activity";
import { emitToWorkspace } from "../config/socket-config";

export const logActivityService = async (activity: {
  workspaceId: string;
  userId: string;
  action: ActivityActionEnumType;
  message: string;
  projectId?: string | null;
  taskId?: string | null;
}) => {
  // The activity log must never break the action it records.
  try {
    await ActivityModel.create({
      workspace: activity.workspaceId,
      actor: activity.userId,
      action: activity.action,
      message: activity.message,
      project: activity.projectId || null,
      task: activity.taskId || null,
    });

    emitToWorkspace(activity.workspaceId, SocketEventEnum.ACTIVITY_NEW, {
      projectId: activity.projectId ? String(activity.projectId) : null,
      taskId: activity.taskId ? String(activity.taskId) : null,
    });
  } catch (error) {
    console.error("Failed to log activity", error);
  }
};

export const getActivitiesService = async (
  workspaceId: string,
  filters: {
    projectId?: string;
    taskId?: string;
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

  if (filters.taskId) {
    query.task = filters.taskId;
  }

  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [activities, totalCount] = await Promise.all([
    ActivityModel.find(query)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate("actor", "_id name profilePicture")
      .populate("project", "_id name emoji")
      .populate("task", "_id title taskCode"),
    ActivityModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    activities,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};
