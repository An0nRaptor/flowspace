 import { Router } from "express";
import { addChecklistItemController, createTaskController, deleteAttachmentController, deleteChecklistItemController, deleteTaskController, downloadAttachmentController, getAllTasksController, getTaskByIdController, updateChecklistItemController, updateTaskController, uploadAttachmentController } from "../controllers/taskController";
import { uploadSingleFile } from "../middlewares/upload";

 const taskRoutes = Router();

 taskRoutes.post("/projects/:projectId/workspace/:workspaceId/create", createTaskController)
 taskRoutes.put("/:id/project/:projectId/workspace/:workspaceId/update", updateTaskController)
 taskRoutes.delete("/:id/workspace/:workspaceId/delete", deleteTaskController)
 taskRoutes.get("/workspace/:workspaceId/all", getAllTasksController)
 taskRoutes.get("/:id/project/:projectId/workspace/:workspaceId", getTaskByIdController)

 taskRoutes.post("/:id/workspace/:workspaceId/checklist", addChecklistItemController)
 taskRoutes.put("/:id/workspace/:workspaceId/checklist/:itemId", updateChecklistItemController)
 taskRoutes.delete("/:id/workspace/:workspaceId/checklist/:itemId", deleteChecklistItemController)

 taskRoutes.post("/:id/workspace/:workspaceId/attachments", uploadSingleFile, uploadAttachmentController)
 taskRoutes.get("/:id/workspace/:workspaceId/attachments/:attachmentId", downloadAttachmentController)
 taskRoutes.delete("/:id/workspace/:workspaceId/attachments/:attachmentId", deleteAttachmentController)


 export default taskRoutes;
