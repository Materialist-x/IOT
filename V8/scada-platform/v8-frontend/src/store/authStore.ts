import { reactive } from "vue";
import type { PageKey } from "../App.vue";

export type RoleKey = "admin" | "operator" | "viewer";

export type UserAccount = {
  username: string;
  password: string;
  role: RoleKey;
  menus: PageKey[];
};

export type MenuItem = {
  page: PageKey;
  label: string;
  icon: string;
};

export const menuItems: MenuItem[] = [
  { page: "dashboard", label: "\u9996\u9875", icon: "\u2302" },
  { page: "device", label: "\u8bbe\u5907\u7ba1\u7406", icon: "\u25a3" },
  { page: "tags", label: "Tag \u76d1\u63a7", icon: "\u25a5" },
  { page: "alarm", label: "\u544a\u8b66\u89c4\u5219", icon: "\u25b3" },
  { page: "license", label: "License", icon: "\u25ce" },
  { page: "settings", label: "\u6743\u9650\u7ba1\u7406", icon: "\u25c7" },
  { page: "runtime", label: "\u5b9e\u65f6\u76d1\u63a7", icon: "\u25c9" },
  { page: "faults", label: "\u6545\u969c\u65e5\u5fd7", icon: "\u26a0" },
  { page: "historian", label: "\u5386\u53f2\u6570\u636e", icon: "\u25a4" }
];

const defaultMenus: Record<RoleKey, PageKey[]> = {
  admin: ["dashboard", "device", "tags", "alarm", "license", "settings", "runtime", "faults", "historian"],
  operator: ["dashboard", "device", "tags", "alarm", "runtime", "faults", "historian"],
  viewer: ["dashboard", "tags", "runtime", "faults", "historian"]
};

const defaultUsers: UserAccount[] = [
  { username: "admin", password: "admin123", role: "admin", menus: [...defaultMenus.admin] },
  { username: "operator", password: "123456", role: "operator", menus: [...defaultMenus.operator] },
  { username: "viewer", password: "123456", role: "viewer", menus: [...defaultMenus.viewer] }
];

export const authStore = reactive({
  currentUser: "",
  role: "admin" as RoleKey,
  users: loadUsers(),

  login(username: string, password: string) {
    const user = this.users.find((item) => item.username === username && item.password === password);
    if (!user) {
      throw new Error("\u8d26\u53f7\u6216\u5bc6\u7801\u9519\u8bef");
    }
    this.currentUser = user.username;
    this.role = user.role;
    localStorage.setItem("v8-user", JSON.stringify({ username: user.username }));
  },

  logout() {
    this.currentUser = "";
    localStorage.removeItem("v8-user");
  },

  currentAccount(): UserAccount | undefined {
    return this.users.find((item) => item.username === this.currentUser);
  },

  canOpen(page: PageKey) {
    return this.currentAccount()?.menus.includes(page) ?? false;
  },

  visibleMenus() {
    return menuItems.filter((item) => this.canOpen(item.page));
  },

  addUser(username: string, password: string, role: RoleKey) {
    if (!username || !password) {
      throw new Error("\u8bf7\u8f93\u5165\u7528\u6237\u540d\u548c\u5bc6\u7801");
    }
    if (this.users.some((item) => item.username === username)) {
      throw new Error("\u7528\u6237\u5df2\u5b58\u5728");
    }
    this.users = [...this.users, { username, password, role, menus: [...defaultMenus[role]] }];
    saveUsers(this.users);
  },

  setPassword(username: string, password: string) {
    this.users = this.users.map((user) => user.username === username ? { ...user, password } : user);
    saveUsers(this.users);
  },

  toggleUserMenu(username: string, page: PageKey) {
    this.users = this.users.map((user) => {
      if (user.username !== username) return user;
      if (user.menus.includes(page)) {
        if (page === "dashboard") return user;
        return { ...user, menus: user.menus.filter((item) => item !== page) };
      }
      return { ...user, menus: [...user.menus, page] };
    });
    saveUsers(this.users);
  }
});

const cachedUser = localStorage.getItem("v8-user");
if (cachedUser) {
  try {
    const user = JSON.parse(cachedUser) as { username: string };
    const account = authStore.users.find((item) => item.username === user.username);
    if (account) {
      authStore.currentUser = account.username;
      authStore.role = account.role;
    }
  } catch {
    localStorage.removeItem("v8-user");
  }
}

function loadUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem("v8-users");
    return raw ? (JSON.parse(raw) as UserAccount[]).map(normalizeUser) : defaultUsers;
  } catch {
    return defaultUsers;
  }
}

function saveUsers(users: UserAccount[]): void {
  localStorage.setItem("v8-users", JSON.stringify(users));
}

function normalizeUser(user: UserAccount): UserAccount {
  const menus = (user.menus as string[]).map((page) => page === "history" ? "historian" : page)
    .filter((page): page is PageKey => menuItems.some((item) => item.page === page));

  return {
    ...user,
    menus: menus.length > 0 ? Array.from(new Set(["dashboard", ...menus])) : [...defaultMenus[user.role]]
  };
}
