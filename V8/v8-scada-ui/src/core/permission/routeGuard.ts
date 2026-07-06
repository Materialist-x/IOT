import { RouteKey, findRoute } from "../../router/routes";
import { User } from "../../types/domain";

export type RouteDecision = {
  allowed: boolean;
  target: RouteKey | "403";
};

export function guardRoute(routeKey: RouteKey, user: User | null): RouteDecision {
  const route = findRoute(routeKey);
  if (!route) return { allowed: false, target: "403" };
  if (!user) return { allowed: false, target: "403" };
  if (!route.permission || user.permissions.includes(route.permission)) {
    return { allowed: true, target: routeKey };
  }
  return { allowed: false, target: "403" };
}
