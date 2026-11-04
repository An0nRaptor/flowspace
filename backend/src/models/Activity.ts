import mongoose, { Document, Schema } from "mongoose";
import { ActivityActionEnum, ActivityActionEnumType } from "../enums/activity";

export interface ActivityDocument extends Document {
  action: ActivityActionEnumType;
  message: string;
  workspace: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId | null;
  task: mongoose.Types.ObjectId | null;
  actor: mongoose.Types.ObjectId;
  createdAt: Date;
}

const activitySchema = new Schema<ActivityDocument>(
  {
    action: {
      type: String,
      enum: Object.values(ActivityActionEnum),
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
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
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ActivityModel = mongoose.model<ActivityDocument>(
  "Activity",
  activitySchema
);
export default ActivityModel;
