import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select as Choice } from "./Select";
import { Field, PasswordField, Search } from "./Fields";
describe("shared input states", () => {
  it("select supports keyboard navigation and commit", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <Choice
        label="Status"
        value="Todo"
        onChange={change}
        options={[
          { value: "Todo", label: "Do zrobienia" },
          { value: "Done", label: "Gotowe" },
        ]}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.keyboard("{End}{Enter}");
    expect(change).toHaveBeenCalledWith("Done");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
  it("associates inline errors with the field", () => {
    render(
      <Field
        name="name"
        label="Nazwa"
        value=""
        onChange={() => {}}
        error="Uzupełnij nazwę."
      />,
    );
    expect(screen.getByLabelText("Nazwa")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Nazwa")).toHaveAccessibleDescription(
      "Uzupełnij nazwę.",
    );
  });
  it("masks passwords by default and exposes reveal state", async () => {
    const user = userEvent.setup();
    render(
      <PasswordField
        name="password"
        label="Hasło"
        value="secret"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText("Hasło")).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Pokaż hasło" }));
    expect(screen.getByLabelText("Hasło")).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ukryj hasło" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
  it("clears search immediately and restores input focus", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <Search label="Szukaj projektów" value="Egzamin" onChange={change} />,
    );
    await user.click(
      screen.getByRole("button", { name: "Wyczyść wyszukiwanie" }),
    );
    expect(change).toHaveBeenCalledWith("");
    expect(screen.getByRole("searchbox")).toHaveFocus();
  });
});
