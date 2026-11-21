import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import s from "./ui.module.css";
export type Option = { value: string; label: string };
export function Select({
  label,
  value,
  options,
  onChange,
  disabled = false,
  name,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [geometry, setGeometry] = useState<{
    left: number;
    top: number | string;
    bottom: number | string;
    width: number;
    maxHeight: number;
  }>({
    left: 0,
    top: 0,
    bottom: "auto",
    width: 0,
    maxHeight: 260,
  });
  const search = useRef({ text: "", time: 0 });
  const chosen = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  useLayoutEffect(() => {
    if (!open) return;
    function position() {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 14;
      const above = rect.top - 14;
      const height = Math.max(
        80,
        Math.min(260, below < 150 && above > below ? above : below),
      );
      setGeometry({
        left: Math.max(
          8,
          Math.min(rect.left, window.innerWidth - rect.width - 8),
        ),
        top: below < 150 && above > below ? "auto" : rect.bottom + 6,
        bottom:
          below < 150 && above > below
            ? window.innerHeight - rect.top + 6
            : "auto",
        width: rect.width,
        maxHeight: height,
      });
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open]);
  useEffect(() => {
    if (open)
      list.current
        ?.querySelector(`[id="${id}-option-${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open, id]);
  function toggle() {
    if (disabled) return;
    setActive(chosen);
    setOpen((current) => !current);
  }
  function key(event: KeyboardEvent) {
    if (disabled) return;
    if (event.nativeEvent.isComposing) return;
    if (
      ["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(
        event.key,
      )
    )
      event.preventDefault();
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      if (open) {
        onChange(options[active].value);
        setOpen(false);
      } else toggle();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!open) {
        setOpen(true);
        setActive(chosen);
      } else
        setActive(
          (current) =>
            (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
            options.length,
        );
    } else if (event.key === "Home") {
      setOpen(true);
      setActive(0);
    } else if (event.key === "End") {
      setOpen(true);
      setActive(options.length - 1);
    } else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.nativeEvent.isComposing
    ) {
      const now = Date.now();
      search.current.text =
        (now - search.current.time < 600 ? search.current.text : "") +
        event.key.toLocaleLowerCase("pl");
      search.current.time = now;
      const index = options.findIndex((option) =>
        option.label.toLocaleLowerCase("pl").startsWith(search.current.text),
      );
      if (index >= 0) {
        setActive(index);
        setOpen(true);
      }
    }
  }
  return (
    <div className={s.field}>
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <div
        className={s.select}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setOpen(false);
        }}
      >
        <button
          ref={trigger}
          type="button"
          id={id}
          name={name}
          className={s.selectTrigger}
          role="combobox"
          aria-labelledby={`${id}-label`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? `${id}-list` : undefined}
          aria-activedescendant={open ? `${id}-option-${active}` : undefined}
          onClick={toggle}
          onKeyDown={key}
          disabled={disabled}
        >
          <span id={`${id}-value`}>{options[chosen]?.label}</span>
          <ChevronDown size={16} />
        </button>
        {open ? (
          <ul
            ref={list}
            style={{ position: "fixed", ...geometry }}
            className={s.options}
            id={`${id}-list`}
            role="listbox"
            aria-labelledby={`${id}-label`}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={index === active ? s.optionActive : undefined}
                onMouseDown={(event) => event.preventDefault()}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    trigger.current?.focus();
                  }}
                >
                  {option.label}
                  {option.value === value ? <Check size={16} /> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
