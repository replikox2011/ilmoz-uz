import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Protected, BootScreen } from "./components/layout/Protected";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { SetupCenterPage } from "./pages/onboarding/SetupCenterPage";
import { VerifyPhonePage } from "./pages/auth/VerifyPhonePage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { GroupsPage } from "./pages/groups/GroupsPage";
import { GroupDetailPage } from "./pages/groups/GroupDetailPage";
import { StudentsPage } from "./pages/students/StudentsPage";
import { StudentProfilePage } from "./pages/students/StudentProfilePage";
import { TeachersPage } from "./pages/teachers/TeachersPage";
import { SchedulePage } from "./pages/schedule/SchedulePage";
import { TestsPage } from "./pages/tests/TestsPage";
import { FinancePage } from "./pages/finance/FinancePage";
import { AnalyticsPage } from "./pages/analytics/AnalyticsPage";
import { CopilotPage } from "./pages/ai/CopilotPage";
import { ChildrenPage } from "./pages/children/ChildrenPage";
import { NotificationsPage } from "./pages/notifications/NotificationsPage";
import { UsersPage } from "./pages/users/UsersPage";
import { CoursesPage } from "./pages/courses/CoursesPage";
import { CourseDetailPage } from "./pages/courses/CourseDetailPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { AdminLayout } from "./pages/ilmoz-admin/AdminLayout";
import { AdminDashboardPage } from "./pages/ilmoz-admin/AdminDashboardPage";
import { AdminOrganizationsPage } from "./pages/ilmoz-admin/AdminOrganizationsPage";
import { AdminCenterDetailPage } from "./pages/ilmoz-admin/AdminCenterDetailPage";
import { AdminUsersPage } from "./pages/ilmoz-admin/AdminUsersPage";
import { AdminSubdomainsPage } from "./pages/ilmoz-admin/AdminSubdomainsPage";
import { AdminAnalyticsPage } from "./pages/ilmoz-admin/AdminAnalyticsPage";
import { AdminAiPage } from "./pages/ilmoz-admin/AdminAiPage";
import { AdminSubscriptionsPage } from "./pages/ilmoz-admin/AdminSubscriptionsPage";
import { AdminPaymentsPage } from "./pages/ilmoz-admin/AdminPaymentsPage";
import { AdminSupportPage } from "./pages/ilmoz-admin/AdminSupportPage";
import { AdminMarketingPage } from "./pages/ilmoz-admin/AdminMarketingPage";
import { AdminModeratorsPage } from "./pages/ilmoz-admin/AdminModeratorsPage";
import { AdminLogsPage } from "./pages/ilmoz-admin/AdminLogsPage";
import { AdminFlagsPage } from "./pages/ilmoz-admin/AdminFlagsPage";
import { AdminVersionsPage } from "./pages/ilmoz-admin/AdminVersionsPage";
import { AdminMaintenancePage } from "./pages/ilmoz-admin/AdminMaintenancePage";
import { AdminSecurityPage } from "./pages/ilmoz-admin/AdminSecurityPage";
import { AdminSettingsPage } from "./pages/ilmoz-admin/AdminSettingsPage";
import { CustomizeLoginPage } from "./pages/onboarding/CustomizeLoginPage";
import { SetupAdminPage } from "./pages/admin/SetupAdminPage";
import { LandingPage } from "./pages/landing/LandingPage";
import { AdminRootProvider } from "./pages/ilmoz-admin/AdminRootContext";
import { buildSubdomainUrl } from "./lib/subdomain";
import { isPlatformAdmin } from "./lib/access";
import { Logo } from "./components/ui/Logo";
import { Avatar } from "./components/ui/Avatar";

// ── Route guards ───────────────────────────────────────────────────────────────

/**
 * Shown on the root domain for regular center users (not isadm / ismod).
 * Tells them they're in the wrong place and offers a one-click redirect.
 */
function GoToCenterPage() {
  const { user, center, logoutToMain } = useAuth();

  const handleGoToCenter = () => {
    if (center?.subdomain) {
      window.location.href = buildSubdomainUrl(center.subdomain) + "/";
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <Logo size={48} showText={false} />

        <div className="space-y-1">
          <p className="text-lg font-semibold text-white">
            Вы вошли как{" "}
            <span className="text-brand-300">{user?.name}</span>
          </p>
          {center && (
            <p className="text-sm text-white/50">
              Учебный центр:{" "}
              <span className="text-white/80 font-medium">{center.name}</span>
            </p>
          )}
        </div>

        <p className="text-sm text-white/40">
          Эта страница — главный сайт платформы. Ваш воркспейс находится на
          странице вашего учебного центра.
        </p>

        <div className="flex w-full flex-col gap-3">
          {center?.subdomain ? (
            <button
              onClick={handleGoToCenter}
              className="w-full rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98]"
            >
              Перейти в {center.name} →
            </button>
          ) : (
            <p className="text-xs text-white/30">
              Субдомен не настроен. Обратитесь к администратору центра.
            </p>
          )}

          <button
            onClick={logoutToMain}
            className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white/80"
          >
            Выйти из аккаунта
          </button>
        </div>

        {user && (
          <div className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-2">
            <Avatar name={user.name} color={user.avatarColor} size="sm" />
            <div className="text-left">
              <p className="text-xs font-medium text-white/70">{user.name}</p>
              <p className="text-[11px] text-white/35">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LandingRoute() {
  const { fbUser, loading, activeSubdomain } = useAuth();
  if (loading) return <BootScreen />;

  // If on a subdomain, there is no landing page. Redirect to dashboard or login.
  if (activeSubdomain) {
    return <Navigate to={fbUser ? "/" : "/login"} replace />;
  }

  // Authenticated users skip the marketing page and go straight to the app.
  if (fbUser) return <Navigate to="/" replace />;
  return <LandingPage />;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { fbUser, loading, needsCenterSetup, needsPhoneVerification } = useAuth();
  if (loading) return <BootScreen />;
  if (fbUser && needsPhoneVerification) return <Navigate to="/verify-phone" replace />;
  if (fbUser && !needsCenterSetup) return <Navigate to="/" replace />;
  if (fbUser && needsCenterSetup) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}

function SetupOnly({ children }: { children: React.ReactNode }) {
  const { fbUser, loading, needsCenterSetup } = useAuth();
  if (loading) return <BootScreen />;
  if (!fbUser) return <Navigate to="/login" replace />;
  if (!needsCenterSetup) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function VerifyOnly({ children }: { children: React.ReactNode }) {
  const { fbUser, loading, needsPhoneVerification } = useAuth();
  if (loading) return <BootScreen />;
  if (!fbUser) return <Navigate to="/login" replace />;
  if (!needsPhoneVerification) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Subdomain → center Dashboard.
 * Root domain:
 *   isadm  → admin console mounted at "/" (no redirect needed, already here)
 *   ismod  → redirect to /ilmoz-admin
 *   others → "go to your center" prompt
 */
function HomeRoute() {
  const { activeSubdomain, user } = useAuth();
  if (activeSubdomain) return <DashboardPage />;
  if (isPlatformAdmin(user)) return <AdminDashboardPage />;
  if (user?.ismod) return <Navigate to="/ilmoz-admin" replace />;
  return <GoToCenterPage />;
}

/**
 * Root layout switch:
 *  isadm  → AdminLayout (no sidebar/topbar from AppShell)
 *  others → Protected > AppShell
 */
function RootShell() {
  const { user, fbUser, loading, activeSubdomain } = useAuth();
  if (loading) return <BootScreen />;
  if (isPlatformAdmin(user) && !activeSubdomain) {
    return (
      <AdminRootProvider base="">
        <AdminLayout />
      </AdminRootProvider>
    );
  }
  // Regular center users on root domain — show the "go to your center" screen,
  // not the full AppShell workspace.
  if (fbUser && !activeSubdomain && user && !isPlatformAdmin(user) && !user.ismod) {
    return <GoToCenterPage />;
  }
  return <Protected><AppShell /></Protected>;
}

// Accessible when logged in + center exists; does NOT redirect to subdomain.
// Used only for the post-registration login-page customizer step.
function CustomizeOnly({ children }: { children: React.ReactNode }) {
  const { fbUser, center, loading } = useAuth();
  if (loading) return <BootScreen />;
  if (!fbUser) return <Navigate to="/login" replace />;
  if (!center) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isadm && !user.ismod) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Dynamic route dispatchers to handle path conflicts between Center and Platform layouts
function AnalyticsRoute() {
  const { activeSubdomain, user } = useAuth();
  const isPlatform = (isPlatformAdmin(user) || user?.ismod) && !activeSubdomain;
  if (isPlatform) {
    return <AdminAnalyticsPage />;
  }
  return <AnalyticsPage />;
}

function AiRoute() {
  const { activeSubdomain, user } = useAuth();
  const isPlatform = (isPlatformAdmin(user) || user?.ismod) && !activeSubdomain;
  if (isPlatform) {
    return <AdminAiPage />;
  }
  return <CopilotPage />;
}

function SettingsRoute() {
  const { activeSubdomain, user } = useAuth();
  const isPlatform = (isPlatformAdmin(user) || user?.ismod) && !activeSubdomain;
  if (isPlatform) {
    return <AdminSettingsPage />;
  }
  return <SettingsPage />;
}

function UsersRoute() {
  const { activeSubdomain, user } = useAuth();
  const isPlatform = (isPlatformAdmin(user) || user?.ismod) && !activeSubdomain;
  if (isPlatform) {
    return <AdminUsersPage />;
  }
  return <UsersPage />;
}

// Shared admin page routes — used under both "/" (isadm) and "/ilmoz-admin" (ismod)
const adminRoutes = (
  <>
    <Route path="centers" element={<AdminOrganizationsPage />} />
    <Route path="centers/:centerId" element={<AdminCenterDetailPage />} />
    <Route path="subdomains" element={<AdminSubdomainsPage />} />
    <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
    <Route path="payments" element={<AdminPaymentsPage />} />
    <Route path="support" element={<AdminSupportPage />} />
    <Route path="marketing" element={<AdminMarketingPage />} />
    <Route path="moderators" element={<AdminModeratorsPage />} />
    <Route path="logs" element={<AdminLogsPage />} />
    <Route path="flags" element={<AdminFlagsPage />} />
    <Route path="versions" element={<AdminVersionsPage />} />
    <Route path="maintenance" element={<AdminMaintenancePage />} />
    <Route path="security" element={<AdminSecurityPage />} />
  </>
);

// =============================================================================
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Auth ── */}
        <Route path="/login"    element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
        <Route path="/setup"    element={<SetupOnly><SetupCenterPage /></SetupOnly>} />
        <Route path="/verify-phone" element={<VerifyOnly><VerifyPhonePage /></VerifyOnly>} />
        <Route path="/onboarding/customize" element={<CustomizeOnly><CustomizeLoginPage /></CustomizeOnly>} />
        <Route path="/setupforadmin2011" element={<SetupAdminPage />} />
        <Route path="/landing" element={<LandingRoute />} />

        {/* ── Root shell — isadm gets AdminLayout, everyone else gets AppShell ── */}
        <Route path="/" element={<RootShell />}>
          {adminRoutes}
          <Route index element={<HomeRoute />} />
          <Route path="users"         element={<UsersRoute />} />
          <Route path="groups"        element={<GroupsPage />} />
          <Route path="groups/:id"    element={<GroupDetailPage />} />
          <Route path="schedule"      element={<SchedulePage />} />
          <Route path="tests"         element={<TestsPage />} />
          <Route path="students"      element={<StudentsPage />} />
          <Route path="students/:username" element={<StudentProfilePage />} />
          <Route path="teachers"      element={<TeachersPage />} />
          <Route path="courses"         element={<CoursesPage />} />
          <Route path="courses/:id"    element={<CourseDetailPage />} />
          <Route path="finance"       element={<FinancePage />} />
          <Route path="analytics"     element={<AnalyticsRoute />} />
          <Route path="ai"            element={<AiRoute />} />
          <Route path="children"      element={<ChildrenPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings"      element={<SettingsRoute />} />
        </Route>

        {/* ── Ilmoz admin console — ismod (moderator) at "/ilmoz-admin" ── */}
        <Route
          path="/ilmoz-admin"
          element={
            <AdminOnly>
              <AdminRootProvider base="/ilmoz-admin">
                <AdminLayout />
              </AdminRootProvider>
            </AdminOnly>
          }
        >
          {adminRoutes}
          <Route index element={<AdminDashboardPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="ai" element={<AdminAiPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
