import { ErrorCodeEnum } from "../enums/errorCode";
import { Roles } from "../enums/role";
import MemberModel from "../models/Member";
import RoleModel from "../models/RolesPermission";
import WorkspaceModel from "../models/Workspace";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";

export const getMemberRoleInWorkspace = async (
  userId: string,
  workspaceId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const member = await MemberModel.findOne({
    userId,
    workspaceId,
  }).populate("role");

  if (!member) {
    throw new UnauthorizedException(
      "You are not a member of this workspace.",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }

  const roleName = member.role?.name;
  return { role: roleName };
};

export const joinWorkspaceByInviteService = async (
  userId: string,
  inviteCode: string
) => {
  const workspace = await WorkspaceModel.findOne({ inviteCode }).exec();

  if (!workspace) {
    throw new NotFoundException("Invalid invite code or workspace.");
  }

  const existingMember = await MemberModel.findOne({
    userId,
    workspaceId: workspace._id,
  }).exec();

  if (existingMember) {
    throw new BadRequestException("You are already a member of the workspace.");
  }

  const role = await RoleModel.findOne({ name: Roles.MEMBER });

  if (!role) {
    throw new NotFoundException("Role does not exists.");
  }

  const newMember = new MemberModel({
    userId,
    workspaceId: workspace._id,
    role: role._id,
  });

  await newMember.save();

  return { workspaceId: workspace._id, role: role.name };
};
