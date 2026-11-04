import API from "./axios-client";
import {
  AllActivitiesPayloadType,
  AllActivitiesResponseType,
  AllCommentsResponseType,
  AllLabelsResponseType,
  AllNotificationsResponseType,
  AttachmentType,
  ChecklistResponseType,
  CreateCommentPayloadType,
  CreateLabelPayloadType,
  TaskByIdResponseType,
  AllMembersInWorkspaceResponseType,
  AllProjectPayloadType,
  AllProjectResponseType,
  AllTaskPayloadType,
  AllTaskResponseType,
  AllWorkspaceResponseType,
  AnalyticsResponseType,
  ChangeWorkspaceMemberRoleType,
  CreateProjectPayloadType,
  CreateTaskPayloadType,
  CreateWorkspaceResponseType,
  CreateWorkspaceType,
  CurrentUserResponseType,
  EditProjectPayloadType,
  EditTaskPayloadType,
  EditWorkspaceType,
  LoginResponseType,
  loginType,
  ProjectByIdPayloadType,
  ProjectResponseType,
  registerType,
  WorkspaceByIdResponseType,
} from "@/types/api.type";

export const loginMutationFn = async (
  data: loginType
): Promise<LoginResponseType> => {
  const response = await API.post("/auth/login", data);

  return response.data;
};

export const registerMutationFn = async (data: registerType) => {
  const response = await API.post("/auth/register", data);
  return response.data;
};

export const demoLoginMutationFn = async (): Promise<LoginResponseType> => {
  // Building the sample workspace can take a few seconds on a cold server.
  const response = await API.post("/auth/demo", undefined, {
    timeout: 60000,
  });
  return response.data;
};

export const logoutMutationFn = async () => {
  await API.post("/auth/logout");
};

export const getCurrentUserQueryFn =
  async (): Promise<CurrentUserResponseType> => {
    const response = await API.get(`/user/current`);
    return response.data;
  };

//********* WORKSPACE ****************

export const getAllWorkspacesUserIsMemberQueryFn =
  async (): Promise<AllWorkspaceResponseType> => {
    const response = await API.get("/workspace/all");
    return response.data;
  };

export const getWorkspaceByIdQueryFn = async (
  workspaceId: string
): Promise<WorkspaceByIdResponseType> => {
  const response = await API.get(`/workspace/${workspaceId}`);
  return response.data;
};

export const createWorkspaceMutationFn = async (
  data: CreateWorkspaceType
): Promise<CreateWorkspaceResponseType> => {
  const response = await API.post(`/workspace/create/new`, data);
  return response.data;
};

export const editWorkspaceMutationFn = async ({
  workspaceId,
  data,
}: EditWorkspaceType) => {
  const response = await API.post(`/workspace/update/${workspaceId}`, data);
  return response.data;
};

export const getMembersInWorkspaceQueryFn = async (
  workspaceId: string
): Promise<AllMembersInWorkspaceResponseType> => {
  const response = await API.get(`/workspace/members/${workspaceId}`);
  return response.data;
};

export const getWorkspaceAnalyticsQueryFn = async (
  workspaceId: string
): Promise<AnalyticsResponseType> => {
  const response = await API.get(`/workspace/analytics/${workspaceId}`);
  return response.data;
};

export const changeWorkspaceMemberRoleMutationFn = async ({
  workspaceId,
  data,
}: ChangeWorkspaceMemberRoleType) => {
  const response = await API.post(
    `/workspace/change/member/role/${workspaceId}`,
    data
  );
  return response.data;
};

export const deleteWorkspaceMutationFn = async (
  workspaceId: string
): Promise<{
  message: string;
  currentWorkspace: string;
}> => {
  const response = await API.delete(`/workspace/delete/${workspaceId}`);
  return response.data;
};

//*******MEMBER ****************

export const invitedUserJoinWorkspaceMutationFn = async (
  inviteCode: string
): Promise<{
  message: string;
  workspaceId: string;
  role: string;
}> => {
  const response = await API.post(`/member/workspace/${inviteCode}/join`);
  return response.data;
};

//********* PROJECTS

export const createProjectMutationFn = async ({
  workspaceId,
  data,
}: CreateProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.post(
    `/project/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};

export const editProjectMutationFn = async ({
  projectId,
  workspaceId,
  data,
}: EditProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.put(
    `/project/${projectId}/workspace/${workspaceId}/update`,
    data
  );
  return response.data;
};

export const getProjectsInWorkspaceQueryFn = async ({
  workspaceId,
  pageSize = 10,
  pageNumber = 1,
}: AllProjectPayloadType): Promise<AllProjectResponseType> => {
  const response = await API.get(
    `/project/workspace/${workspaceId}/all?pageSize=${pageSize}&pageNumber=${pageNumber}`
  );
  return response.data;
};

export const getProjectByIdQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<ProjectResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}`
  );
  return response.data;
};

export const getProjectAnalyticsQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<AnalyticsResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspaceId/${workspaceId}/analytics`
  );
  return response.data;
};

export const deleteProjectMutationFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `/project/${projectId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

//*******TASKS ********************************

export const createTaskMutationFn = async ({
  workspaceId,
  projectId,
  data,
}: CreateTaskPayloadType) => {
  const response = await API.post(
    `/task/projects/${projectId}/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};

export const editTaskMutationFn = async ({
  taskId,
  projectId,
  workspaceId,
  data,
}: EditTaskPayloadType): Promise<{ message: string }> => {
  const response = await API.put(
    `/task/${taskId}/project/${projectId}/workspace/${workspaceId}/update`,
    data
  );
  return response.data;
};

export const getAllTasksQueryFn = async ({
  workspaceId,
  keyword,
  projectId,
  assignedTo,
  priority,
  status,
  dueDate,
  labels,
  dueFrom,
  dueTo,
  pageNumber,
  pageSize,
}: AllTaskPayloadType): Promise<AllTaskResponseType> => {
  const baseUrl = `/task/workspace/${workspaceId}/all`;

  const queryParams = new URLSearchParams();
  if (keyword) queryParams.append("keyword", keyword);
  if (projectId) queryParams.append("projectId", projectId);
  if (assignedTo) queryParams.append("assignedTo", assignedTo);
  if (priority) queryParams.append("priority", priority);
  if (status) queryParams.append("status", status);
  if (dueDate) queryParams.append("dueDate", dueDate);
  if (labels) queryParams.append("labels", labels);
  if (dueFrom) queryParams.append("dueFrom", dueFrom);
  if (dueTo) queryParams.append("dueTo", dueTo);
  if (pageNumber) queryParams.append("pageNumber", pageNumber.toString());
  if (pageSize) queryParams.append("pageSize", pageSize.toString());

  const url = queryParams.toString() ? `${baseUrl}?${queryParams}` : baseUrl;
  const response = await API.get(url);
  return response.data;
};

export const deleteTaskMutationFn = async ({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `/task/${taskId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

export const getTaskByIdQueryFn = async ({
  workspaceId,
  projectId,
  taskId,
}: {
  workspaceId: string;
  projectId: string;
  taskId: string;
}): Promise<TaskByIdResponseType> => {
  const response = await API.get(
    `/task/${taskId}/project/${projectId}/workspace/${workspaceId}`
  );
  return response.data;
};

//*******CHECKLIST ****************************

export const addChecklistItemMutationFn = async ({
  workspaceId,
  taskId,
  text,
}: {
  workspaceId: string;
  taskId: string;
  text: string;
}): Promise<ChecklistResponseType> => {
  const response = await API.post(
    `/task/${taskId}/workspace/${workspaceId}/checklist`,
    { text }
  );
  return response.data;
};

export const updateChecklistItemMutationFn = async ({
  workspaceId,
  taskId,
  itemId,
  data,
}: {
  workspaceId: string;
  taskId: string;
  itemId: string;
  data: { text?: string; completed?: boolean };
}): Promise<ChecklistResponseType> => {
  const response = await API.put(
    `/task/${taskId}/workspace/${workspaceId}/checklist/${itemId}`,
    data
  );
  return response.data;
};

export const deleteChecklistItemMutationFn = async ({
  workspaceId,
  taskId,
  itemId,
}: {
  workspaceId: string;
  taskId: string;
  itemId: string;
}): Promise<ChecklistResponseType> => {
  const response = await API.delete(
    `/task/${taskId}/workspace/${workspaceId}/checklist/${itemId}`
  );
  return response.data;
};

//*******ATTACHMENTS ****************************

export const uploadAttachmentMutationFn = async ({
  workspaceId,
  taskId,
  file,
}: {
  workspaceId: string;
  taskId: string;
  file: File;
}): Promise<{ message: string; attachment: AttachmentType }> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await API.post(
    `/task/${taskId}/workspace/${workspaceId}/attachments`,
    formData,
    { timeout: 60000 }
  );
  return response.data;
};

export const deleteAttachmentMutationFn = async ({
  workspaceId,
  taskId,
  attachmentId,
}: {
  workspaceId: string;
  taskId: string;
  attachmentId: string;
}): Promise<{ message: string }> => {
  const response = await API.delete(
    `/task/${taskId}/workspace/${workspaceId}/attachments/${attachmentId}`
  );
  return response.data;
};

// Plain URL (not axios) so the browser can download or preview the file.
export const getAttachmentUrl = ({
  workspaceId,
  taskId,
  attachmentId,
  inline = false,
}: {
  workspaceId: string;
  taskId: string;
  attachmentId: string;
  inline?: boolean;
}) =>
  `${
    API.defaults.baseURL
  }/task/${taskId}/workspace/${workspaceId}/attachments/${attachmentId}${
    inline ? "?inline=1" : ""
  }`;

//*******LABELS ********************************

export const getLabelsInWorkspaceQueryFn = async (
  workspaceId: string
): Promise<AllLabelsResponseType> => {
  const response = await API.get(`/label/workspace/${workspaceId}/all`);
  return response.data;
};

export const createLabelMutationFn = async ({
  workspaceId,
  data,
}: CreateLabelPayloadType) => {
  const response = await API.post(
    `/label/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};

export const deleteLabelMutationFn = async ({
  workspaceId,
  labelId,
}: {
  workspaceId: string;
  labelId: string;
}): Promise<{ message: string }> => {
  const response = await API.delete(
    `/label/${labelId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

//*******COMMENTS ********************************

export const getCommentsByTaskQueryFn = async ({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}): Promise<AllCommentsResponseType> => {
  const response = await API.get(
    `/comment/task/${taskId}/workspace/${workspaceId}`
  );
  return response.data;
};

export const createCommentMutationFn = async ({
  workspaceId,
  taskId,
  data,
}: CreateCommentPayloadType) => {
  const response = await API.post(
    `/comment/task/${taskId}/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};

export const deleteCommentMutationFn = async ({
  workspaceId,
  commentId,
}: {
  workspaceId: string;
  commentId: string;
}): Promise<{ message: string }> => {
  const response = await API.delete(
    `/comment/${commentId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

//*******ACTIVITY ********************************

export const getActivitiesQueryFn = async ({
  workspaceId,
  projectId,
  taskId,
  pageNumber = 1,
  pageSize = 20,
}: AllActivitiesPayloadType): Promise<AllActivitiesResponseType> => {
  const queryParams = new URLSearchParams();
  if (projectId) queryParams.append("projectId", projectId);
  if (taskId) queryParams.append("taskId", taskId);
  queryParams.append("pageNumber", pageNumber.toString());
  queryParams.append("pageSize", pageSize.toString());

  const response = await API.get(
    `/activity/workspace/${workspaceId}/all?${queryParams}`
  );
  return response.data;
};

//*******NOTIFICATIONS ********************************

export const getNotificationsQueryFn =
  async (): Promise<AllNotificationsResponseType> => {
    const response = await API.get(`/notification/all?pageSize=30`);
    return response.data;
  };

export const markNotificationReadMutationFn = async (
  notificationId: string
) => {
  const response = await API.put(`/notification/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsReadMutationFn = async () => {
  const response = await API.put(`/notification/read-all`);
  return response.data;
};
