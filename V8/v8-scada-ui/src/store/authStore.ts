import { create } from "zustand";
import { getPermissionsByRoles } from "../core/permission/rbac";
import { Role, User } from "../types/domain";

type AuthState = {
  currentUser: User | null;
  permissions: string[];
  login: (username: string, role: Role, tenantId: string) => void;
  logout: () => void;
  hasPermission: (key: string) => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: loadCachedUser(),
  permissions: loadCachedUser()?.permissions ?? [],
  login: (username, role, tenantId) => {
    const roles = [role];
    const user: User = {
      userId: username,
      username,
      roles,
      role,
      permissions: getPermissionsByRoles(roles),
      tenantId
    };
    localStorage.setItem("v8:auth-user", JSON.stringify(user));
    set({ currentUser: user, permissions: user.permissions });
  },
  logout: () => {
    localStorage.removeItem("v8:auth-user");
    set({ currentUser: null, permissions: [] });
  },
  hasPermission: (key) => get().permissions.includes(key)
}));

function loadCachedUser(): User | null {
  try {
    const raw = localStorage.getItem("v8:auth-user");
    if (!raw) return null;
    const user = JSON.parse(raw) as User;
    return {
      ...user,
      roles: user.roles?.length ? user.roles : [user.role],
      permissions: getPermissionsByRoles(user.roles?.length ? user.roles : [user.role])
    };
  } catch {
    return null;
  }
}
