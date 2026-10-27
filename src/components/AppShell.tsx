import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutGrid,
  Users,
  UserPlus,
  FileText,
  RefreshCw,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import avatar from "@/assets/worker-avatar.jpg";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/patients/new", label: "Add Patient", icon: UserPlus },
  { to: "/records", label: "Medical Records", icon: FileText },
  { to: "/sync", label: "Sync Center", icon: RefreshCw, badge: true },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isOnline, toggleOnline, worker, pendingCount, signOut } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (ready && !isAuthenticated) navigate({ to: "/" });
    if (ready && isAuthenticated && worker.role === "Patient" && !["/patient", "/settings"].includes(pathname)) navigate({ to: "/patient" });
    if (ready && isAuthenticated && worker.role && worker.role !== "Patient" && pathname === "/patient") navigate({ to: "/dashboard" });
  }, [ready, isAuthenticated, worker.role, pathname, navigate]);

  useEffect(() => setMobileOpen(false), [pathname]);

  const handleLogout = () => {
    signOut();
    navigate({ to: "/" });
  };

  const navList = (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
        Workspace
      </p>
      {worker.role === "Patient" ? (
        <Link to="/patient" className={cn("flex items-center gap-3 px-2.5 py-2 rounded-md text-sm", pathname === "/patient" ? "bg-accent-soft text-accent font-medium" : "text-ink-soft hover:bg-paper hover:text-ink")}>
          <FileText className="size-4 shrink-0" /> My health record
        </Link>
      ) : nav.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 px-2.5 py-2 rounded-md text-sm",
              active
                ? "bg-accent-soft text-accent font-medium"
                : "text-ink-soft hover:bg-paper hover:text-ink",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
            {"badge" in item && item.badge && pendingCount > 0 ? (
              <span className="ml-auto rounded-full bg-warn-soft px-1.5 py-0.5 font-mono text-[10px] text-warn">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        );
      })}
      <p className="px-2 pt-4 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
        Account
      </p>
      <Link
        to="/settings"
        className={cn(
          "flex items-center gap-3 px-2.5 py-2 rounded-md text-sm",
          pathname === "/settings"
            ? "bg-accent-soft text-accent font-medium"
            : "text-ink-soft hover:bg-paper hover:text-ink",
        )}
      >
        <Settings className="size-4 shrink-0" />
        Settings
      </Link>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 px-2.5 py-2 rounded-md text-sm text-err hover:bg-err-soft"
      >
        <LogOut className="size-4 shrink-0" />
        Logout
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      {!isOnline ? (
        <div className="bg-warn-soft border-b border-warn/25">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 text-sm">
            <span className="size-2 rounded-full bg-warn shrink-0" />
            <p className="font-medium text-pretty">
              Offline — records are being saved to this device. They will sync automatically once
              connection returns.
            </p>
            <Link
              to="/sync"
              className="ml-auto shrink-0 font-medium underline underline-offset-4 decoration-rule hover:decoration-ink-soft"
            >
              View Sync Center
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1400px] flex">
        <aside className="hidden md:flex w-60 lg:w-64 shrink-0 flex-col border-r border-rule bg-panel min-h-screen sticky top-0">
          <div className="h-16 flex items-center gap-2.5 px-5 border-b border-rule">
            <span className="grid place-items-center size-7 rounded-md bg-accent text-paper text-[11px] font-mono font-medium">
              RC
            </span>
            <div className="leading-none">
              <p className="text-[15px] font-semibold tracking-tight">RuralCare</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                Field records
              </p>
            </div>
          </div>
          {navList}
          <div className="px-4 py-3 border-t border-rule">
            <div className="flex items-center gap-2.5">
              <img
                src={avatar}
                alt=""
                width={512}
                height={512}
                loading="lazy"
                className="size-9 rounded-full object-cover ring-1 ring-black/5"
              />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[13px] font-medium">{worker.name}</p>
                <p className="truncate text-[11px] text-ink-soft">{worker.clinic}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="h-16 sticky top-0 z-20 bg-paper/95 backdrop-blur border-b border-rule">
            <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                className="md:hidden grid size-9 place-items-center rounded-md ring-1 ring-black/5 bg-panel"
              >
                <Menu className="size-4" />
              </button>
              <span className="md:hidden grid place-items-center size-7 rounded-md bg-accent text-paper text-[11px] font-mono font-medium">
                RC
              </span>

              {worker.role !== "Patient" ? <div className="relative hidden sm:block flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                <input
                  type="search"
                  aria-label="Search patients and records"
                  placeholder="Search patients, records…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      navigate({
                        to: "/patients",
                        search: { q: (e.target as HTMLInputElement).value },
                      });
                    }
                  }}
                  className="w-full h-9 pl-9 pr-3 rounded-md bg-panel ring-1 ring-black/5 text-sm placeholder:text-ink-soft/70 focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div> : null}

              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={toggleOnline}
                  title="Toggle connectivity"
                  className={cn(
                    "flex items-center gap-2 h-8 pl-2.5 pr-3 rounded-full text-sm font-medium ring-1",
                    isOnline
                      ? "bg-ok-soft text-ok ring-ok/25"
                      : "bg-warn-soft text-warn ring-warn/25",
                  )}
                >
                  {isOnline ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
                  <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
                </button>
                <img
                  src={avatar}
                  alt={worker.name}
                  width={512}
                  height={512}
                  loading="lazy"
                  className="size-9 rounded-full object-cover ring-1 ring-black/5"
                />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {!worker.role ? (
              <p className="text-sm text-ink-soft" role="status">Loading your secure workspace…</p>
            ) : worker.role === "Patient" && !["/patient", "/settings"].includes(pathname) ? (
              <p className="text-sm text-ink-soft" role="status">Opening your patient portal…</p>
            ) : worker.role && worker.role !== "Patient" && pathname === "/patient" ? (
              <p className="text-sm text-ink-soft" role="status">Opening the staff dashboard…</p>
            ) : children}
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="md:hidden fixed inset-0 z-40">
          <button
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-panel border-r border-rule flex flex-col">
            <div className="h-16 flex items-center gap-2.5 px-5 border-b border-rule">
              <span className="grid place-items-center size-7 rounded-md bg-accent text-paper text-[11px] font-mono font-medium">
                RC
              </span>
              <p className="text-[15px] font-semibold tracking-tight">RuralCare</p>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="ml-auto grid size-8 place-items-center rounded-md ring-1 ring-black/5"
              >
                <X className="size-4" />
              </button>
            </div>
            {navList}
          </div>
        </div>
      ) : null}
    </div>
  );
}
