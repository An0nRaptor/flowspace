import mongoose, { Document, Schema } from "mongoose";
import {
  NotificationTypeEnum,
  NotificationTypeEnumType,
} from "../enums/notification";

export interface NotificationDocument extends Document {
  type: NotificationTypeEnumType;
  message: string;
  user: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId | null;
  workspace: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId | null;
  task: mongoose.Types.ObjectId | null;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    type: {
      type: String,
      enum: Object.values(NotificationTypeEnum),
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const NotificationModel = mongoose.model<NotificationDocument>(
  "Notification",
  notificationSchema
);
export default NotificationModel;
