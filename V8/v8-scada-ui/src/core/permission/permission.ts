import { useAuthStore } from "../../store/authStore";

export function hasPermission(key: string): boolean {
  return useAuthStore.getState().hasPermission(key);
}

export function hasAnyPermission(keys: string[]): boolean {
  return keys.some((key) => hasPermission(key));
}

export function hasAllPermissions(keys: string[]): boolean {
  return keys.every((key) => hasPermission(key));
}
