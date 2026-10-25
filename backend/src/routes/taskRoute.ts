 import { Router } from "express";
import { createTaskController, deleteTaskController, getAllTasksController, getTaskByIdController, updateTaskController } from "../controllers/taskController";

 const taskRoutes = Router();

 taskRoutes.post("/projects/:projectId/workspace/:workspaceId/create", createTaskController)
 taskRoutes.put("/:id/project/:projectId/workspace/:workspaceId/update", updateTaskController)
 taskRoutes.delete("/:id/workspace/:workspaceId/delete", deleteTaskController)
 taskRoutes.get("/workspace/:workspaceId/all", getAllTasksController)
 taskRoutes.get("/:id/project/:projectId/workspace/:workspaceId", getTaskByIdController)


 export default taskRoutes;