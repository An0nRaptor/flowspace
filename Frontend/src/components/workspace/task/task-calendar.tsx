import { DragEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Permissions, TaskStatusEnum } from "@/constant";
import { useAuthContext } from "@/context/auth-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useTaskTableFilter from "@/hooks/use-task-table-filter";
import useInvalidateTasks from "@/hooks/api/use-invalidate-tasks";
import { editTaskMutationFn, getAllTasksQueryFn } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { AllTaskResponseType, TaskType } from "@/types/api.type";
import { DataTableFilterToolbar } from "./task-table";
import EditTaskDialog from "./edit-task-dialog";

const CALENDAR_PAGE_SIZE = 300;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusColors: Record<string, string> = {
  [TaskStatusEnum.BACKLOG]:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  [TaskStatusEnum.TODO]:
    "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  [TaskStatusEnum.IN_PROGRESS]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  [TaskStatusEnum.IN_REVIEW]:
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  [TaskStatusEnum.DONE]:
    "bg-green-100 text-green-700 line-through dark:bg-green-950 dark:text-green-300",
};

const TaskCalendar = () => {
  const param = useParams();
  const projectId = param.projectId as string;
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const invalidateTasks = useInvalidateTasks(workspaceId);
  const { hasPermission } = useAuthContext();
  const canEdit = hasPermission(Permissions.EDIT_TASK);

  const [filters, setFilters] = useTaskTableFilter();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const queryKey = [
    "all-tasks",
    workspaceId,
    "calendar",
    projectId,
    gridStart.toISOString(),
    filters,
  ];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getAllTasksQueryFn({
        workspaceId,
        keyword: filters.keyword,
        priority: filters.priority,
        status: filters.status,
        assignedTo: filters.assigneeId,
        labels: filters.labels,
        projectId: projectId || filters.projectId,
        dueFrom: gridStart.toISOString(),
        dueTo: gridEnd.toISOString(),
        pageNumber: 1,
        pageSize: CALENDAR_PAGE_SIZE,
      }),
    staleTime: 0,
    enabled: !!workspaceId,
  });

  const { mutate } = useMutation({
    mutationFn: editTaskMutationFn,
  });

  const tasks = data?.tasks || [];

  const reschedule = (task: TaskType, day: Date) => {
    if (!task.project) return;
    if (task.dueDate && isSameDay(new Date(task.dueDate), day)) return;

    const dueDate = startOfDay(day).toISOString();
    const previous = queryClient.getQueryData<AllTaskResponseType>(queryKey);
    queryClient.setQueryData<AllTaskResponseType>(queryKey, (old) =>
      old
        ? {
            ...old,
            tasks: old.tasks.map((t) =>
              t._id === task._id ? { ...t, dueDate } : t
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
          status: task.status,
          assignedTo: task.assignedTo?._id || null,
          dueDate,
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

  const handleDrop = (e: DragEvent<HTMLDivElement>, day: Date) => {
    e.preventDefault();
    setOverDay(null);
    const taskId = e.dataTransfer.getData("text/plain") || dragTaskId;
    const task = tasks.find((t) => t._id === taskId);
    setDragTaskId(null);
    if (task) reschedule(task, day);
  };

  return (
    <div className="w-full space-y-3">
      <DataTableFilterToolbar
        isLoading={isLoading}
        projectId={projectId}
        filters={filters}
        setFilters={setFilters}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{format(month, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(startOfMonth(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Previous month"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Next month"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Loader className="w-8 h-8 animate-spin place-self-center flex my-10" />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[720px] rounded-lg border overflow-hidden">
            <div className="grid grid-cols-7 bg-muted/50 border-b">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {weekday}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const key = day.toISOString();
                const dayTasks = tasks.filter(
                  (task) =>
                    task.dueDate && isSameDay(new Date(task.dueDate), day)
                );

                return (
                  <div
                    key={key}
                    onDragOver={(e) => {
                      if (!canEdit) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (overDay !== key) setOverDay(key);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setOverDay(null);
                      }
                    }}
                    onDrop={(e) => handleDrop(e, day)}
                    className={cn(
                      "min-h-[110px] border-b border-r p-1.5 space-y-1 transition-colors",
                      !isSameMonth(day, month) && "bg-muted/30",
                      overDay === key && "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                        isSameMonth(day, month)
                          ? "text-foreground"
                          : "text-muted-foreground",
                        isToday(day) &&
                          "bg-primary text-primary-foreground font-semibold"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1 max-h-[120px] overflow-y-auto">
                      {dayTasks.map((task) => (
                        <button
                          key={task._id}
                          type="button"
                          draggable={canEdit}
                          title={`${task.taskCode}: ${task.title}`}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", task._id);
                            e.dataTransfer.effectAllowed = "move";
                            setDragTaskId(task._id);
                          }}
                          onDragEnd={() => {
                            setDragTaskId(null);
                            setOverDay(null);
                          }}
                          onClick={() => canEdit && setEditingTask(task)}
                          className={cn(
                            "w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium",
                            statusColors[task.status],
                            canEdit && "cursor-grab active:cursor-grabbing",
                            dragTaskId === task._id && "opacity-40"
                          )}
                        >
                          {task.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Only tasks with a due date appear here.
        {canEdit && " Drag a task to another day to reschedule it."}
      </p>

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

export default TaskCalendar;
