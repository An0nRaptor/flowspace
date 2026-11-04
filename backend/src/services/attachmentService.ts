import mongoose from "mongoose";
import { Readable } from "stream";
import TaskModel from "../models/Task";
import { BadRequestException, NotFoundException } from "../utils/appError";

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_ATTACHMENTS_PER_TASK = 10;

// Files live in MongoDB GridFS, so attachments need no extra cloud account.
const getBucket = () => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database is not connected.");
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: "attachments" });
};

export const uploadAttachmentService = async (
  workspaceId: string,
  taskId: string,
  userId: string,
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer }
) => {
  const task = await TaskModel.findOne({ _id: taskId, workspace: workspaceId });

  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace."
    );
  }

  if (task.attachments.length >= MAX_ATTACHMENTS_PER_TASK) {
    throw new BadRequestException(
      `A task can have up to ${MAX_ATTACHMENTS_PER_TASK} attachments.`
    );
  }

  const bucket = getBucket();
  const uploadStream = bucket.openUploadStream(file.originalname, {
    metadata: {
      task: task._id,
      workspace: workspaceId,
      mimeType: file.mimetype,
    },
  });

  await new Promise<void>((resolve, reject) => {
    Readable.from(file.buffer)
      .pipe(uploadStream)
      .on("finish", () => resolve())
      .on("error", reject);
  });

  task.attachments.push({
    fileId: uploadStream.id,
    name: file.originalname,
    size: file.size,
    mimeType: file.mimetype || "application/octet-stream",
    uploadedBy: userId,
  });
  await task.save();

  const attachment = task.attachments[task.attachments.length - 1];
  return { task, attachment };
};

export const getAttachmentStreamService = async (
  workspaceId: string,
  taskId: string,
  attachmentId: string
) => {
  const task = await TaskModel.findOne({ _id: taskId, workspace: workspaceId });
  const attachment = task?.attachments.id(attachmentId);

  if (!task || !attachment) {
    throw new NotFoundException("Attachment not found.");
  }

  const stream = getBucket().openDownloadStream(attachment.fileId);
  return { attachment, stream };
};

export const deleteAttachmentService = async (
  workspaceId: string,
  taskId: string,
  attachmentId: string
) => {
  const task = await TaskModel.findOne({ _id: taskId, workspace: workspaceId });
  const attachment = task?.attachments.id(attachmentId);

  if (!task || !attachment) {
    throw new NotFoundException("Attachment not found.");
  }

  const fileId = attachment.fileId;
  attachment.deleteOne();
  await task.save();
  await deleteAttachmentFilesService([fileId]);

  return { task };
};

export const deleteAttachmentFilesService = async (
  fileIds: mongoose.Types.ObjectId[]
) => {
  if (fileIds.length === 0) return;
  const bucket = getBucket();

  await Promise.all(
    fileIds.map((fileId) =>
      bucket.delete(fileId).catch((error) => {
        console.error(`Failed to delete attachment file ${fileId}`, error);
      })
    )
  );
};
