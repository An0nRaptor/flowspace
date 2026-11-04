// CREATE A NEW WORKSPACE
import mongoose from "mongoose";
import { Roles } from "../enums/role";
import MemberModel from "../models/Member";
import RoleModel from "../models/RolesPermission";
import UserModel from "../models/User";
import WorkspaceModel from "../models/Workspace";
import { BadRequestException, NotFoundException } from "../utils/appError";
import TaskModel from "../models/Task";
import { TaskStatusEnum } from "../enums/task";
import ProjectModel from "../models/Project";
import CommentModel from "../models/Comment";
import LabelModel from "../models/Label";
import ActivityModel from "../models/Activity";
import NotificationModel from "../models/Notification";
import { deleteAttachmentFilesService } from "./attachmentService";

export const createWorkspaceService = async (
  userId: string,
  body: {
    name: string;
    description?: string | undefined;
  }
) => {
  const { name, description } = body;

  const user = await UserModel.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found.");
  }

  const ownerRole = await RoleModel.findOne({ name: Roles.OWNER });

  if (!ownerRole) {
    throw new NotFoundException("Owner role not found.");
  }
  const workspace = new WorkspaceModel({
    name: name,
    description: description,
    owner: user._id,
  });

  await workspace.save();

  const member = new MemberModel({
    userId: user._id,
    workspaceId: workspace._id,
    role: ownerRole._id,
    joinedAt: new Date(),
  });

  await member.save();

  user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;

  await user.save();

  return { workspace };
};

export const getAllWorkspacesUserIsMemberService = async (userId: string) => {
  const memberships = await MemberModel.find({ userId })
    .populate("workspaceId")
    .exec();

  const workspaces = memberships
    .map((membership) => membership.workspaceId)
    .filter(Boolean);

  return { workspaces };
};

export const getWorkspaceByIdService = async (workspaceId: string) => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw new NotFoundException("Workspace not found.");
  }

  const members = await MemberModel.find({
    workspaceId,
  }).populate("role");

  const workspaceWithMembers = {
    ...workspace.toObject(),
    members,
  };

  return { workspace: workspaceWithMembers };
};

export const getWorkspaceMembersService = async (workspaceId: string) => {
  const members = await MemberModel.find({
    workspaceId,
  })
    .populate("userId", "name email profilePicture")
    .populate("role", "name");

  const roles = await RoleModel.find({}, { name: 1, _id: 1 })
    .select("-permission")
    .lean();

  return { members, roles };
};

export const getWorkspaceAnalyticsService = async (workspaceId: string) => {
  const currentDate = new Date();

  const totalTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
  });

  const overdueTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    dueDate: { $lt: currentDate },
    status: { $ne: TaskStatusEnum.DONE },
  });

  const completedTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    status: TaskStatusEnum.DONE,
  });

  const analytics = {
    totalTasks,
    overdueTasks,
    completedTasks,
  };

  return { analytics };
};

export const changeMemberRoleService = async (
  workspaceId: string,
  memberId: string,
  roleId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw new NotFoundException("Workspace not found.");
  }
  const role = await RoleModel.findById(roleId);

  if (!role) {
    throw new NotFoundException("Role not found.");
  }

  const member = await MemberModel.findOne({
    userId: memberId,
    workspaceId: workspaceId,
  });

  if (!member) {
    throw new Error("Member not found in the workspace.");
  }

  member.role = role;
  await member.save();

  return { member };
};

export const updateWorkspaceByIdService = async (
  workspaceId: string,
  name: string,
  description?: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw new NotFoundException("Workspace not found.");
  }

  workspace.name = name || workspace.name;
  workspace.description = description || workspace.description;

  await workspace.save();

  return { workspace };
};

export const deleteWorkspaceService = async (
  workspaceId: string,
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let attachmentFileIds: mongoose.Types.ObjectId[] = [];

  try {
    const workspace = await WorkspaceModel.findById(workspaceId).session(
      session
    );

    if (!workspace) {
      throw new NotFoundException("Workspace not found.");
    }
    // Check if user owns the workplace;
    if (workspace.owner.toString() !== userId.toString()) {
      throw new BadRequestException(
        "You are not authorized to delete this workspace."
      );
    }

    const user = await UserModel.findById(userId).session(session);

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    await ProjectModel.deleteMany({ workspace: workspace._id }).session(
      session
    );

    const tasks = await TaskModel.find({ workspace: workspace._id })
      .select("attachments.fileId")
      .session(session);
    attachmentFileIds = tasks.flatMap((task) =>
      task.attachments.map((attachment) => attachment.fileId)
    );

    await TaskModel.deleteMany({ workspace: workspace._id }).session(session);

    await MemberModel.deleteMany({ workspaceId: workspace._id }).session(
      session
    );

    await CommentModel.deleteMany({ workspace: workspace._id }).session(
      session
    );
    await LabelModel.deleteMany({ workspace: workspace._id }).session(session);
    await ActivityModel.deleteMany({ workspace: workspace._id }).session(
      session
    );
    await NotificationModel.deleteMany({ workspace: workspace._id }).session(
      session
    );

    // Update the users currentWorkspace if it matches the deleted workspace

    if (user?.currentWorkspace?.equals(workspaceId)) {
      const memberWorkspace = await MemberModel.findOne({ userId }).session(
        session
      );

      // Update the users currentWorkspace
      user.currentWorkspace = memberWorkspace
        ? memberWorkspace.workspaceId
        : null;

      await user.save({ session });
    }

    await workspace.deleteOne({ session });

    await session.commitTransaction();

    session.endSession();

    // GridFS files are outside the transaction; remove them once it commits.
    await deleteAttachmentFilesService(attachmentFileIds);

    return { currentWorkspace: user.currentWorkspace };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
