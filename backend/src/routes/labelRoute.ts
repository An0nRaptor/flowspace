import { Router } from "express";
import {
  createLabelController,
  deleteLabelController,
  getLabelsInWorkspaceController,
} from "../controllers/labelController";

const labelRoutes = Router();

labelRoutes.get("/workspace/:workspaceId/all", getLabelsInWorkspaceController);
labelRoutes.post("/workspace/:workspaceId/create", createLabelController);
labelRoutes.delete("/:id/workspace/:workspaceId/delete", deleteLabelController);

export default labelRoutes;
