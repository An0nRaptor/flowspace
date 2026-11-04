import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LabelColorEnum,
  LabelColorEnumType,
  labelDotClasses,
} from "@/constant";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetLabels from "@/hooks/api/use-get-labels";
import { createLabelMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LabelType } from "@/types/api.type";
import LabelChip from "./label-chip";

const colors = Object.values(LabelColorEnum);

export const LabelColorPicker = ({
  value,
  onChange,
}: {
  value: LabelColorEnumType;
  onChange: (color: LabelColorEnumType) => void;
}) => (
  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Colour">
    {colors.map((color) => (
      <button
        key={color}
        type="button"
        role="radio"
        aria-checked={value === color}
        aria-label={color.toLowerCase()}
        onClick={() => onChange(color)}
        className={cn(
          "h-5 w-5 rounded-full ring-offset-2 ring-offset-background",
          labelDotClasses[color],
          value === color && "ring-2 ring-foreground"
        )}
      />
    ))}
  </div>
);

const LabelPicker = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetLabels(workspaceId);
  const labels = data?.labels || [];

  const [name, setName] = useState("");
  const [color, setColor] = useState<LabelColorEnumType>(LabelColorEnum.BLUE);

  const { mutate, isPending } = useMutation({
    mutationFn: createLabelMutationFn,
  });

  const selected = labels.filter((label) => value.includes(label._id));

  const toggle = (label: LabelType) => {
    onChange(
      value.includes(label._id)
        ? value.filter((id) => id !== label._id)
        : [...value, label._id]
    );
  };

  const createLabel = () => {
    const trimmed = name.trim();
    if (!trimmed || isPending) return;
    mutate(
      { workspaceId, data: { name: trimmed, color } },
      {
        onSuccess: (res: { label: LabelType }) => {
          queryClient.invalidateQueries({ queryKey: ["labels", workspaceId] });
          onChange([...value, res.label._id]);
          setName("");
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start h-auto min-h-9 py-1.5 font-normal"
        >
          {selected.length === 0 ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Tag className="h-4 w-4" />
              Add labels
            </span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {selected.map((label) => (
                <LabelChip key={label._id} label={label} />
              ))}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="max-h-[200px] overflow-y-auto p-1">
          {isLoading && (
            <Loader className="h-4 w-4 animate-spin mx-auto my-3" />
          )}
          {!isLoading && labels.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-3 text-center">
              No labels yet. Create one below.
            </p>
          )}
          {labels.map((label) => (
            <button
              key={label._id}
              type="button"
              onClick={() => toggle(label)}
              className="w-full flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  labelDotClasses[label.color]
                )}
              />
              <span className="flex-1 text-left truncate">{label.name}</span>
              {value.includes(label._id) && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
        <div className="border-t p-2 space-y-2">
          <div className="flex gap-1.5">
            <Input
              value={name}
              maxLength={30}
              placeholder="New label, e.g. Bug"
              className="h-8"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createLabel();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              className="h-8 px-2"
              disabled={!name.trim() || isPending}
              onClick={createLabel}
              aria-label="Create label"
            >
              {isPending ? <Loader className="animate-spin" /> : <Plus />}
            </Button>
          </div>
          <LabelColorPicker value={color} onChange={setColor} />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LabelPicker;
