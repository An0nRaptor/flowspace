import { FC, useState } from "react";
import { getColumns } from "./table/columns";
import { DataTable } from "./table/table";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DataTableFacetedFilter } from "./table/table-faceted-filter";
import { priorities, statuses } from "./table/data";
import useTaskTableFilter from "@/hooks/use-task-table-filter";
import { useQuery } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getAllTasksQueryFn } from "@/lib/api";
import { TaskType } from "@/types/api.type";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useGetLabels from "@/hooks/api/use-get-labels";
import { labelDotClasses } from "@/constant";
import { cn } from "@/lib/utils";

type Filters = ReturnType<typeof useTaskTableFilter>[0];
type SetFilters = ReturnType<typeof useTaskTableFilter>[1];

interface DataTableFilterToolbarProps {
  isLoading?: boolean;
  projectId?: string;
  filters: Filters;
  setFilters: SetFilters;
  hideStatus?: boolean;
}

const TaskTable = () => {
  const param = useParams();
  const projectId = param.projectId as string;

  const workspaceId = useWorkspaceId();

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filters, setFilters] = useTaskTableFilter();
  const columns = getColumns(projectId);

  const { data, isLoading } = useQuery({
    queryKey: [
      "all-tasks",
      workspaceId,
      pageSize,
      pageNumber,
      filters,
      projectId,
    ],
    queryFn: () =>
      getAllTasksQueryFn({
        workspaceId,
        keyword: filters.keyword,
        priority: filters.priority,
        status: filters.status,
        projectId: projectId || filters.projectId,
        assignedTo: filters.assigneeId,
        labels: filters.labels,
        pageNumber,
        pageSize,
      }),
    staleTime: 0,
    enabled: !!workspaceId,
  });

  const tasks: TaskType[] = data?.tasks || [];
  const totalCount = data?.pagination.totalCount || 0;

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  // Handle page size changes
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageNumber(1);
  };

  return (
    <div className="w-full relative">
      <DataTable
        isLoading={isLoading}
        data={tasks}
        columns={columns}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pagination={{
          totalCount,
          pageNumber,
          pageSize,
        }}
        filtersToolbar={
          <DataTableFilterToolbar
            isLoading={isLoading}
            projectId={projectId}
            filters={filters}
            setFilters={(value) => {
              setPageNumber(1);
              return setFilters(value);
            }}
          />
        }
      />
    </div>
  );
};

export const DataTableFilterToolbar: FC<DataTableFilterToolbarProps> = ({
  isLoading,
  projectId,
  filters,
  setFilters,
  hideStatus = false,
}) => {
  const workspaceId = useWorkspaceId();

  //Workspace Projects
  const { data } = useGetProjectsInWorkspaceQuery({
    workspaceId,
    pageNumber: 1,
    pageSize: 100,
    skip: !!projectId,
  });

  const projectOptions =
    data?.projects?.map((project) => ({
      label: (
        <div className="flex items-center gap-1">
          <span>{project.emoji}</span>
          <span>{project.name}</span>
        </div>
      ),
      value: project._id,
    })) || [];

  // Workspace Memebers
  const { data: memberData } = useGetWorkspaceMembers(workspaceId);

  // Workspace Labels
  const { data: labelData } = useGetLabels(workspaceId);

  const labelOptions =
    labelData?.labels?.map((label) => ({
      label: (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              labelDotClasses[label.color]
            )}
          />
          <span>{label.name}</span>
        </div>
      ),
      value: label._id,
    })) || [];

  const assignees =
    memberData?.members?.map((member) => {
      const name = member.userId?.name || "Unknown";
      const initials = getAvatarFallbackText(name);
      const avatarColor = getAvatarColor(name);
      return {
        label: (
          <div className="flex items-center space-x-2">
            <Avatar className="h-7 w-7">
              <AvatarImage
                src={member.userId?.profilePicture || ""}
                alt={name}
              />
              <AvatarFallback className={avatarColor}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span>{name}</span>
          </div>
        ),
        value: member.userId._id,
      };
    }) || [];

  const handleFilterChange = (key: keyof Filters, values: string[]) => {
    setFilters({
      ...filters,
      [key]: values.length > 0 ? values.join(",") : null,
    });
  };

  return (
    <div className="flex flex-col lg:flex-row w-full items-start space-y-2 mb-2 lg:mb-0 lg:space-x-2  lg:space-y-0">
      <Input
        placeholder="Filter tasks..."
        value={filters.keyword || ""}
        onChange={(e) =>
          setFilters({
            keyword: e.target.value || null,
          })
        }
        className="h-8 w-full lg:w-[250px]"
      />
      {/* Status filter */}
      {!hideStatus && (
        <DataTableFacetedFilter
          title="Status"
          multiSelect={true}
          options={statuses}
          disabled={isLoading}
          selectedValues={filters.status?.split(",") || []}
          onFilterChange={(values) => handleFilterChange("status", values)}
        />
      )}

      {/* Priority filter */}
      <DataTableFacetedFilter
        title="Priority"
        multiSelect={true}
        options={priorities}
        disabled={isLoading}
        selectedValues={filters.priority?.split(",") || []}
        onFilterChange={(values) => handleFilterChange("priority", values)}
      />

      {/* Assigned To filter */}
      <DataTableFacetedFilter
        title="Assigned To"
        multiSelect={true}
        options={assignees}
        disabled={isLoading}
        selectedValues={filters.assigneeId?.split(",") || []}
        onFilterChange={(values) => handleFilterChange("assigneeId", values)}
      />

      {/* Labels filter */}
      {labelOptions.length > 0 && (
        <DataTableFacetedFilter
          title="Labels"
          multiSelect={true}
          options={labelOptions}
          disabled={isLoading}
          selectedValues={filters.labels?.split(",") || []}
          onFilterChange={(values) => handleFilterChange("labels", values)}
        />
      )}

      {!projectId && (
        <DataTableFacetedFilter
          title="Projects"
          multiSelect={false}
          options={projectOptions}
          disabled={isLoading}
          selectedValues={filters.projectId?.split(",") || []}
          onFilterChange={(values) => handleFilterChange("projectId", values)}
        />
      )}

      {Object.values(filters).some(
        (value) => value !== null && value !== ""
      ) && (
        <Button
          disabled={isLoading}
          variant="ghost"
          className="h-8 px-2 lg:px-3"
          onClick={() =>
            setFilters({
              keyword: null,
              status: null,
              priority: null,
              projectId: null,
              assigneeId: null,
              labels: null,
            })
          }
        >
          Reset
          <X />
        </Button>
      )}
    </div>
  );
};

export default TaskTable;
