import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { config } from "../config/app-config";
import { HTTPSTATUS } from "../config/http-config";
import { TaskPriorityEnum } from "../enums/task";
import { AppError, BadRequestException } from "../utils/appError";

const MODEL = "claude-opus-5-5";
const MAX_SUGGESTIONS = 15;

// Shape Claude must return (enforced by structured outputs).
const SuggestedTasksSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum([
        TaskPriorityEnum.LOW,
        TaskPriorityEnum.MEDIUM,
        TaskPriorityEnum.HIGH,
      ]),
      dueDate: z
        .string()
        .nullable()
        .describe("YYYY-MM-DD, or null when the text gives no date"),
    })
  ),
});

export type SuggestedTask = z.infer<typeof SuggestedTasksSchema>["tasks"][number];

const SYSTEM_PROMPT = `You turn meeting notes, brainstorms and plain-language requests into tasks for a team's project board.

For each distinct piece of work in the text, write one task:
- title: a short action starting with a verb, at most 80 characters ("Draft pricing page copy", not "Pricing page").
- description: one or two sentences of useful detail taken from the text. Use an empty string if there is nothing to add.
- priority: HIGH for anything urgent, blocking or tied to a near deadline; LOW for nice-to-haves; MEDIUM otherwise.
- dueDate: only when the text states or clearly implies a date. Resolve relative dates ("next Friday", "end of month") against today's date given in the request. Otherwise null.

Only include work that someone actually needs to do; skip greetings, opinions and things already finished. Do not invent work the text does not mention. If the text contains no tasks at all, return an empty list.`;

let client: Anthropic | null = null;

export const isAiEnabled = () => config.ANTHROPIC_API_KEY !== "none";

const getClient = () => {
  if (!isAiEnabled()) {
    throw new AppError(
      "AI features aren't set up on this server yet.",
      HTTPSTATUS.SERVICE_UNAVAILABLE
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  }
  return client;
};

const isValidDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));

export const suggestTasksService = async (
  text: string,
  projectName: string
): Promise<{ tasks: SuggestedTask[] }> => {
  const anthropic = getClient();
  const today = new Date().toISOString().slice(0, 10);

  let response;
  try {
    response = await anthropic.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // Extraction is simple work: low effort keeps it fast and cheap.
      output_config: {
        effort: "low",
        format: betaZodOutputFormat(SuggestedTasksSchema),
      },
      // If Claude Opus 5.5 declines, the API retries on a suitable model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Today's date: ${today}\nProject: ${projectName}\n\n<notes>\n${text}\n</notes>`,
        },
      ],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      throw new AppError(
        "The AI is busy right now. Try again in a minute.",
        HTTPSTATUS.TOO_MANY_REQUESTS
      );
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic API key was rejected:", error.message);
      throw new AppError(
        "AI features aren't set up correctly on this server.",
        HTTPSTATUS.SERVICE_UNAVAILABLE
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      throw new AppError(
        "The AI service had a problem. Try again shortly.",
        HTTPSTATUS.BAD_GATEWAY
      );
    }
    throw error;
  }

  if (response.stop_reason === "refusal") {
    throw new BadRequestException(
      "The AI couldn't turn that text into tasks. Try rewording it."
    );
  }
  if (!response.parsed_output) {
    throw new AppError(
      "The AI returned an unexpected answer. Try again.",
      HTTPSTATUS.BAD_GATEWAY
    );
  }

  const tasks = response.parsed_output.tasks
    .slice(0, MAX_SUGGESTIONS)
    .map((task) => ({
      title: task.title.trim().slice(0, 255),
      description: task.description.trim(),
      priority: task.priority,
      dueDate: task.dueDate && isValidDate(task.dueDate) ? task.dueDate : null,
    }))
    .filter((task) => task.title.length > 0);

  return { tasks };
};
