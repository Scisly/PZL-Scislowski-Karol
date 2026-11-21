import { useState } from "react";
import {
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BookOpen,
  CheckSquare2,
  FolderKanban,
  Layers3,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "./context";
import { initials } from "./types";
import { Button, ErrorMessage } from "./ui/Feedback";
import { Confirm } from "./ui/Modal";
import s from "./pages/pages.module.css";
export function Shell() {
  const { user, logout } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [signout, setSignout] = useState(false);
  const [error, setError] = useState<unknown>();
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  return (
    <div className={s.shell}>
      <a className={s.skip} href="#main">
        Przejdź do treści
      </a>
      <aside className={s.sidebar}>
        <NavLink to="/projects" className={s.brand}>
          <span>
            <Layers3 size={24} />
          </span>
          TaskFlow
        </NavLink>
        <div className={s.workspace}>
          <span className={s.workspaceIcon}>
            <BookOpen size={19} />
          </span>
          <div>
            <strong>Przestrzeń studencka</strong>
            <small>Razem do celu</small>
          </div>
        </div>
        <p className={s.navLabel}>TWOJA PRACA</p>
        <nav aria-label="Nawigacja główna">
          <NavLink
            to="/projects"
            className={({ isActive }) => (isActive ? s.navActive : "")}
          >
            <FolderKanban size={19} />
            Projekty
          </NavLink>
          <NavLink
            to="/my-tasks"
            className={({ isActive }) => (isActive ? s.navActive : "")}
          >
            <CheckSquare2 size={19} />
            Moje zadania
          </NavLink>
          {user.roles.includes("Admin") ? (
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? s.navActive : "")}
            >
              <ShieldCheck size={19} />
              Konta użytkowników
            </NavLink>
          ) : null}
        </nav>
        <div className={s.sidebarFoot}>
          <span className={s.smallMark}>TF</span>
          <p>
            Małe kroki.
            <br />
            <strong>Wspólny postęp.</strong>
          </p>
          <small>TaskFlow · projekt akademicki</small>
        </div>
      </aside>
      <div className={s.workspaceMain}>
        <header className={s.topbar}>
          <span>
            Przestrzeń zespołu <span className={s.topSeparator}>/</span>{" "}
            <strong>
              {location.pathname === "/my-tasks"
                ? "Moje zadania"
                : location.pathname === "/admin"
                  ? "Administracja"
                  : "Projekty"}
            </strong>
          </span>
          <div className={s.userNav}>
            <span className={s.avatar}>{initials(user.displayName)}</span>
            <span className={s.userName}>
              {user.displayName}
              <small>
                {user.roles.includes("Admin") ? "Administrator" : "Student"}
              </small>
            </span>
            <Button
              variant="ghost"
              aria-label="Wyloguj się"
              title="Wyloguj się"
              onClick={() => setSignout(true)}
            >
              <LogOut size={18} />
            </Button>
          </div>
        </header>
        <main id="main" className={s.main}>
          <ErrorMessage error={error} />
          <Outlet />
        </main>
        <footer className={s.footer}>
          TaskFlow <span>Praca zespołowa, krok po kroku.</span>
        </footer>
      </div>
      {signout ? (
        <Confirm
          title="Wylogować się?"
          description="Otwarte, niezapisane formularze zostaną zamknięte."
          variant="primary"
          action="Wyloguj się"
          onClose={() => setSignout(false)}
          onConfirm={async () => {
            try {
              await logout();
              navigate("/login");
            } catch (problem) {
              setError(problem);
              throw problem;
            }
          }}
        />
      ) : null}
    </div>
  );
}
