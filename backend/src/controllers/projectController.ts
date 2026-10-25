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

export const createProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createProjectSchema.parse(req.body);

    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_PROJECT]);

    const { project } = await createProjectService(userId, workspaceId, body);

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

    await deleteProjectService(workspaceId, projectId);

    return res.status(HTTPSTATUS.OK).json({
      message:"Project deleted successfully.",

    })

  }
)