import * as React from "react";

const AdminRootContext = React.createContext<string>("/ilmoz-admin");

/** Base path of the admin console — "/" for isadm owners, "/ilmoz-admin" for moderators. */
export function AdminRootProvider({
  base,
  children,
}: {
  base: string;
  children: React.ReactNode;
}) {
  return (
    <AdminRootContext.Provider value={base}>{children}</AdminRootContext.Provider>
  );
}

/** Returns the base path prefix, e.g. "" or "/ilmoz-admin". Use to build links. */
export function useAdminBase(): string {
  return React.useContext(AdminRootContext);
}

/** Prepend the admin base to a relative path, e.g. adminPath("/centers") → "/ilmoz-admin/centers" or "/centers" */
export function useAdminPath(): (path: string) => string {
  const base = useAdminBase();
  return (path: string) => `${base}${path}`;
}
