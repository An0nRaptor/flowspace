import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AtSign, Bell, CalendarClock, Loader, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuthContext } from "@/context/auth-provider";
import {
  getNotificationsQueryFn,
  markAllNotificationsReadMutationFn,
  markNotificationReadMutationFn,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { NotificationType } from "@/types/api.type";

const typeIcons = {
  MENTION: AtSign,
  ASSIGNED: UserPlus,
  DUE_SOON: CalendarClock,
  OVERDUE: CalendarClock,
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotificationsQueryFn,
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const { mutate: markRead } = useMutation({
    mutationFn: markNotificationReadMutationFn,
    onSuccess: refresh,
  });
  const { mutate: markAllRead, isPending: isMarkingAll } = useMutation({
    mutationFn: markAllNotificationsReadMutationFn,
    onSuccess: refresh,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const openNotification = (notification: NotificationType) => {
    if (!notification.read) markRead(notification._id);
    setOpen(false);

    const base = `/workspace/${notification.workspace}`;
    if (notification.project && notification.task) {
      navigate(
        `${base}/project/${notification.project._id}?task=${notification.task._id}`
      );
    } else if (notification.project) {
      navigate(`${base}/project/${notification.project._id}`);
    } else {
      navigate(base);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label={`Notifications${
            unreadCount ? `, ${unreadCount} unread` : ""
          }`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-4 text-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={isMarkingAll}
              onClick={() => markAllRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {isLoading && (
            <Loader className="h-5 w-5 animate-spin mx-auto my-6" />
          )}
          {!isLoading && notifications.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              You're all caught up.
            </p>
          )}
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell;
            return (
              <button
                key={notification._id}
                type="button"
                onClick={() => openNotification(notification)}
                className={cn(
                  "w-full flex gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors border-b last:border-0",
                  !notification.read && "bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted",
                    notification.type === "OVERDUE" &&
                      "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm leading-snug">
                    {notification.actor && (
                      <span className="font-semibold">
                        {notification.actor.name}{" "}
                      </span>
                    )}
                    {notification.message}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {notification.project &&
                      `${notification.project.emoji} ${notification.project.name} · `}
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </span>
                {!notification.read && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
