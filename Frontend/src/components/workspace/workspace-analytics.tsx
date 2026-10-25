import { useQuery } from "@tanstack/react-query";
import AnalyticsCard from "./common/analytics-card";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getWorkspaceAnalyticsQueryFn } from "@/lib/api";

const WorkspaceAnalytics = () => {
  const workspaceId = useWorkspaceId();

  const { data, isPending } = useQuery({
    queryKey: ["workspace-analytics", workspaceId],
    queryFn: () => getWorkspaceAnalyticsQueryFn(workspaceId),
    staleTime: 0,
    enabled: !!workspaceId,
  });

  const analytics = data?.analytics;

  const workspaceList = [
    {
      id: "total-task",
      title: "Total Task",
      value: analytics?.totalTasks || 0,
    },
    {
      id: "overdue-task",
      title: "Overdue Task",
      value: analytics?.overdueTasks || 0,
    },
    {
      id: "completed-task",
      title: "Completed Task",
      value: analytics?.completedTasks || 0,
    },
  ];

  return (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {workspaceList?.map((v) => (
        <AnalyticsCard
          key={v.id}
          isLoading={isPending}
          title={v.title}
          value={v.value}
        />
      ))}
    </div>
  );
};

export default WorkspaceAnalytics;
