export type Rules = Record<
  string,
  {
    required?: boolean;
    max?: number;
    email?: boolean;
    maxDate?: string;
    password?: boolean;
  }
>;
export type Errors = Record<string, string>;
export function passwordError(value: string) {
  return value.length < 10 ||
    !/[a-z]/.test(value) ||
    !/[A-Z]/.test(value) ||
    !/[0-9]/.test(value) ||
    !/[^a-zA-Z0-9]/.test(value)
    ? "Użyj co najmniej 10 znaków: małej i wielkiej litery, cyfry i znaku specjalnego."
    : undefined;
}
export function validate(values: Record<string, string>, rules: Rules): Errors {
  const errors: Errors = {};
  for (const [key, rule] of Object.entries(rules)) {
    const value = values[key] ?? "";
    if (rule.required && !value.trim()) errors[key] = "Uzupełnij to pole.";
    else if (rule.max && value.length > rule.max)
      errors[key] = `Użyj maksymalnie ${rule.max} znaków.`;
    else if (rule.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      errors[key] = "Wpisz poprawny adres e-mail.";
    else if (rule.maxDate && value && value > rule.maxDate)
      errors[key] = "Termin zadania nie może przekraczać terminu projektu.";
    else if (rule.password) {
      const message = passwordError(value);
      if (message) errors[key] = message;
    }
  }
  return errors;
}
