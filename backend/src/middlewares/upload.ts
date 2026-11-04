import multer from "multer";
import { MAX_ATTACHMENT_SIZE } from "../services/attachmentService";

// Keep the file in memory; the service streams it into GridFS.
export const uploadSingleFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_SIZE, files: 1 },
}).single("file");
