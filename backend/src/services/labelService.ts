import LabelModel from "../models/Label";
import TaskModel from "../models/Task";
import { BadRequestException, NotFoundException } from "../utils/appError";

const MAX_LABELS_PER_WORKSPACE = 50;

export const getLabelsInWorkspaceService = async (workspaceId: string) => {
  const labels = await LabelModel.find({ workspace: workspaceId }).sort({
    name: 1,
  });
  return { labels };
};

export const createLabelService = async (
  workspaceId: string,
  userId: string,
  body: { name: string; color: string }
) => {
  const existing = await LabelModel.findOne({
    workspace: workspaceId,
    name: { $regex: `^${escapeRegex(body.name)}$`, $options: "i" },
  });

  if (existing) {
    throw new BadRequestException("A label with this name already exists.");
  }

  const count = await LabelModel.countDocuments({ workspace: workspaceId });
  if (count >= MAX_LABELS_PER_WORKSPACE) {
    throw new BadRequestException(
      `A workspace can have up to ${MAX_LABELS_PER_WORKSPACE} labels.`
    );
  }

  const label = await LabelModel.create({
    name: body.name,
    color: body.color,
    workspace: workspaceId,
    createdBy: userId,
  });

  return { label };
};

export const deleteLabelService = async (
  workspaceId: string,
  labelId: string
) => {
  const label = await LabelModel.findOneAndDelete({
    _id: labelId,
    workspace: workspaceId,
  });

  if (!label) {
    throw new NotFoundException("Label not found.");
  }

  await TaskModel.updateMany(
    { workspace: workspaceId, labels: label._id },
    { $pull: { labels: label._id } }
  );

  return { label };
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
