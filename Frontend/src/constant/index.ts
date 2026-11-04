export const TaskStatusEnum = {
  BACKLOG: "BACKLOG",
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  DONE: "DONE",
} as const;

export const TaskPriorityEnum = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;
export type TaskStatusEnumType = keyof typeof TaskStatusEnum;
export type TaskPriorityEnumType = keyof typeof TaskPriorityEnum;

export const Permissions = {
  CREATE_WORKSPACE: "CREATE_WORKSPACE",
  DELETE_WORKSPACE: "DELETE_WORKSPACE",
  EDIT_WORKSPACE: "EDIT_WORKSPACE",
  MANAGE_WORKSPACE_SETTINGS: "MANAGE_WORKSPACE_SETTINGS",
  ADD_MEMBER: "ADD_MEMBER",
  CHANGE_MEMBER_ROLE: "CHANGE_MEMBER_ROLE",
  REMOVE_MEMBER: "REMOVE_MEMBER",
  CREATE_PROJECT: "CREATE_PROJECT",
  EDIT_PROJECT: "EDIT_PROJECT",
  DELETE_PROJECT: "DELETE_PROJECT",
  CREATE_TASK: "CREATE_TASK",
  EDIT_TASK: "EDIT_TASK",
  DELETE_TASK: "DELETE_TASK",
  VIEW_ONLY: "VIEW_ONLY",
} as const;

export type PermissionType = keyof typeof Permissions;

export const LabelColorEnum = {
  GRAY: "GRAY",
  RED: "RED",
  ORANGE: "ORANGE",
  YELLOW: "YELLOW",
  GREEN: "GREEN",
  BLUE: "BLUE",
  PURPLE: "PURPLE",
  PINK: "PINK",
} as const;

export type LabelColorEnumType = keyof typeof LabelColorEnum;

// Chip colours for labels, readable in light and dark mode.
export const labelColorClasses: Record<LabelColorEnumType, string> = {
  GRAY: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  RED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  ORANGE:
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  YELLOW:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  GREEN: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  BLUE: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  PURPLE:
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  PINK: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
};

export const labelDotClasses: Record<LabelColorEnumType, string> = {
  GRAY: "bg-gray-500",
  RED: "bg-red-500",
  ORANGE: "bg-orange-500",
  YELLOW: "bg-yellow-500",
  GREEN: "bg-green-500",
  BLUE: "bg-blue-500",
  PURPLE: "bg-purple-500",
  PINK: "bg-pink-500",
};
