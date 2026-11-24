import { useState } from "react";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarIcon, Loader, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Permissions, TaskPriorityEnum, TaskStatusEnum } from "@/constant";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useInvalidateTasks from "@/hooks/api/use-invalidate-tasks";
import {
  createTaskMutationFn,
  getAiStatusQueryFn,
  suggestTasksMutationFn,
} from "@/lib/api";
import { transformOptions } from "@/lib/helper";
import { toast } from "@/hooks/use-toast";
import { SuggestedTaskType } from "@/types/api.type";

type Suggestion = SuggestedTaskType & { selected: boolean };

const EXAMPLE = `Sprint planning: Priya will redesign the pricing page by next Friday, it's urgent because of the launch. We also need to fix the login bug on Safari, and someone should write release notes for v2.1. Nice to have: dark mode for the settings page.`;

// The public demo runs without an API key (every live call costs money), so
// it shows this saved example of Claude's output for EXAMPLE instead.
const nextFriday = () => {
  const date = new Date();
  date.setDate(date.getDate() + ((5 - date.getDay() + 7) % 7 || 7));
  return format(date, "yyyy-MM-dd");
};

const sampleSuggestions = (): SuggestedTaskType[] => [
  {
    title: "Redesign the pricing page",
    description: "Priya owns this. Urgent: it needs to be ready for the launch.",
    priority: "HIGH",
    dueDate: nextFriday(),
  },
  {
    title: "Fix the login bug on Safari",
    description: "Users can't log in on Safari; reproduce and fix before release.",
    priority: "HIGH",
    dueDate: null,
  },
  {
    title: "Write release notes for v2.1",
    description: "",
    priority: "MEDIUM",
    dueDate: null,
  },
  {
    title: "Add dark mode to the settings page",
    description: "Nice to have, not required for the launch.",
    priority: "LOW",
    dueDate: null,
  },
];

const AiTaskDialog = (props: { projectId: string }) => {
  const { projectId } = props;
  const workspaceId = useWorkspaceId();
  const invalidateTasks = useInvalidateTasks(workspaceId);

  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // The button only shows when the server has an AI key configured.
  const { data: status } = useQuery({
    queryKey: ["ai-status"],
    queryFn: getAiStatusQueryFn,
    staleTime: Infinity,
  });

  const { mutate: suggestTasks, isPending: isGenerating } = useMutation({
    mutationFn: suggestTasksMutationFn,
  });

  const priorityOptions = transformOptions(Object.values(TaskPriorityEnum));
  const selectedCount = suggestions?.filter((s) => s.selected).length || 0;
  const isSampleMode = status?.enabled === false;

  const reset = () => {
    setText("");
    setSuggestions(null);
  };

  const onOpenChange = (open: boolean) => {
    if (isAdding) return;
    setIsOpen(open);
    if (!open) reset();
    // Sample mode only has a saved answer for the example notes.
    if (open && isSampleMode) setText(EXAMPLE);
  };

  const onError = (error: Error) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  };

  const onGenerate = () => {
    if (isSampleMode) {
      setSuggestions(
        sampleSuggestions().map((task) => ({ ...task, selected: true }))
      );
      return;
    }
    if (isGenerating || text.trim().length < 10) return;
    suggestTasks(
      { workspaceId, projectId, text },
      {
        onSuccess: (res) => {
          if (!res.tasks.length) {
            toast({
              title: "No tasks found",
              description: "Try notes that mention work someone needs to do.",
            });
            return;
          }
          setSuggestions(res.tasks.map((task) => ({ ...task, selected: true })));
        },
        onError,
      }
    );
  };

  const updateSuggestion = (index: number, patch: Partial<Suggestion>) => {
    setSuggestions((prev) =>
      prev ? prev.map((s, i) => (i === index ? { ...s, ...patch } : s)) : prev
    );
  };

  // Created one by one through the normal API, so activity, notifications
  // and live updates behave exactly like manually created tasks.
  const onAddTasks = async () => {
    if (!suggestions || isAdding) return;
    const chosen = suggestions.filter((s) => s.selected && s.title.trim());
    if (!chosen.length) return;

    setIsAdding(true);
    let created = 0;
    try {
      for (const task of chosen) {
        await createTaskMutationFn({
          workspaceId,
          projectId,
          data: {
            title: task.title.trim(),
            description: task.description.trim(),
            priority: task.priority,
            status: TaskStatusEnum.TODO,
            assignedTo: null,
            dueDate: task.dueDate
              ? new Date(`${task.dueDate}T00:00:00`).toISOString()
              : undefined,
          },
        });
        created += 1;
      }
      toast({
        title: "Success",
        description: `Added ${created} task${created === 1 ? "" : "s"} from your notes.`,
        variant: "success",
      });
      setIsOpen(false);
      reset();
    } catch (error) {
      onError(error as Error);
    } finally {
      if (created) invalidateTasks();
      setIsAdding(false);
    }
  };

  if (!status) return null;

  return (
    <PermissionsGuard requiredPermission={Permissions.CREATE_TASK}>
      <Dialog modal={true} open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Sparkles />
            AI tasks
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto my-5 border-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Turn notes into tasks
            </DialogTitle>
            <DialogDescription>
              {suggestions
                ? "Review the suggestions, edit anything, then add the ones you want."
                : "Paste meeting notes, a brainstorm or a plain request. Claude will split it into tasks for this project."}
            </DialogDescription>
          </DialogHeader>

          {isSampleMode && (
            <p className="rounded-md border border-dashed bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              Live AI is turned off in this public demo to keep it free.
              {suggestions
                ? " These are a saved example of what Claude returns for the notes above. You can still edit them and add them to the board."
                : " You'll see a saved example of what Claude returns for these notes."}
            </p>
          )}

          {!suggestions ? (
            <div className="space-y-3">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={EXAMPLE}
                rows={8}
                maxLength={4000}
                disabled={isGenerating}
                readOnly={isSampleMode}
                aria-label="Notes to turn into tasks"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{text.length}/4000</span>
                  {!text && (
                    <button
                      type="button"
                      className="underline underline-offset-2 hover:text-foreground"
                      onClick={() => setText(EXAMPLE)}
                    >
                      Use example
                    </button>
                  )}
                </div>
                <Button
                  onClick={onGenerate}
                  disabled={isGenerating || text.trim().length < 10}
                >
                  {isGenerating ? (
                    <>
                      <Loader className="animate-spin" />
                      Reading your notes…
                    </>
                  ) : (
                    <>
                      <Sparkles />
                      {isSampleMode ? "Show example result" : "Generate tasks"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <ul className="space-y-3">
                {suggestions.map((task, index) => (
                  <li
                    key={index}
                    className={`rounded-lg border p-3 transition-opacity ${
                      task.selected ? "" : "opacity-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        className="mt-2.5"
                        checked={task.selected}
                        onCheckedChange={(checked) =>
                          updateSuggestion(index, { selected: checked === true })
                        }
                        aria-label={`Include "${task.title}"`}
                      />
                      <div className="flex-1 space-y-2">
                        <Input
                          value={task.title}
                          onChange={(e) =>
                            updateSuggestion(index, { title: e.target.value })
                          }
                          maxLength={255}
                          aria-label="Task title"
                        />
                        <Textarea
                          value={task.description}
                          onChange={(e) =>
                            updateSuggestion(index, {
                              description: e.target.value,
                            })
                          }
                          rows={2}
                          placeholder="No description"
                          className="text-sm"
                          aria-label="Task description"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={task.priority}
                            onValueChange={(value) =>
                              updateSuggestion(index, {
                                priority: value as Suggestion["priority"],
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-[130px]" aria-label="Priority">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {priorityOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {task.dueDate && (
                            <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              {format(new Date(`${task.dueDate}T00:00:00`), "PPP")}
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => updateSuggestion(index, { dueDate: null })}
                                aria-label="Remove due date"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-3 pt-1">
                <Button
                  variant="ghost"
                  onClick={() => setSuggestions(null)}
                  disabled={isAdding}
                >
                  Back to notes
                </Button>
                <Button onClick={onAddTasks} disabled={isAdding || !selectedCount}>
                  {isAdding && <Loader className="animate-spin" />}
                  Add {selectedCount} task{selectedCount === 1 ? "" : "s"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PermissionsGuard>
  );
};

export default AiTaskDialog;
