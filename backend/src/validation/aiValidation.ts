import { z } from "zod";

// Notes, a brainstorm or a plain-language request to turn into tasks.
export const suggestTasksSchema = z.object({
    text: z.string().trim().min(10, "Write at least a sentence.").max(4000)
})
