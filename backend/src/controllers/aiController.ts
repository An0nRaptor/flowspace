import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { suggestTasksSchema } from "../validation/aiValidation";
import { projectIdSchema } from "../validation/projectValidation";
import { workspaceIdSchema } from "../validation/workspaceValidation";
import { getMemberRoleInWorkspace } from "../services/memberService";
import { getProjectByIdAndWorkspaceIdService } from "../services/projectService";
import { isAiEnabled, suggestTasksService } from "../services/aiService";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role";
import { HTTPSTATUS } from "../config/http-config";

// Every request costs money and the demo is public, so cap it per network
// (same pattern as the demo login limit in authController).
const AI_LIMIT_PER_HOUR = 10;
const aiRequests = new Map<string, number[]>();

export const aiStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    return res.status(HTTPSTATUS.OK).json({
      enabled: isAiEnabled(),
    });
  }
);

export const suggestTasksController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { text } = suggestTasksSchema.parse(req.body);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_TASK]);

    const { project } = await getProjectByIdAndWorkspaceIdService(
      workspaceId,
      projectId
    );

    const ip = req.ip || "unknown";
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const recent = (aiRequests.get(ip) || []).filter((t) => t > hourAgo);

    if (recent.length >= AI_LIMIT_PER_HOUR) {
      return res.status(HTTPSTATUS.TOO_MANY_REQUESTS).json({
        message: "You've used the AI task generator a lot this hour. Try again later.",
      });
    }
    aiRequests.set(ip, [...recent, Date.now()]);

    const { tasks } = await suggestTasksService(text, project.name);

    return res.status(HTTPSTATUS.OK).json({
      message: tasks.length
        ? "Suggested tasks generated."
        : "No tasks found in that text.",
      tasks,
    });
  }
);
