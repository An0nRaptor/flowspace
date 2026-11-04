import { io, Socket } from "socket.io-client";
import { baseURL } from "./base-url";

export const SocketEvents = {
  WORKSPACE_JOIN: "workspace:join",
  TASK_CHANGED: "task:changed",
  PROJECT_CHANGED: "project:changed",
  LABEL_CHANGED: "label:changed",
  COMMENT_CHANGED: "comment:changed",
  ACTIVITY_NEW: "activity:new",
  NOTIFICATION_NEW: "notification:new",
} as const;

export type SocketPayload = {
  workspaceId?: string;
  projectId?: string | null;
  taskId?: string | null;
  actorId?: string;
};

// In dev the API is "/api" behind the Vite proxy, so the socket uses this
// origin. In production VITE_API_BASE_URL is a full URL to the backend.
const getSocketOrigin = () => {
  try {
    return new URL(baseURL).origin;
  } catch {
    return window.location.origin;
  }
};

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(getSocketOrigin(), {
      withCredentials: true,
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};
