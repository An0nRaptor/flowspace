import { PermissionType } from "@/constant";
import { useAuthContext } from "@/context/auth-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: PermissionType
) => {
  const WithPermission = (props: P) => {
    const { user, hasPermission, isLoading, workspaceLoading } =
      useAuthContext();
    const navigate = useNavigate();
    const workspaceId = useWorkspaceId();

    const loading = isLoading || workspaceLoading;
    const allowed = !!user && hasPermission(requiredPermission);

    useEffect(() => {
      if (!loading && !allowed) {
        navigate(`/workspace/${workspaceId}`);
      }
    }, [loading, allowed, navigate, workspaceId]);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!allowed) return null;

    return <WrappedComponent {...props} />;
  };

  return WithPermission;
};

export default withPermission;
