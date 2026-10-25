import { getWorkspaceByIdQueryFn } from "@/lib/api";
import { WorkspaceByIdResponseType } from "@/types/api.type";
import { CustomError } from "@/types/custom-error-type";
import { useQuery } from "@tanstack/react-query";

const useGetWorkspaceQuery = (workspaceId: string) => {
  const query = useQuery<WorkspaceByIdResponseType, CustomError>({
    queryKey: ["workspace", workspaceId],
    queryFn: () => getWorkspaceByIdQueryFn(workspaceId),
    staleTime: 0,
    retry: 2,
    enabled: !!workspaceId,
  });

  return query;
};

export default useGetWorkspaceQuery;
