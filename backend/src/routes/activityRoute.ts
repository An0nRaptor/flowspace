import { Router } from "express";
import { getActivitiesController } from "../controllers/activityController";

const activityRoutes = Router();

activityRoutes.get("/workspace/:workspaceId/all", getActivitiesController);

export default activityRoutes;
