import { z } from "zod";

export const commentIdSchema = z.string().trim().min(1);

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  mentions: z.array(z.string().trim().min(1)).max(20).optional(),
});
