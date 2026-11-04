import mongoose, { Document, Schema } from "mongoose";
import { LabelColorEnum, LabelColorEnumType } from "../enums/label";

export interface LabelDocument extends Document {
  name: string;
  color: LabelColorEnumType;
  workspace: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const labelSchema = new Schema<LabelDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      enum: Object.values(LabelColorEnum),
      default: LabelColorEnum.GRAY,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const LabelModel = mongoose.model<LabelDocument>("Label", labelSchema);
export default LabelModel;
