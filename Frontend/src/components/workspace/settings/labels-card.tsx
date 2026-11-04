import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import { LabelColorEnum, LabelColorEnumType } from "@/constant";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetLabels from "@/hooks/api/use-get-labels";
import { createLabelMutationFn, deleteLabelMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { LabelType } from "@/types/api.type";
import LabelChip from "../label/label-chip";
import { LabelColorPicker } from "../label/label-picker";

const LabelsCard = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetLabels(workspaceId);
  const labels = data?.labels || [];

  const [name, setName] = useState("");
  const [color, setColor] = useState<LabelColorEnumType>(LabelColorEnum.BLUE);
  const [labelToDelete, setLabelToDelete] = useState<LabelType | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["labels", workspaceId] });
    queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
  };

  const onError = (error: Error) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  };

  const { mutate: createLabel, isPending: isCreating } = useMutation({
    mutationFn: createLabelMutationFn,
    onSuccess: () => {
      setName("");
      refresh();
    },
    onError,
  });

  const { mutate: deleteLabel, isPending: isDeleting } = useMutation({
    mutationFn: deleteLabelMutationFn,
    onSuccess: (res) => {
      refresh();
      setLabelToDelete(null);
      toast({
        title: "Success",
        description: res.message,
        variant: "success",
      });
    },
    onError,
  });

  const submit = () => {
    const value = name.trim();
    if (!value || isCreating) return;
    createLabel({ workspaceId, data: { name: value, color } });
  };

  return (
    <>
      <div className="w-full mb-8">
        <div className="mb-5 border-b">
          <h1
            className="text-[17px] tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1.5
           text-center sm:text-left"
          >
            Labels
          </h1>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Labels like Bug, Feature or Urgent help the team filter tasks.
          Deleting a label removes it from every task.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {!isLoading && labels.length === 0 && (
            <span className="text-sm text-muted-foreground">
              No labels yet.
            </span>
          )}
          {labels.map((label) => (
            <span
              key={label._id}
              className="inline-flex items-center gap-1 rounded-md border pl-1 pr-0.5 py-0.5"
            >
              <LabelChip label={label} />
              <button
                type="button"
                aria-label={`Delete label ${label.name}`}
                className="p-0.5 text-muted-foreground hover:text-destructive"
                onClick={() => setLabelToDelete(label)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Input
            value={name}
            maxLength={30}
            placeholder="New label name"
            className="sm:max-w-[240px]"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
          <LabelColorPicker value={color} onChange={setColor} />
          <Button
            type="button"
            disabled={!name.trim() || isCreating}
            onClick={submit}
            className="sm:ml-auto"
          >
            {isCreating ? <Loader className="animate-spin" /> : <Plus />}
            Add label
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!labelToDelete}
        isLoading={isDeleting}
        onClose={() => setLabelToDelete(null)}
        onConfirm={() =>
          labelToDelete &&
          deleteLabel({ workspaceId, labelId: labelToDelete._id })
        }
        title={`Delete "${labelToDelete?.name}" label`}
        description="It will be removed from all tasks. This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

export default LabelsCard;
