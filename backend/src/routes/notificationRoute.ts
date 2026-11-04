import { Router } from "express";
import {
  getNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
} from "../controllers/notificationController";

const notificationRoutes = Router();

notificationRoutes.get("/all", getNotificationsController);
notificationRoutes.put("/read-all", markAllNotificationsReadController);
notificationRoutes.put("/:id/read", markNotificationReadController);

export default notificationRoutes;
