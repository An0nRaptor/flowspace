import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useTaskDetails from "@/hooks/use-task-details";
import { getTaskByIdQueryFn } from "@/lib/api";
import EditTaskDialog from "./edit-task-dialog";

// Opens /project/:projectId?task=<id> links from search and notifications.
const TaskDeepLinkDialog = () => {
  const { projectId } = useParams();
  const workspaceId = useWorkspaceId();
  const { taskId, onClose } = useTaskDetails();

  const { data, isError } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () =>
      getTaskByIdQueryFn({
        workspaceId,
        projectId: projectId as string,
        taskId: taskId as string,
      }),
    enabled: !!taskId && !!projectId && !!workspaceId,
    retry: false,
  });

  if (!taskId || !data?.task || isError) return null;

  return <EditTaskDialog task={data.task} isOpen={true} onClose={onClose} />;
};

export default TaskDeepLinkDialog;
