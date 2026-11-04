import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { workspaceIdSchema } from "../validation/workspaceValidation";
import { getMemberRoleInWorkspace } from "../services/memberService";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role";
import { getActivitiesService } from "../services/activityService";
import { HTTPSTATUS } from "../config/http-config";

export const getActivitiesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const filters = {
      projectId: req.query.projectId as string | undefined,
      taskId: req.query.taskId as string | undefined,
    };

    const pagination = {
      pageSize: Math.min(parseInt(req.query.pageSize as string) || 20, 100),
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
    };

    const result = await getActivitiesService(workspaceId, filters, pagination);

    return res.status(HTTPSTATUS.OK).json({
      message: "Activity fetched successfully.",
      ...result,
    });
  }
);
