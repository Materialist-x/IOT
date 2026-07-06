import { hasPermission } from "./permission";

export type PermissionMenuItem = {
  permission?: string;
  children?: PermissionMenuItem[];
};

export function filterMenu<T extends PermissionMenuItem>(menu: T[]): T[] {
  return menu
    .filter((item) => !item.permission || hasPermission(item.permission))
    .map((item) => ({
      ...item,
      children: item.children ? filterMenu(item.children) : item.children
    }));
}
