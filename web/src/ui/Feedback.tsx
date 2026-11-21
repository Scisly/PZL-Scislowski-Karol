import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AlertCircle, Inbox, LoaderCircle, X } from "lucide-react";
import { ApiError } from "../api";
import s from "./ui.module.css";
export function Button({
  children,
  busy = false,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  variant?: "primary" | "outline" | "ghost" | "danger" | "warning";
  children: ReactNode;
}) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      className={`${s.button} ${s[variant]} ${className}`}
      disabled={props.disabled || busy}
      aria-busy={busy || undefined}
    >
      <span style={{ visibility: busy ? "hidden" : undefined }}>
        {children}
      </span>
      {busy ? (
        <LoaderCircle
          className={`${s.spin} ${s.busyIcon}`}
          size={18}
          aria-label="Trwa zapisywanie"
        />
      ) : null}
    </button>
  );
}
export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <div className={s.error} role="alert">
      <AlertCircle size={18} />
      <div>
        {error instanceof Error
          ? error.message
          : "Nie udało się wykonać operacji. Spróbuj ponownie."}
        {error instanceof ApiError && error.traceId ? (
          <small>Identyfikator zgłoszenia: {error.traceId}</small>
        ) : null}
      </div>
    </div>
  );
}
export function Loading({ label = "Wczytywanie danych…" }: { label?: string }) {
  return (
    <div className={s.loading} role="status">
      <LoaderCircle size={22} className={s.spin} />
      <span>{label}</span>
    </div>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}>
        <Inbox size={27} />
      </span>
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}
export function QueryError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div className={s.queryError}>
      <ErrorMessage error={error} />
      <Button variant="outline" onClick={retry}>
        Spróbuj ponownie
      </Button>
    </div>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`${s.badge} ${s[`tone${tone}`] ?? ""}`}>{children}</span>
  );
}
export function ClearFilters({
  active,
  onClear,
}: {
  active: boolean;
  onClear: () => void;
}) {
  return active ? (
    <Button variant="ghost" onClick={onClear}>
      <X size={15} /> Wyczyść filtry
    </Button>
  ) : null;
}
export function Pagination({
  total,
  page,
  onChange,
  size = 12,
}: {
  total: number;
  page: number;
  onChange: (page: number) => void;
  size?: number;
}) {
  const count = Math.ceil(total / size);
  if (count < 2) return null;
  const current = Math.min(Math.max(1, page), count);
  return (
    <nav className={s.pagination} aria-label="Strony wyników">
      <span>
        {(current - 1) * size + 1}–{Math.min(current * size, total)} z {total}
      </span>
      <Button
        variant="outline"
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
      >
        Poprzednia
      </Button>
      <span>
        {current} / {count}
      </span>
      <Button
        variant="outline"
        onClick={() => onChange(current + 1)}
        disabled={current >= count}
      >
        Następna
      </Button>
    </nav>
  );
}
