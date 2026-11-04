import {
  LabelColorEnumType,
  PermissionType,
  TaskPriorityEnumType,
  TaskStatusEnumType,
} from "@/constant";

export type loginType = { email: string; password: string };
export type LoginResponseType = {
  message: string;
  user: {
    _id: string;
    currentWorkspace: string;
  };
};

export type registerType = {
  name: string;
  email: string;
  password: string;
};

// USER TYPE
export type UserType = {
  _id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  isActive: true;
  lastLogin: null;
  createdAt: Date;
  updatedAt: Date;
  currentWorkspace: {
    _id: string;
    name: string;
    owner: string;
    inviteCode: string;
  };
};

export type CurrentUserResponseType = {
  message: string;
  user: UserType;
};

//******** */ WORLSPACE TYPES ****************
// ******************************************
export type WorkspaceType = {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  inviteCode: string;
};

export type CreateWorkspaceType = {
  name: string;
  description: string;
};

export type EditWorkspaceType = {
  workspaceId: string;
  data: {
    name: string;
    description: string;
  };
};

export type CreateWorkspaceResponseType = {
  message: string;
  workspace: WorkspaceType;
};

export type AllWorkspaceResponseType = {
  message: string;
  workspaces: WorkspaceType[];
};

export type WorkspaceWithMembersType = WorkspaceType & {
  members: {
    _id: string;
    userId: string;
    workspaceId: string;
    role: {
      _id: string;
      name: string;
      permissions: PermissionType[];
    };
    joinedAt: string;
    createdAt: string;
  }[];
};

export type WorkspaceByIdResponseType = {
  message: string;
  workspace: WorkspaceWithMembersType;
};

export type ChangeWorkspaceMemberRoleType = {
  workspaceId: string;
  data: {
    roleId: string;
    memberId: string;
  };
};

export type AllMembersInWorkspaceResponseType = {
  message: string;
  members: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      profilePicture: string | null;
    };
    workspaceId: string;
    role: {
      _id: string;
      name: string;
    };
    joinedAt: string;
    createdAt: string;
  }[];
  roles: RoleType[];
};

export type AnalyticsResponseType = {
  message: string;
  analytics: {
    totalTasks: number;
    overdueTasks: number;
    completedTasks: number;
  };
};

export type PaginationType = {
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
  skip: number;
  limit: number;
};

export type RoleType = {
  _id: string;
  name: string;
};
// *********** MEMBER ****************

//******** */ PROJECT TYPES ****************
//****************************************** */
export type ProjectType = {
  _id: string;
  name: string;
  emoji: string;
  description: string;
  workspace: string;
  createdBy: {
    _id: string;
    name: string;
    profilePicture: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectPayloadType = {
  workspaceId: string;
  data: {
    emoji: string;
    name: string;
    description: string;
  };
};

export type ProjectResponseType = {
  message: "Project created successfully";
  project: ProjectType;
};

export type EditProjectPayloadType = {
  workspaceId: string;
  projectId: string;
  data: {
    emoji: string;
    name: string;
    description: string;
  };
};

//ALL PROJECTS IN WORKSPACE TYPE
export type AllProjectPayloadType = {
  workspaceId: string;
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  skip?: boolean;
};

export type AllProjectResponseType = {
  message: string;
  projects: ProjectType[];
  pagination: PaginationType;
};

// SINGLE PROJECT IN WORKSPACE TYPE
export type ProjectByIdPayloadType = {
  workspaceId: string;
  projectId: string;
};

//********** */ TASK TYPES ************************
//************************************************* */

export type CreateTaskPayloadType = {
  workspaceId: string;
  projectId: string;
  data: {
    title: string;
    description: string;
    priority: TaskPriorityEnumType;
    status: TaskStatusEnumType;
    assignedTo: string | null;
    dueDate?: string;
    labels?: string[];
  };
};

export type EditTaskPayloadType = {
  taskId: string;
  workspaceId: string;
  projectId: string;
  data: {
    title: string;
    description?: string;
    priority: TaskPriorityEnumType;
    status: TaskStatusEnumType;
    assignedTo: string | null;
    dueDate?: string;
    labels?: string[];
  };
};

export type TaskType = {
  _id: string;
  title: string;
  description?: string;
  project?: {
    _id: string;
    emoji: string;
    name: string;
  };
  priority: TaskPriorityEnumType;
  status: TaskStatusEnumType;
  assignedTo: {
    _id: string;
    name: string;
    profilePicture: string | null;
  } | null;
  createdBy?: string;
  dueDate: string | null;
  taskCode: string;
  labels?: LabelType[];
  checklist?: ChecklistItemType[];
  attachments?: AttachmentType[];
  createdAt?: string;
  updatedAt?: string;
};

export type AllTaskPayloadType = {
  workspaceId: string;
  projectId?: string | null;
  keyword?: string | null;
  priority?: string | null;
  status?: string | null;
  assignedTo?: string | null;
  dueDate?: string | null;
  labels?: string | null;
  dueFrom?: string | null;
  dueTo?: string | null;
  pageNumber?: number | null;
  pageSize?: number | null;
};

export type AllTaskResponseType = {
  message: string;
  tasks: TaskType[];
  pagination: PaginationType;
};

export type TaskByIdResponseType = {
  message: string;
  task: TaskType;
};

//********** */ LABEL, CHECKLIST, ATTACHMENT TYPES ****
//************************************************* */

export type LabelType = {
  _id: string;
  name: string;
  color: LabelColorEnumType;
};

export type AllLabelsResponseType = {
  message: string;
  labels: LabelType[];
};

export type CreateLabelPayloadType = {
  workspaceId: string;
  data: {
    name: string;
    color: LabelColorEnumType;
  };
};

export type ChecklistItemType = {
  _id: string;
  text: string;
  completed: boolean;
};

export type ChecklistResponseType = {
  message: string;
  checklist: ChecklistItemType[];
};

export type AttachmentType = {
  _id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedBy:
    | {
        _id: string;
        name: string;
        profilePicture: string | null;
      }
    | string;
  createdAt: string;
};

//********** */ COMMENT, ACTIVITY, NOTIFICATION TYPES ****
//************************************************* */

type UserSummaryType = {
  _id: string;
  name: string;
  profilePicture: string | null;
};

export type CommentType = {
  _id: string;
  content: string;
  task: string;
  author: UserSummaryType;
  mentions: { _id: string; name: string }[];
  createdAt: string;
};

export type AllCommentsResponseType = {
  message: string;
  comments: CommentType[];
};

export type CreateCommentPayloadType = {
  workspaceId: string;
  taskId: string;
  data: {
    content: string;
    mentions: string[];
  };
};

export type ActivityType = {
  _id: string;
  action: string;
  message: string;
  actor: UserSummaryType | null;
  project: { _id: string; name: string; emoji: string } | null;
  task: { _id: string; title: string; taskCode: string } | null;
  createdAt: string;
};

export type AllActivitiesPayloadType = {
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type AllActivitiesResponseType = {
  message: string;
  activities: ActivityType[];
  pagination: PaginationType;
};

export type NotificationType = {
  _id: string;
  type: "MENTION" | "ASSIGNED" | "DUE_SOON" | "OVERDUE";
  message: string;
  workspace: string;
  actor: UserSummaryType | null;
  project: { _id: string; name: string; emoji: string } | null;
  task: { _id: string; title: string; taskCode: string } | null;
  read: boolean;
  createdAt: string;
};

export type AllNotificationsResponseType = {
  message: string;
  notifications: NotificationType[];
  unreadCount: number;
};
