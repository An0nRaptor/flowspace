import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import {
  createProjectSchema,
  projectIdSchema,
} from "../validation/projectValidation";
import { workspaceIdSchema } from "../validation/workspaceValidation";
import { getMemberRoleInWorkspace } from "../services/memberService";
import { Permissions } from "../enums/role";
import { roleGuard } from "../utils/roleGuard";
import {
  createProjectService,
  deleteProjectService,
  getProjectAnalyticsService,
  getProjectByIdAndWorkspaceIdService,
  getProjectInWorkspaceService,
  updateProjectService,
} from "../services/projectService";
import { HTTPSTATUS } from "../config/http-config";
import { logActivityService } from "../services/activityService";
import { emitToWorkspace } from "../config/socket-config";
import { ActivityActionEnum } from "../enums/activity";
import { SocketEventEnum } from "../enums/socket";

export const createProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createProjectSchema.parse(req.body);

    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_PROJECT]);

    const { project } = await createProjectService(userId, workspaceId, body);

    await logActivityService({
      workspaceId,
      userId,
      action: ActivityActionEnum.PROJECT_CREATED,
      message: `created project ${project.emoji || ""} ${project.name}`,
      projectId: String(project._id),
    });
    emitToWorkspace(workspaceId, SocketEventEnum.PROJECT_CHANGED, {
      projectId: String(project._id),
      actorId: String(userId),
    });

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Project created successfully.",
      project,
    });
  }
);

export const getAllProjectsInWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;

    const { projects, totalCount, totalPages, skip } =
      await getProjectInWorkspaceService(workspaceId, pageSize, pageNumber);

    return res.status(HTTPSTATUS.OK).json({
      message: " Project fetched successfully.",
      projects,
      pagination: {
        totalCount,
        pageSize,
        pageNumber,
        totalPages,
        skip,
        limit: pageSize,
      },
    });
  }
);

export const getProjectByIdAndWorkspaceId = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(req.params.id);

    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { project } = await getProjectByIdAndWorkspaceIdService(
      workspaceId,
      projectId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: " Project fetched successfully.",
      project,
    });
  }
);

export const getProjectAnalyticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(req.params.id);

    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role,[Permissions.VIEW_ONLY])

    const {analytics} = await getProjectAnalyticsService(workspaceId, projectId);

    return res.status(HTTPSTATUS.OK).json({
      message:"Project analytics retrieved successfully.",
      analytics
    })
  }
);
export const updateProjectController = asyncHandler(

  async (req:Request, res:Response)=>{

    const body = createProjectSchema.parse(req.body);
    const projectId = projectIdSchema.parse(req.params.id)
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId)
      const userId = req.user?._id;

    const {role} = await getMemberRoleInWorkspace(userId, workspaceId);

    roleGuard(role,[Permissions.EDIT_PROJECT])

    const {project} = await updateProjectService(workspaceId,projectId,body);

    emitToWorkspace(workspaceId, SocketEventEnum.PROJECT_CHANGED, {
      projectId,
      actorId: String(userId),
    });

    return res.status(HTTPSTATUS.OK).json({

      message:"Project updated successfull.",
      project,
    })


  }
)

export const deleteProjectController = asyncHandler(

  async(req:Request, res:Response)=>{

    const userId = req.user?._id;
    const projectId = projectIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const {role} = await getMemberRoleInWorkspace(userId,workspaceId);

    roleGuard(role,[Permissions.DELETE_PROJECT]);

    const project = await deleteProjectService(workspaceId, projectId);

    // The project is gone, so the entry is kept at workspace level.
    await logActivityService({
      workspaceId,
      userId,
      action: ActivityActionEnum.PROJECT_DELETED,
      message: `deleted project ${project.emoji || ""} ${project.name}`,
    });
    emitToWorkspace(workspaceId, SocketEventEnum.PROJECT_CHANGED, {
      projectId,
      actorId: String(userId),
    });
    emitToWorkspace(workspaceId, SocketEventEnum.TASK_CHANGED, {
      projectId,
      actorId: String(userId),
    });

    return res.status(HTTPSTATUS.OK).json({
      message:"Project deleted successfully.",

    })

  }
)