import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Pencil,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getTaskByIdQueryFn } from "@/lib/api";
import { TaskType } from "@/types/api.type";
import CreateTaskForm from "./create-task-form";
import TaskChecklist from "./details/task-checklist";
import TaskComments from "./details/task-comments";
import TaskAttachments from "./details/task-attachments";
import ActivityFeed from "../activity/activity-feed";

const EditTaskDialog = (props: {
  task: TaskType;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "details" | "checklist" | "comments" | "files" | "activity";
}) => {
  const { task, isOpen, onClose, defaultTab = "details" } = props;
  const workspaceId = useWorkspaceId();
  const projectId = task.project?._id;

  // The list only has a summary; load the full task for checklist and files.
  const { data } = useQuery({
    queryKey: ["task", task._id],
    queryFn: () =>
      getTaskByIdQueryFn({
        workspaceId,
        projectId: projectId as string,
        taskId: task._id,
      }),
    enabled: isOpen && !!projectId && !!workspaceId,
  });

  const fullTask = data?.task || task;
  const checklist = fullTask.checklist || [];
  const attachments = fullTask.attachments || [];
  const doneCount = checklist.filter((item) => item.completed).length;

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto my-5 border-0">
        {isOpen && (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="mb-3 flex w-full justify-start overflow-x-auto">
              <TabsTrigger value="details" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Details
              </TabsTrigger>
              <TabsTrigger value="checklist" className="gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" />
                Checklist
                {checklist.length > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {doneCount}/{checklist.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Files
                {attachments.length > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {attachments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <CreateTaskForm task={fullTask} onClose={onClose} />
            </TabsContent>
            <TabsContent value="checklist">
              <TaskHeading task={fullTask} />
              <TaskChecklist taskId={task._id} checklist={checklist} />
            </TabsContent>
            <TabsContent value="comments">
              <TaskHeading task={fullTask} />
              <TaskComments taskId={task._id} />
            </TabsContent>
            <TabsContent value="files">
              <TaskHeading task={fullTask} />
              <TaskAttachments taskId={task._id} attachments={attachments} />
            </TabsContent>
            <TabsContent value="activity">
              <TaskHeading task={fullTask} />
              <ActivityFeed taskId={task._id} compact />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

const TaskHeading = ({ task }: { task: TaskType }) => (
  <div className="mb-4 pb-2 border-b">
    <p className="text-xs text-muted-foreground">{task.taskCode}</p>
    <h2 className="text-lg font-semibold leading-snug break-words">
      {task.title}
    </h2>
  </div>
);

export default EditTaskDialog;
