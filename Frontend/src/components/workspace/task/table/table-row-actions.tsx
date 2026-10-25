import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import { TaskType } from "@/types/api.type";
import { Permissions } from "@/constant";
import { useAuthContext } from "@/context/auth-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useInvalidateTasks from "@/hooks/api/use-invalidate-tasks";
import { deleteTaskMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import EditTaskDialog from "../edit-task-dialog";

interface DataTableRowActionsProps {
  row: Row<TaskType>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const [openDeleteDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const workspaceId = useWorkspaceId();
  const invalidateTasks = useInvalidateTasks(workspaceId);
  const { hasPermission } = useAuthContext();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteTaskMutationFn,
  });

  const taskId = row.original._id as string;
  const taskCode = row.original.taskCode;

  const canEdit = hasPermission(Permissions.EDIT_TASK);
  const canDelete = hasPermission(Permissions.DELETE_TASK);

  const handleConfirm = () => {
    mutate(
      { workspaceId, taskId },
      {
        onSuccess: (data) => {
          invalidateTasks();
          toast({
            title: "Success",
            description: data.message,
            variant: "success",
          });
          setOpenDialog(false);
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

  if (!canEdit && !canDelete) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {canEdit && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setOpenEditDialog(true)}
            >
              Edit Task
            </DropdownMenuItem>
          )}
          {canEdit && canDelete && <DropdownMenuSeparator />}
          {canDelete && (
            <DropdownMenuItem
              className="!text-destructive cursor-pointer"
              onClick={() => setOpenDialog(true)}
            >
              Delete Task
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTaskDialog
        task={row.original}
        isOpen={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
      />

      <ConfirmDialog
        isOpen={openDeleteDialog}
        isLoading={isPending}
        onClose={() => setOpenDialog(false)}
        onConfirm={handleConfirm}
        title="Delete Task"
        description={`Are you sure you want to delete ${taskCode}`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}
