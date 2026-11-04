import RoleModel from "../models/RolesPermission";
import { RolePermissions } from "../utils/rolePermission";

// Creates OWNER / ADMIN / MEMBER on a fresh database. Existing roles are
// left untouched, so their ids (referenced by members) never change.
export const ensureDefaultRolesService = async () => {
  for (const roleName in RolePermissions) {
    const role = roleName as keyof typeof RolePermissions;
    await RoleModel.updateOne(
      { name: role },
      { $setOnInsert: { name: role, permissions: RolePermissions[role] } },
      // The schema's permissions default reads `this.name`, which isn't
      // available during an upsert; the values are set explicitly above.
      { upsert: true, setDefaultsOnInsert: false }
    );
  }
};
