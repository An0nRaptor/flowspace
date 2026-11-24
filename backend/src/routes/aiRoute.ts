import { Router } from "express";
import { aiStatusController, suggestTasksController } from "../controllers/aiController";

const aiRoutes = Router();

aiRoutes.get("/status", aiStatusController)
aiRoutes.post("/projects/:projectId/workspace/:workspaceId/suggest-tasks", suggestTasksController)

export default aiRoutes;
