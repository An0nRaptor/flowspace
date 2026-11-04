import CommentModel from "../models/Comment";
import MemberModel from "../models/Member";
import TaskModel from "../models/Task";
import { NotFoundException, UnauthorizedException } from "../utils/appError";

const COMMENT_POPULATE = [
  { path: "author", select: "_id name profilePicture" },
  { path: "mentions", select: "_id name" },
];

const getTaskInWorkspace = async (workspaceId: string, taskId: string) => {
  const task = await TaskModel.findOne({
    _id: taskId,
    workspace: workspaceId,
  }).select("_id title project workspace assignedTo");

  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace."
    );
  }
  return task;
};

export const getCommentsByTaskService = async (
  workspaceId: string,
  taskId: string
) => {
  await getTaskInWorkspace(workspaceId, taskId);

  const comments = await CommentModel.find({ task: taskId })
    .sort({ createdAt: 1 })
    .populate(COMMENT_POPULATE);

  return { comments };
};

export const createCommentService = async (
  workspaceId: string,
  taskId: string,
  userId: string,
  body: { content: string; mentions?: string[] }
) => {
  const task = await getTaskInWorkspace(workspaceId, taskId);

  // Only workspace members can be mentioned.
  const requested = [...new Set(body.mentions || [])];
  const members = requested.length
    ? await MemberModel.find({
        workspaceId,
        userId: { $in: requested },
      }).select("userId")
    : [];
  const mentions = members.map((member) => member.userId);

  const comment = await CommentModel.create({
    content: body.content,
    task: task._id,
    workspace: workspaceId,
    author: userId,
    mentions,
  });

  await comment.populate(COMMENT_POPULATE);

  return { comment, task, mentions };
};

export const deleteCommentService = async (
  workspaceId: string,
  commentId: string,
  userId: string,
  canDeleteAny: boolean
) => {
  const comment = await CommentModel.findOne({
    _id: commentId,
    workspace: workspaceId,
  });

  if (!comment) {
    throw new NotFoundException("Comment not found.");
  }

  if (!canDeleteAny && comment.author.toString() !== String(userId)) {
    throw new UnauthorizedException("You can only delete your own comments.");
  }

  await comment.deleteOne();
  return { comment };
};
