import { getLabelsInWorkspaceQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useGetLabels = (workspaceId: string) => {
  const query = useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => getLabelsInWorkspaceQueryFn(workspaceId),
    staleTime: Infinity,
    enabled: !!workspaceId,
  });
  return query;
};

export default useGetLabels;
