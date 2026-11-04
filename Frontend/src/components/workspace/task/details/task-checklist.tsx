import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader, Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useInvalidateTasks from "@/hooks/api/use-invalidate-tasks";
import {
  addChecklistItemMutationFn,
  deleteChecklistItemMutationFn,
  updateChecklistItemMutationFn,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ChecklistItemType } from "@/types/api.type";

export const ChecklistProgress = ({
  checklist,
}: {
  checklist?: ChecklistItemType[];
}) => {
  const total = checklist?.length || 0;
  if (total === 0) return null;
  const done = checklist!.filter((item) => item.completed).length;
  const percent = Math.round((done / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            done === total ? "bg-green-500" : "bg-blue-500"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {done}/{total}
      </span>
    </div>
  );
};

const TaskChecklist = ({
  taskId,
  checklist,
}: {
  taskId: string;
  checklist: ChecklistItemType[];
}) => {
  const workspaceId = useWorkspaceId();
  const invalidateTasks = useInvalidateTasks(workspaceId);
  const [text, setText] = useState("");

  const onError = (error: Error) => {
    invalidateTasks();
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  };

  const { mutate: addItem, isPending: isAdding } = useMutation({
    mutationFn: addChecklistItemMutationFn,
    onSuccess: () => {
      setText("");
      invalidateTasks();
    },
    onError,
  });

  const { mutate: updateItem } = useMutation({
    mutationFn: updateChecklistItemMutationFn,
    onSuccess: invalidateTasks,
    onError,
  });

  const { mutate: deleteItem } = useMutation({
    mutationFn: deleteChecklistItemMutationFn,
    onSuccess: invalidateTasks,
    onError,
  });

  const submit = () => {
    const value = text.trim();
    if (!value || isAdding) return;
    addItem({ workspaceId, taskId, text: value });
  };

  return (
    <div className="space-y-3">
      <ChecklistProgress checklist={checklist} />

      {checklist.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          Break this task into smaller steps.
        </p>
      )}

      <ul className="space-y-1">
        {checklist.map((item) => (
          <li
            key={item._id}
            className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted"
          >
            <Checkbox
              id={`check-${item._id}`}
              checked={item.completed}
              onCheckedChange={(value) =>
                updateItem({
                  workspaceId,
                  taskId,
                  itemId: item._id,
                  data: { completed: !!value },
                })
              }
            />
            <label
              htmlFor={`check-${item._id}`}
              className={cn(
                "flex-1 text-sm cursor-pointer break-words",
                item.completed && "line-through text-muted-foreground"
              )}
            >
              {item.text}
            </label>
            <button
              type="button"
              aria-label={`Delete "${item.text}"`}
              onClick={() =>
                deleteItem({ workspaceId, taskId, itemId: item._id })
              }
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Input
          value={text}
          maxLength={255}
          placeholder="Add an item"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button
          type="button"
          onClick={submit}
          disabled={!text.trim() || isAdding}
        >
          {isAdding ? <Loader className="animate-spin" /> : <Plus />}
          Add
        </Button>
      </div>
    </div>
  );
};

export default TaskChecklist;
