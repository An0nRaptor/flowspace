import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import {
  createLabelSchema,
  labelIdSchema,
} from "../validation/labelValidation";
import { workspaceIdSchema } from "../validation/workspaceValidation";
import { getMemberRoleInWorkspace } from "../services/memberService";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role";
import {
  createLabelService,
  deleteLabelService,
  getLabelsInWorkspaceService,
} from "../services/labelService";
import { emitToWorkspace } from "../config/socket-config";
import { HTTPSTATUS } from "../config/http-config";
import { SocketEventEnum } from "../enums/socket";

export const getLabelsInWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { labels } = await getLabelsInWorkspaceService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Labels fetched successfully.",
      labels,
    });
  }
);

export const createLabelController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = createLabelSchema.parse(req.body);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { label } = await createLabelService(workspaceId, userId, body);

    emitToWorkspace(workspaceId, SocketEventEnum.LABEL_CHANGED, {
      actorId: String(userId),
    });

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Label created successfully.",
      label,
    });
  }
);

export const deleteLabelController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const labelId = labelIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MANAGE_WORKSPACE_SETTINGS]);

    await deleteLabelService(workspaceId, labelId);

    emitToWorkspace(workspaceId, SocketEventEnum.LABEL_CHANGED, {
      actorId: String(userId),
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Label deleted successfully.",
    });
  }
);
