import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AnalyticsCard from "../common/analytics-card";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getProjectAnalyticsQueryFn } from "@/lib/api";

const ProjectAnalytics = () => {
  const param = useParams();
  const projectId = param.projectId as string;

  const workspaceId = useWorkspaceId();

  const { data, isPending } = useQuery({
    queryKey: ["project-analytics", projectId],
    queryFn: () => getProjectAnalyticsQueryFn({ workspaceId, projectId }),
    staleTime: 0,
    enabled: !!projectId,
  });

  const analytics = data?.analytics;

  const analyticsList = [
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
      {analyticsList?.map((v) => (
        <AnalyticsCard
          isLoading={isPending}
          title={v.title}
          value={v.value}
          key={v.id}
        />
      ))}
    </div>
  );
};

export default ProjectAnalytics;
