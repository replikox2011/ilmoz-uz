import * as React from "react";
import { AnimatePresence as _AnimatePresence } from "framer-motion";
import { useOutlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { PageTransition } from "../motion/Motion";
import { FloatingCopilot } from "../copilot/FloatingCopilot";
import { BottomNav } from "./BottomNav";
import { isPlatformAdmin } from "../../lib/access";

// Framer Motion v11 returns Element|undefined; TypeScript 4 JSX wants Element|null.
// Full type-erasure shim — safe because the runtime component is unchanged.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatePresence = _AnimatePresence as any as React.FC<{
  mode?: "sync" | "wait" | "popLayout";
  initial?: boolean;
  onExitComplete?: () => void;
  children?: React.ReactNode;
}>;

export function AppShell() {
  const { user, center } = useAuth();
  const location = useLocation();
  // Freeze the current route element so the exiting copy keeps its own content
  // instead of re-reading the (already changed) router context.
  const outlet = useOutlet();
  if (!user || !center) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={user.role} centerName={center.name} isadm={isPlatformAdmin(user)} ismod={user.ismod} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 pb-24 lg:pb-6">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={location.pathname}>
                {outlet}
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
      {location.pathname !== "/ai" && <FloatingCopilot />}
      <BottomNav role={user.role} />
    </div>
  );
}
