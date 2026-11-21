import { useId, useRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff, Search as SearchIcon, X } from "lucide-react";
import s from "./ui.module.css";
type Props = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  multiline?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "name">;
export function Field({
  name,
  label,
  value,
  onChange,
  error,
  hint,
  multiline,
  ...props
}: Props) {
  const id = useId();
  const help = error || hint;
  return (
    <div className={s.field}>
      <label htmlFor={id}>
        {label}
        {props.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {multiline ? (
        <textarea
          className="resize-none"
          id={id}
          name={name}
          value={value}
          required={props.required}
          maxLength={props.maxLength}
          disabled={props.disabled}
          rows={4}
          style={{ resize: "none" }}
          aria-invalid={error ? true : undefined}
          aria-describedby={help ? `${id}-help` : undefined}
          onChange={(event) => {
            onChange(event.target.value);
            event.target.style.height = "auto";
            event.target.style.height = `${Math.min(event.target.scrollHeight, 350)}px`;
          }}
        />
      ) : (
        <input
          id={id}
          name={name}
          value={value}
          {...props}
          aria-invalid={error ? true : undefined}
          aria-describedby={help ? `${id}-help` : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      <span id={`${id}-help`} className={error ? s.fieldError : s.hint}>
        {help || "\u00a0"}
      </span>
    </div>
  );
}
export function PasswordField(props: Props) {
  const [shown, setShown] = useState(false);
  return (
    <div className={s.password}>
      <Field {...props} type={shown ? "text" : "password"} />
      <button
        type="button"
        className={s.reveal}
        onClick={() => setShown((current) => !current)}
        aria-label={shown ? "Ukryj hasło" : "Pokaż hasło"}
        aria-pressed={shown}
      >
        {shown ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
export function Search({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={s.search}>
      <label htmlFor={id} className={s.srOnly}>
        {label}
      </label>
      <SearchIcon aria-hidden="true" size={18} />
      <input
        ref={ref}
        id={id}
        type="search"
        value={value}
        placeholder={label}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button
          type="button"
          aria-label="Wyczyść wyszukiwanie"
          onClick={() => {
            onChange("");
            ref.current?.focus();
          }}
        >
          <X size={17} />
        </button>
      ) : null}
    </div>
  );
}
