import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/context/auth-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getSocket, SocketEvents, SocketPayload } from "@/lib/socket";
import { toast } from "@/hooks/use-toast";

type RealtimeContextType = {
  isConnected: boolean;
};

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
});

// Keeps every open tab in sync: the server broadcasts what changed and
// we refetch the matching queries.
export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuthContext();
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onTaskChanged = (payload: SocketPayload) => {
      queryClient.invalidateQueries({
        queryKey: ["all-tasks", payload.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["workspace-analytics", payload.workspaceId],
      });
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      if (payload.taskId) {
        queryClient.invalidateQueries({ queryKey: ["task", payload.taskId] });
      }
    };

    const onProjectChanged = (payload: SocketPayload) => {
      queryClient.invalidateQueries({
        queryKey: ["allprojects", payload.workspaceId],
      });
      if (payload.projectId) {
        queryClient.invalidateQueries({
          queryKey: ["singleProject", payload.projectId],
        });
      }
    };

    const onLabelChanged = (payload: SocketPayload) => {
      queryClient.invalidateQueries({
        queryKey: ["labels", payload.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-tasks", payload.workspaceId],
      });
    };

    const onCommentChanged = (payload: SocketPayload) => {
      if (payload.taskId) {
        queryClient.invalidateQueries({
          queryKey: ["task-comments", payload.taskId],
        });
      }
    };

    const onActivity = (payload: SocketPayload) => {
      queryClient.invalidateQueries({
        queryKey: ["activities", payload.workspaceId],
      });
    };

    const onNotification = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "New notification",
        description: "Open the bell icon to see it.",
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(SocketEvents.TASK_CHANGED, onTaskChanged);
    socket.on(SocketEvents.PROJECT_CHANGED, onProjectChanged);
    socket.on(SocketEvents.LABEL_CHANGED, onLabelChanged);
    socket.on(SocketEvents.COMMENT_CHANGED, onCommentChanged);
    socket.on(SocketEvents.ACTIVITY_NEW, onActivity);
    socket.on(SocketEvents.NOTIFICATION_NEW, onNotification);
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(SocketEvents.TASK_CHANGED, onTaskChanged);
      socket.off(SocketEvents.PROJECT_CHANGED, onProjectChanged);
      socket.off(SocketEvents.LABEL_CHANGED, onLabelChanged);
      socket.off(SocketEvents.COMMENT_CHANGED, onCommentChanged);
      socket.off(SocketEvents.ACTIVITY_NEW, onActivity);
      socket.off(SocketEvents.NOTIFICATION_NEW, onNotification);
      socket.disconnect();
      setIsConnected(false);
    };
  }, [userId, queryClient]);

  // Join the open workspace's room (again after every reconnect).
  useEffect(() => {
    if (!isConnected || !workspaceId) return;
    getSocket().emit(SocketEvents.WORKSPACE_JOIN, workspaceId);
  }, [isConnected, workspaceId]);

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
