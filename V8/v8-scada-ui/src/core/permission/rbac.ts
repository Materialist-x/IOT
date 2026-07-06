import { Role } from "../../types/domain";

export const rolePermissions: Record<Role, string[]> = {
  admin: [
    "dashboard:view",
    "architecture:view",
    "device:view",
    "device:add",
    "device:edit",
    "tag:view",
    "tag:edit",
    "history:view",
    "alarm:view",
    "alarm:ack",
    "scada:view",
    "scada:edit",
    "system:rbac"
  ],
  operator: [
    "dashboard:view",
    "architecture:view",
    "device:view",
    "tag:view",
    "tag:edit",
    "history:view",
    "alarm:view",
    "alarm:ack",
    "scada:view"
  ],
  viewer: [
    "dashboard:view",
    "architecture:view",
    "device:view",
    "tag:view",
    "history:view",
    "alarm:view",
    "scada:view"
  ]
};

export function getPermissionsByRoles(roles: Role[]): string[] {
  return Array.from(new Set(roles.flatMap((role) => rolePermissions[role] ?? [])));
}

export function can(role: Role, permissionKey: string): boolean {
  return rolePermissions[role]?.includes(permissionKey) ?? false;
}
