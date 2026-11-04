import { z } from "zod";
import { LabelColorEnum } from "../enums/label";

export const labelIdSchema = z.string().trim().min(1);

export const createLabelSchema = z.object({
  name: z.string().trim().min(1).max(30),
  color: z.enum(Object.values(LabelColorEnum) as [string, ...string[]]),
});
