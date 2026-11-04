import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

// Refresh every view that shows tasks or task counts in this workspace.
const useInvalidateTasks = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
    queryClient.invalidateQueries({
      queryKey: ["workspace-analytics", workspaceId],
    });
    queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
    queryClient.invalidateQueries({ queryKey: ["task"] });
    queryClient.invalidateQueries({ queryKey: ["activities", workspaceId] });
  }, [queryClient, workspaceId]);
};

export default useInvalidateTasks;
