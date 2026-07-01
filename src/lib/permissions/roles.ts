import type { OrderStatus, StaffRole } from "@/types/domain";
import { canTransitionStatus } from "@/lib/calculations/status";

export function canAccessSettings(role: StaffRole): boolean {
  return role === "admin";
}

export function canArchiveRecords(role: StaffRole): boolean {
  return role === "admin";
}

export function canChangeStatus(role: StaffRole, from: OrderStatus, to: OrderStatus): boolean {
  if (role === "admin") return from !== to;
  return canTransitionStatus(from, to);
}
