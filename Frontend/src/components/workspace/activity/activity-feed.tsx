import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRightLeft,
  CheckSquare,
  FolderPlus,
  FolderX,
  Loader,
  MessageSquare,
  Paperclip,
  Pencil,
  PlusCircle,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getActivitiesQueryFn } from "@/lib/api";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { cn } from "@/lib/utils";

const actionIcons: Record<string, typeof Pencil> = {
  TASK_CREATED: PlusCircle,
  TASK_UPDATED: Pencil,
  TASK_MOVED: ArrowRightLeft,
  TASK_ASSIGNED: UserPlus,
  TASK_DELETED: Trash2,
  COMMENT_ADDED: MessageSquare,
  CHECKLIST_COMPLETED: CheckSquare,
  ATTACHMENT_ADDED: Paperclip,
  PROJECT_CREATED: FolderPlus,
  PROJECT_DELETED: FolderX,
};

const PAGE_SIZE = 20;

const ActivityFeed = ({
  projectId,
  taskId,
  compact = false,
}: {
  projectId?: string;
  taskId?: string;
  compact?: boolean;
}) => {
  const workspaceId = useWorkspaceId();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["activities", workspaceId, projectId, taskId],
      queryFn: ({ pageParam }) =>
        getActivitiesQueryFn({
          workspaceId,
          projectId,
          taskId,
          pageNumber: pageParam,
          pageSize: compact ? 10 : PAGE_SIZE,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.pageNumber < lastPage.pagination.totalPages
          ? lastPage.pagination.pageNumber + 1
          : undefined,
      enabled: !!workspaceId,
    });

  const activities = data?.pages.flatMap((page) => page.activities) || [];

  if (isLoading) {
    return (
      <Loader className="w-6 h-6 animate-spin place-self-center flex my-6" />
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ol className="relative">
        {activities.map((activity, index) => {
          const name = activity.actor?.name || "Someone";
          const Icon = actionIcons[activity.action] || Pencil;
          const isLast = index === activities.length - 1;

          return (
            <li key={activity._id} className="relative flex gap-3 pb-4">
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute left-[15px] top-8 bottom-0 w-px bg-border"
                />
              )}
              <div className="relative shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.actor?.profilePicture || ""} />
                  <AvatarFallback
                    className={cn(getAvatarColor(name), "text-[11px]")}
                  >
                    {getAvatarFallbackText(name)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border bg-background">
                  <Icon className="h-2.5 w-2.5" />
                </span>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm leading-snug break-words">
                  <span className="font-semibold">{name}</span>{" "}
                  {activity.message}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {!compact &&
                    activity.project &&
                    `${activity.project.emoji} ${activity.project.name} · `}
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage && <Loader className="animate-spin" />}
          Load more
        </Button>
      )}
    </div>
  );
};

export default ActivityFeed;
