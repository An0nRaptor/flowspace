import { createContext, useContext, useEffect } from "react";
import useAuth from "@/hooks/api/use-auth";
import { UserType, WorkspaceWithMembersType } from "@/types/api.type";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceQuery from "@/hooks/api/use-get-workspace";
import { useNavigate } from "react-router-dom";
import usePermissions from "@/hooks/use-permissions";
import { PermissionType } from "@/constant";

type AuthContextType = {
  user?: UserType;
  workspace?: WorkspaceWithMembersType;
  hasPermission: (permission: PermissionType) => boolean;
  error: unknown;
  isFetching: boolean;
  isLoading: boolean;
  workspaceLoading: boolean;
  refetchAuth: () => void;
  refetchWorkspace: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();

  const {
    data: authData,
    error: authError,
    isLoading,
    isFetching,
    refetch: refetchAuth,
  } = useAuth();

  const user = authData?.user;

  const {
    data: workspaceData,
    isLoading: workspaceLoading,
    error: workspaceError,
    refetch: refetchWorkspace,
  } = useGetWorkspaceQuery(workspaceId);

  const workspace = workspaceData?.workspace;

  const permissions = usePermissions(user, workspace);

  const hasPermission = (permission: PermissionType): boolean => {
    return permissions.includes(permission);
  };

  useEffect(() => {
    if (workspaceError) {
      if (workspaceError.errorCode === "ACCESS_UNAUTHORIZED") navigate("/");
    }
  }, [navigate, workspaceError]);

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        hasPermission,
        error: authError || workspaceError,
        isLoading,
        isFetching,
        workspaceLoading,
        refetchAuth,
        refetchWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useCurrentUserContext must be used within a AuthProvider");
  }
  return context;
};
