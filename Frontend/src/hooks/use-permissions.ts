import { PermissionType } from "@/constant";
import { UserType, WorkspaceWithMembersType } from "@/types/api.type";
import { useMemo } from "react";

const usePermissions = (
  user: UserType | undefined,
  workspace: WorkspaceWithMembersType | undefined
) => {
  const permissions = useMemo<PermissionType[]>(() => {
    if (!user || !workspace) return [];
    const member = workspace.members.find(
      (member) => member.userId === user._id
    );
    return member?.role.permissions || [];
  }, [user, workspace]);

  return permissions;
};

export default usePermissions;
