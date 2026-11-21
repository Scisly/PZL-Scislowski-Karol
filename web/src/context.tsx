import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, X } from "lucide-react";
import { api, body, refreshCsrf, resetCsrf } from "./api";
import type { User } from "./types";
import { Modal } from "./ui/Modal";
import { Field, PasswordField } from "./ui/Fields";
import { Button, ErrorMessage, Loading } from "./ui/Feedback";
import { useForm } from "./ui/useForm";
import s from "./ui/ui.module.css";
type Session = {
  user: User | null;
  pending: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    displayName: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};
const SessionContext = createContext<Session | null>(null);
export const useSession = () => {
  const value = useContext(SessionContext);
  if (!value) throw Error("Session provider missing");
  return value;
};
export function SessionProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [expired, setExpired] = useState(false);
  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await api<User>("/auth/me");
      } catch (error) {
        if (
          error instanceof Error &&
          "status" in error &&
          error.status === 401
        ) {
          const previous = client.getQueryData<User | null>(["session"]);
          if (previous) {
            resetCsrf();
            setExpired(true);
            return previous;
          }
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 60000,
  });
  useEffect(() => {
    const listener = () => {
      resetCsrf();
      setExpired(true);
    };
    window.addEventListener("session-expired", listener);
    return () => window.removeEventListener("session-expired", listener);
  }, []);
  async function authenticate(path: string, data: unknown) {
    // Antiforgery tokens bind to identity. Re-auth can start after its cookie expired.
    await refreshCsrf();
    const user = await api<User>(path, { method: "POST", body: body(data) });
    await refreshCsrf();
    client.setQueryData(["session"], user);
    setExpired(false);
    await client.invalidateQueries({
      predicate: (query) => query.queryKey[0] !== "session",
    });
  }
  async function logout() {
    await api("/auth/logout", { method: "POST" });
    await refreshCsrf();
    setExpired(false);
    client.clear();
    client.setQueryData(["session"], null);
  }
  return (
    <SessionContext.Provider
      value={{
        user: session.data ?? null,
        pending: session.isPending,
        login: (email, password) =>
          authenticate("/auth/login", { email, password }),
        register: (displayName, email, password) =>
          authenticate("/auth/register", { displayName, email, password }),
        logout,
      }}
    >
      {session.isError && !session.data ? (
        <div className={s.sessionError}>
          <ErrorMessage error={session.error} />
          <Button onClick={() => void session.refetch()}>
            Ponów połączenie
          </Button>
        </div>
      ) : session.isPending ? (
        <Loading label="Otwieranie przestrzeni…" />
      ) : (
        children
      )}
      {expired && session.data ? <Reauthenticate onLogout={logout} /> : null}
    </SessionContext.Provider>
  );
}
function Reauthenticate({ onLogout }: { onLogout: () => Promise<void> }) {
  const { user, login } = useSession();
  const form = useForm(
    { email: user?.email ?? "", password: "" },
    { email: { required: true, email: true }, password: { required: true } },
    async (values) => login(values.email, values.password),
  );
  return (
    <Modal
      title="Zaloguj się ponownie"
      description="Sesja wygasła. Wpisane dane pozostają w otwartym formularzu."
      onClose={() => {}}
    >
      <form noValidate ref={form.formRef} onSubmit={form.submit}>
        <ErrorMessage error={form.error} />
        <Field
          label="E-mail"
          type="email"
          readOnly
          autoComplete="username"
          required
          {...form.field("email")}
        />
        <PasswordField
          label="Hasło"
          autoComplete="current-password"
          required
          {...form.field("password")}
        />
        <div className={s.actions}>
          <Button variant="outline" onClick={() => void onLogout()}>
            Zakończ sesję
          </Button>
          <Button type="submit" busy={form.busy}>
            Zaloguj się
          </Button>
        </div>
      </form>
    </Modal>
  );
}
type Toast = { id: number; text: string };
const NoticeContext = createContext<(text: string) => void>(() => {});
export const useNotice = () => useContext(NoticeContext);
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Toast | null>(null);
  const notify = useCallback(
    (text: string) => setNotice({ id: Date.now(), text }),
    [],
  );
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  return (
    <NoticeContext.Provider value={notify}>
      {children}
      <div className={s.toastRegion} aria-live="polite" aria-atomic="true">
        {notice ? (
          <div className={s.toast}>
            <CheckCircle2 size={18} />
            <span>{notice.text}</span>
            <button
              type="button"
              aria-label="Zamknij powiadomienie"
              onClick={() => setNotice(null)}
            >
              <X size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </NoticeContext.Provider>
  );
}
