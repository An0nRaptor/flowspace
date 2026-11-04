import { Router } from "express";
import {
  createCommentController,
  deleteCommentController,
  getCommentsByTaskController,
} from "../controllers/commentController";

const commentRoutes = Router();

commentRoutes.get(
  "/task/:taskId/workspace/:workspaceId",
  getCommentsByTaskController
);
commentRoutes.post(
  "/task/:taskId/workspace/:workspaceId/create",
  createCommentController
);
commentRoutes.delete(
  "/:id/workspace/:workspaceId/delete",
  deleteCommentController
);

export default commentRoutes;
