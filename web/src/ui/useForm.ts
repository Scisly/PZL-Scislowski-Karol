import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api";
import { useModalDirty } from "./Modal";
import { validate } from "../validation";
import type { Errors, Rules } from "../validation";
export function useForm<T extends Record<string, string>>(
  initial: T,
  rules: Rules,
  onSave: (values: T, reset: () => void) => Promise<void>,
) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = JSON.stringify(initial) !== JSON.stringify(values);
  useModalDirty(dirty);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, [dirty]);
  function field(name: keyof T) {
    return {
      name: String(name),
      value: values[name],
      error: errors[String(name)],
      onChange: (value: string) => {
        setValues((current) => ({ ...current, [name]: value }));
        setErrors((current) => {
          const next = { ...current };
          delete next[String(name)];
          return next;
        });
        setError(undefined);
      },
    };
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const next = validate(values, rules);
    setErrors(next);
    setError(undefined);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    setBusy(true);
    try {
      await onSave(values, () => setValues(initial));
    } catch (problem) {
      setError(problem);
      if (problem instanceof ApiError) {
        setErrors(problem.fields);
        requestAnimationFrame(() =>
          formRef.current
            ?.querySelector<HTMLElement>('[aria-invalid="true"]')
            ?.focus(),
        );
      }
    } finally {
      setBusy(false);
    }
  }
  return {
    values,
    setValues,
    errors,
    error,
    busy,
    dirty,
    field,
    submit,
    formRef,
  };
}
