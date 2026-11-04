import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle,
  LayoutDashboard,
  Loader,
  Moon,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Permissions, TaskStatusEnum } from "@/constant";
import { useAuthContext } from "@/context/auth-provider";
import { useTheme } from "@/context/theme-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGlobalSearch from "@/hooks/use-global-search";
import useDebounce from "@/hooks/use-debounce";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import { getAllTasksQueryFn } from "@/lib/api";
import { transformStatusEnum } from "@/lib/helper";

const GlobalSearch = () => {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const { hasPermission } = useAuthContext();
  const { theme, setTheme } = useTheme();
  const { open, setOpen, onClose } = useGlobalSearch();

  const [search, setSearch] = useState("");
  const keyword = useDebounce(search.trim(), 250);

  // Ctrl+K / Cmd+K anywhere in the app
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((value) => (value ? null : true));
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const { data: taskData, isFetching } = useQuery({
    queryKey: ["all-tasks", workspaceId, "search", keyword],
    queryFn: () =>
      getAllTasksQueryFn({
        workspaceId,
        keyword,
        pageNumber: 1,
        pageSize: 8,
      }),
    enabled: open && !!workspaceId && keyword.length > 0,
    staleTime: 0,
  });

  const { data: projectData } = useGetProjectsInWorkspaceQuery({
    workspaceId,
    pageNumber: 1,
    pageSize: 100,
    skip: !open,
  });

  const tasks = keyword ? taskData?.tasks || [] : [];
  const projects = (projectData?.projects || [])
    .filter((project) =>
      project.name.toLowerCase().includes(search.trim().toLowerCase())
    )
    .slice(0, 6);

  const pages = [
    {
      label: "Dashboard",
      url: `/workspace/${workspaceId}`,
      icon: LayoutDashboard,
    },
    {
      label: "Tasks",
      url: `/workspace/${workspaceId}/tasks`,
      icon: CheckCircle,
    },
    { label: "Members", url: `/workspace/${workspaceId}/members`, icon: Users },
    {
      label: "Activity",
      url: `/workspace/${workspaceId}/activity`,
      icon: Activity,
    },
    ...(hasPermission(Permissions.MANAGE_WORKSPACE_SETTINGS)
      ? [
          {
            label: "Settings",
            url: `/workspace/${workspaceId}/settings`,
            icon: Settings,
          },
        ]
      : []),
  ].filter((page) =>
    page.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  const go = (url: string) => {
    onClose();
    navigate(url);
  };

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search tasks, projects and pages..."
          />
          <CommandList className="max-h-[400px]">
            {isFetching && (
              <div className="flex justify-center py-3">
                <Loader className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!isFetching && (
              <CommandEmpty>No results for "{search}".</CommandEmpty>
            )}

            {tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {tasks.map((task) => (
                  <CommandItem
                    key={task._id}
                    value={`task-${task._id}`}
                    className="cursor-pointer"
                    onSelect={() =>
                      task.project &&
                      go(
                        `/workspace/${workspaceId}/project/${task.project._id}?task=${task._id}`
                      )
                    }
                  >
                    <span className="text-xs text-muted-foreground w-[72px] shrink-0">
                      {task.taskCode}
                    </span>
                    <span className="truncate flex-1">{task.title}</span>
                    <Badge
                      variant={TaskStatusEnum[task.status]}
                      className="shrink-0 uppercase border-0 text-[10px] px-1.5 py-0"
                    >
                      {transformStatusEnum(task.status)}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {projects.length > 0 && (
              <CommandGroup heading="Projects">
                {projects.map((project) => (
                  <CommandItem
                    key={project._id}
                    value={`project-${project._id}`}
                    className="cursor-pointer"
                    onSelect={() =>
                      go(`/workspace/${workspaceId}/project/${project._id}`)
                    }
                  >
                    <span>{project.emoji}</span>
                    <span className="truncate">{project.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {pages.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Go to">
                  {pages.map((page) => (
                    <CommandItem
                      key={page.url}
                      value={`page-${page.label}`}
                      className="cursor-pointer"
                      onSelect={() => go(page.url)}
                    >
                      <page.icon />
                      <span>{page.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {!search.trim() && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Actions">
                  <CommandItem
                    value="toggle-theme"
                    className="cursor-pointer"
                    onSelect={() => {
                      setTheme(isDark ? "light" : "dark");
                      onClose();
                    }}
                  >
                    {isDark ? <Sun /> : <Moon />}
                    <span>Switch to {isDark ? "light" : "dark"} mode</span>
                    <CommandShortcut>
                      {theme === "system" ? "System" : ""}
                    </CommandShortcut>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
