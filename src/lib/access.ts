import { Role, User } from "../types";

/** Center staff — full management access within their own center. */
export function isStaff(role: Role): boolean {
  return role === "owner" || role === "director" || role === "administrator";
}

/** Only directors & owners may edit center identity (name, logo, currency, login page). */
export function canEditCenter(role: Role): boolean {
  return role === "owner" || role === "director";
}

/** Platform-level users (site owner / moderators) — may access the root domain ilmoz.uz. */
export function isPlatformUser(user: Pick<User, "isadm" | "ismod"> | null | undefined): boolean {
  return !!user && (!!user.isadm || !!user.ismod);
}

/**
 * A *genuine* Ilmoz platform admin lives on the "platform" pseudo-center
 * (created via /setupforadmin2011). A regular center owner that happens to
 * carry an `isadm` flag (e.g. from the old first-user bootstrap) is NOT one —
 * they belong to a real center and must see their tenant workspace, not the
 * admin console. Gate the admin console on this, not on `isadm` alone.
 */
export function isPlatformAdmin(user: Pick<User, "isadm" | "centerId"> | null | undefined): boolean {
  return !!user && !!user.isadm && user.centerId === "platform";
}
