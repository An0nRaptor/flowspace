export const SocketEventEnum = {
  WORKSPACE_JOIN: "workspace:join",
  TASK_CHANGED: "task:changed",
  PROJECT_CHANGED: "project:changed",
  LABEL_CHANGED: "label:changed",
  COMMENT_CHANGED: "comment:changed",
  ACTIVITY_NEW: "activity:new",
  NOTIFICATION_NEW: "notification:new",
} as const;

export type SocketEventEnumType =
  (typeof SocketEventEnum)[keyof typeof SocketEventEnum];
