import { DragEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isPast, isToday } from "date-fns";
import { CalendarDays, Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Permissions,
  TaskPriorityEnum,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";
import { useAuthContext } from "@/context/auth-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useTaskTableFilter from "@/hooks/use-task-table-filter";
import useInvalidateTasks from "@/hooks/api/use-invalidate-tasks";
import { editTaskMutationFn, getAllTasksQueryFn } from "@/lib/api";
import {
  getAvatarColor,
  getAvatarFallbackText,
  transformStatusEnum,
} from "@/lib/helper";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { AllTaskResponseType, TaskType } from "@/types/api.type";
import { priorities, statuses } from "./table/data";
import { DataTableFilterToolbar } from "./task-table";
import EditTaskDialog from "./edit-task-dialog";
import { LabelChips } from "../label/label-chip";
import { ChecklistProgress } from "./details/task-checklist";

const BOARD_PAGE_SIZE = 200;

const TaskBoard = () => {
  const param = useParams();
  const projectId = param.projectId as string;
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const invalidateTasks = useInvalidateTasks(workspaceId);
  const { hasPermission } = useAuthContext();
  const canEdit = hasPermission(Permissions.EDIT_TASK);

  const [filters, setFilters] = useTaskTableFilter();
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatusEnumType | null>(null);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);

  // The board shows every status as a column, so the status filter is ignored.
  const queryKey = [
    "all-tasks",
    workspaceId,
    "board",
    projectId,
    filters.keyword,
    filters.priority,
    filters.assigneeId,
    filters.projectId,
    filters.labels,
  ];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getAllTasksQueryFn({
        workspaceId,
        keyword: filters.keyword,
        priority: filters.priority,
        assignedTo: filters.assigneeId,
        labels: filters.labels,
        projectId: projectId || filters.projectId,
        pageNumber: 1,
        pageSize: BOARD_PAGE_SIZE,
      }),
    staleTime: 0,
    enabled: !!workspaceId,
  });

  const { mutate } = useMutation({
    mutationFn: editTaskMutationFn,
  });

  const tasks = data?.tasks || [];
  const totalCount = data?.pagination.totalCount || 0;

  const moveTask = (task: TaskType, status: TaskStatusEnumType) => {
    if (task.status === status || !task.project) return;

    const previous = queryClient.getQueryData<AllTaskResponseType>(queryKey);
    queryClient.setQueryData<AllTaskResponseType>(queryKey, (old) =>
      old
        ? {
            ...old,
            tasks: old.tasks.map((t) =>
              t._id === task._id ? { ...t, status } : t
            ),
          }
        : old
    );

    mutate(
      {
        taskId: task._id,
        projectId: task.project._id,
        workspaceId,
        data: {
          title: task.title,
          description: task.description || undefined,
          priority: task.priority,
          status,
          assignedTo: task.assignedTo?._id || null,
          dueDate: task.dueDate || undefined,
        },
      },
      {
        onError: (error) => {
          queryClient.setQueryData(queryKey, previous);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
        onSettled: () => invalidateTasks(),
      }
    );
  };

  const handleDrop = (
    e: DragEvent<HTMLDivElement>,
    status: TaskStatusEnumType
  ) => {
    e.preventDefault();
    setOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain") || dragTaskId;
    const task = tasks.find((t) => t._id === taskId);
    setDragTaskId(null);
    if (task) moveTask(task, status);
  };

  return (
    <div className="w-full space-y-3">
      <DataTableFilterToolbar
        isLoading={isLoading}
        projectId={projectId}
        filters={filters}
        setFilters={setFilters}
        hideStatus
      />

      {totalCount > BOARD_PAGE_SIZE && (
        <p className="text-xs text-muted-foreground">
          Showing the {BOARD_PAGE_SIZE} newest of {totalCount} tasks. Use the
          filters or the table view to see the rest.
        </p>
      )}

      {isLoading ? (
        <Loader className="w-8 h-8 animate-spin place-self-center flex my-10" />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {statuses.map((column) => {
            const status = column.value as TaskStatusEnumType;
            const columnTasks = tasks.filter((t) => t.status === status);
            const Icon = column.icon;

            return (
              <div
                key={status}
                onDragOver={(e) => {
                  if (!canEdit) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (overColumn !== status) setOverColumn(status);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setOverColumn(null);
                  }
                }}
                onDrop={(e) => handleDrop(e, status)}
                className={cn(
                  "flex flex-col shrink-0 w-[272px] rounded-lg bg-muted/50 border transition-colors",
                  overColumn === status && "bg-muted border-foreground/40"
                )}
              >
                <div className="flex items-center justify-between px-3 py-2.5">
                  <Badge
                    variant={TaskStatusEnum[status]}
                    className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{column.label}</span>
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2 px-2 pb-3 min-h-[120px]">
                  {columnTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-md">
                      {canEdit ? "Drop tasks here" : "No tasks"}
                    </div>
                  )}
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      showProject={!projectId}
                      draggable={canEdit}
                      isDragging={dragTaskId === task._id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", task._id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragTaskId(task._id);
                      }}
                      onDragEnd={() => {
                        setDragTaskId(null);
                        setOverColumn(null);
                      }}
                      onClick={() => canEdit && setEditingTask(task)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
};

const TaskCard = ({
  task,
  showProject,
  draggable,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  task: TaskType;
  showProject: boolean;
  draggable: boolean;
  isDragging: boolean;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) => {
  const priority = priorities.find((p) => p.value === task.priority);
  const PriorityIcon = priority?.icon;
  const name = task.assignedTo?.name || "";
  const initials = getAvatarFallbackText(name);
  const avatarColor = getAvatarColor(name);

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue =
    !!dueDate &&
    isPast(dueDate) &&
    !isToday(dueDate) &&
    task.status !== TaskStatusEnum.DONE;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "rounded-md border bg-card p-3 shadow-sm space-y-2 select-none",
        draggable &&
          "cursor-grab active:cursor-grabbing hover:border-foreground/40",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground font-medium">
          {task.taskCode}
        </span>
        {priority && (
          <Badge
            variant={TaskPriorityEnum[task.priority]}
            className="flex w-auto px-1.5 py-0 gap-1 font-medium !shadow-none uppercase border-0 text-[10px]"
          >
            {PriorityIcon && <PriorityIcon className="h-3 w-3" />}
            {transformStatusEnum(task.priority)}
          </Badge>
        )}
      </div>

      <LabelChips labels={task.labels} />

      <p className="text-sm font-medium leading-snug break-words">
        {task.title}
      </p>

      <ChecklistProgress checklist={task.checklist} />

      {showProject && task.project && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{task.project.emoji}</span>
          <span className="truncate">{task.project.name}</span>
        </div>
      )}

      {(dueDate || name) && (
        <div className="flex items-center justify-between">
          {dueDate ? (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {format(dueDate, "MMM d")}
            </span>
          ) : (
            <span />
          )}
          {name && (
            <Avatar className="h-6 w-6" title={name}>
              <AvatarImage src={task.assignedTo?.profilePicture || ""} />
              <AvatarFallback className={cn(avatarColor, "text-[10px]")}>
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
