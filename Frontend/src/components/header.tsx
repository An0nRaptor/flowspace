import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Search } from "lucide-react";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGlobalSearch from "@/hooks/use-global-search";
import { useRealtime } from "@/context/realtime-provider";
import { cn } from "@/lib/utils";
import NotificationBell from "./notifications/notification-bell";
import ThemeToggle from "./theme-toggle";

const Header = () => {
  const location = useLocation();
  const workspaceId = useWorkspaceId();
  const { onOpen: openSearch } = useGlobalSearch();
  const { isConnected } = useRealtime();

  const pathname = location.pathname;

  const getPageLabel = (pathname: string) => {
    if (pathname.includes("/project/")) return "Project";
    if (pathname.includes("/settings")) return "Settings";
    if (pathname.includes("/tasks")) return "Tasks";
    if (pathname.includes("/members")) return "Members";
    if (pathname.includes("/activity")) return "Activity";
    return null; // Default label
  };

  const isMac = navigator.userAgent.includes("Mac");

  const pageHeading = getPageLabel(pathname);
  return (
    <header className="flex sticky top-0 z-50 bg-background h-12 shrink-0 items-center border-b">
      <div className="flex flex-1 items-center gap-2 px-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block text-[15px]">
              {pageHeading ? (
                <BreadcrumbLink asChild>
                  <Link to={`/workspace/${workspaceId}`}>Dashboard</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="line-clamp-1 ">
                  Dashboard
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>

            {pageHeading && (
              <>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="text-[15px]">
                  <BreadcrumbPage className="line-clamp-1">
                    {pageHeading}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-1 px-3">
        <Button
          variant="outline"
          size="sm"
          onClick={openSearch}
          className="h-8 gap-2 text-muted-foreground font-normal w-8 px-0 sm:w-[220px] sm:px-3 sm:justify-start"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-flex ml-auto h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        </Button>

        <span
          title={isConnected ? "Live updates on" : "Live updates off"}
          className="hidden md:flex items-center gap-1.5 px-2 text-xs text-muted-foreground"
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-gray-400"
            )}
          />
          {isConnected ? "Live" : "Offline"}
        </span>

        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
