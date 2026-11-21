import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Layers3 } from "lucide-react";
import { usePageTitle } from "../hooks";
import { useSession } from "../context";
import { Field, PasswordField } from "../ui/Fields";
import { Button, ErrorMessage } from "../ui/Feedback";
import { NavigationGuard } from "../ui/Modal";
import { useForm } from "../ui/useForm";
import s from "./pages.module.css";
export function AuthPage({ register = false }: { register?: boolean }) {
  const session = useSession();
  usePageTitle(register ? "Załóż konto" : "Zaloguj się");
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo =
    (location.state as { from?: string } | null)?.from ?? "/projects";
  const form = useForm(
    { displayName: "", email: "", password: "" },
    {
      ...(register ? { displayName: { required: true, max: 100 } } : {}),
      email: { required: true, email: true },
      password: { required: true, password: register },
    },
    async (values) => {
      if (register)
        await session.register(
          values.displayName.trim(),
          values.email.trim(),
          values.password,
        );
      else await session.login(values.email.trim(), values.password);
      navigate(returnTo, { replace: true });
    },
  );
  if (session.user) return <Navigate to="/projects" replace />;
  return (
    <main className={s.auth}>
      <NavigationGuard dirty={form.dirty && !form.busy} />
      <section className={s.authAside}>
        <Link to="/login" className={s.authBrand}>
          <Layers3 size={29} /> TaskFlow<span>PRZESTRZEŃ ZESPOŁU</span>
        </Link>
        <div>
          <p className={s.eyebrow}>Wspólny projekt. Jasny plan.</p>
          <h1>
            Od pierwszego pomysłu
            <br />
            do oddanego projektu.
          </h1>
          <p>
            Zadania, terminy i rozmowy zespołu w jednej przestrzeni. Zostaw
            więcej czasu na samą pracę.
          </p>
          <ul>
            <li>
              <Check size={18} /> Każdy zna swój następny krok
            </li>
            <li>
              <Check size={18} /> Wszystkie terminy pod ręką
            </li>
            <li>
              <Check size={18} /> Ustalenia przy konkretnym zadaniu
            </li>
          </ul>
        </div>
        <small>Stworzone do pracy w studenckim zespole.</small>
      </section>
      <section className={s.authPanel}>
        <div className={s.authForm}>
          <p className={s.eyebrow}>
            {register ? "DOŁĄCZ DO PRZESTRZENI" : "DOBRZE CIĘ WIDZIEĆ"}
          </p>
          <h2>{register ? "Załóż konto" : "Zaloguj się do TaskFlow"}</h2>
          <p>
            {register
              ? "Utwórz konto i rozpocznij pracę ze swoim zespołem."
              : "Twój zespół i projekty czekają w jednym miejscu."}
          </p>
          <form noValidate onSubmit={form.submit} ref={form.formRef}>
            <ErrorMessage error={form.error} />
            {register ? (
              <Field
                label="Imię i nazwisko"
                autoComplete="name"
                required
                maxLength={100}
                {...form.field("displayName")}
              />
            ) : null}
            <Field
              label="E-mail"
              type="email"
              autoComplete="username"
              required
              {...form.field("email")}
            />
            <PasswordField
              label="Hasło"
              autoComplete={register ? "new-password" : "current-password"}
              required
              hint={
                register
                  ? "Minimum 10 znaków, mała i wielka litera, cyfra i znak specjalny."
                  : undefined
              }
              {...form.field("password")}
            />
            <Button type="submit" busy={form.busy}>
              {register ? "Utwórz konto" : "Zaloguj się"}
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className={s.authSwitch}>
            {register ? "Masz już konto?" : "Nie masz jeszcze konta?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Zaloguj się" : "Załóż konto"}
            </Link>
          </p>
          <p className={s.authNote}>
            Konto służy wyłącznie do współpracy w TaskFlow. W tej wersji nie
            wysyłamy wiadomości e-mail.
          </p>
        </div>
      </section>
    </main>
  );
}
