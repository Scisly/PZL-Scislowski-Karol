import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useBlocker } from "react-router-dom";
import { X } from "lucide-react";
import { Button, ErrorMessage } from "./Feedback";
import s from "./ui.module.css";
type ModalContextValue = {
  close: () => void;
  register: (id: string, dirty: boolean) => void;
};
const ModalContext = createContext<ModalContextValue | null>(null);
let openDialogs = 0;
let originalOverflow = "";
export function useModalDirty(dirty: boolean) {
  const context = useContext(ModalContext);
  const register = context?.register;
  const id = useId();
  useEffect(() => {
    register?.(id, dirty);
    return () => register?.(id, false);
  }, [dirty, id, register]);
}
export function ModalClose({ disabled = false }: { disabled?: boolean }) {
  const modal = useContext(ModalContext);
  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={() => modal?.close()}
    >
      Anuluj
    </Button>
  );
}
export function Modal({
  title,
  description,
  children,
  onClose,
  dirty = false,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  dirty?: boolean;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [discard, setDiscard] = useState(false);
  const [childDirty, setChildDirty] = useState<Set<string>>(() => new Set());
  const register = useCallback(
    (key: string, value: boolean) =>
      setChildDirty((current) => {
        if (current.has(key) === value) return current;
        const next = new Set(current);
        if (value) next.add(key);
        else next.delete(key);
        return next;
      }),
    [],
  );
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    if (openDialogs === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    openDialogs++;
    element?.showModal();
    return () => {
      element?.close();
      openDialogs--;
      if (openDialogs === 0) document.body.style.overflow = originalOverflow;
      previous?.focus();
    };
  }, []);
  const close = useCallback(() => {
    if (dirty || childDirty.size) setDiscard(true);
    else onClose();
  }, [dirty, childDirty.size, onClose]);
  const context = useMemo(() => ({ close, register }), [close, register]);
  return (
    <ModalContext.Provider value={context}>
      <dialog
        ref={dialog}
        className={`${s.modal} ${wide ? s.modalWide : ""}`}
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              close();
          }
        }}
      >
        <div className={s.modalHeader}>
          <div>
            <h2 id={`${id}-title`}>{title}</h2>
            {description ? <p id={`${id}-description`}>{description}</p> : null}
          </div>
          <button
            className={s.iconButton}
            aria-label="Zamknij okno"
            onClick={close}
          >
            <X size={21} />
          </button>
        </div>
        <div className={s.modalBody}>{children}</div>
        {discard ? (
          <Confirm
            title="Odrzucić niezapisane zmiany?"
            description="Wpisane dane nie zostaną zapisane."
            action="Odrzuć zmiany"
            onClose={() => setDiscard(false)}
            onConfirm={async () => onClose()}
          />
        ) : null}
      </dialog>
    </ModalContext.Provider>
  );
}
export function Confirm({
  title,
  description,
  action = "Usuń",
  variant = "danger",
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  action?: string;
  variant?: "danger" | "primary" | "warning";
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  return (
    <Modal
      title={title}
      description={description}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <ErrorMessage error={error} />
      <div className={s.actions}>
        <Button variant="outline" autoFocus disabled={busy} onClick={onClose}>
          Anuluj
        </Button>
        <Button
          variant={variant}
          busy={busy}
          onClick={async () => {
            setBusy(true);
            setError(undefined);
            try {
              await onConfirm();
              onClose();
            } catch (problem) {
              setError(problem);
            } finally {
              setBusy(false);
            }
          }}
        >
          {action}
        </Button>
      </div>
    </Modal>
  );
}
export function NavigationGuard({ dirty }: { dirty: boolean }) {
  const blocker = useBlocker(dirty);
  return blocker.state === "blocked" ? (
    <Confirm
      title="Opuścić formularz?"
      description="Wpisane, niezapisane dane zostaną utracone."
      action="Opuść formularz"
      onClose={() => blocker.reset()}
      onConfirm={async () => blocker.proceed()}
    />
  ) : null;
}
