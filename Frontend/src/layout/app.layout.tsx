import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/auth-provider";
import { RealtimeProvider } from "@/context/realtime-provider";
import Asidebar from "@/components/asidebar/asidebar";
import Header from "@/components/header";
import CreateWorkspaceDialog from "@/components/workspace/create-workspace-dialog";
import CreateProjectDialog from "@/components/workspace/project/create-project-dialog";
import GlobalSearch from "@/components/search/global-search";
import TaskDeepLinkDialog from "@/components/workspace/task/task-deep-link-dialog";

const AppLayout = () => {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <SidebarProvider>
          <Asidebar />
          <SidebarInset className="overflow-x-hidden">
            <div className="w-full">
              <>
                <Header />
                <div className="px-3 lg:px-20 py-3">
                  <Outlet />
                </div>
              </>
              <CreateWorkspaceDialog />
              <CreateProjectDialog />
              <GlobalSearch />
              <TaskDeepLinkDialog />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
};

export default AppLayout;
