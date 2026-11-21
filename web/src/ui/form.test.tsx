import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../api";
import { Field } from "./Fields";
import { Button, ErrorMessage } from "./Feedback";
import { useForm } from "./useForm";
function Harness({
  save,
}: {
  save: (values: { name: string }) => Promise<void>;
}) {
  const form = useForm({ name: "" }, { name: { required: true } }, save);
  return (
    <form noValidate ref={form.formRef} onSubmit={form.submit}>
      <ErrorMessage error={form.error} />
      <Field label="Nazwa projektu" required {...form.field("name")} />
      <Button type="submit" busy={form.busy}>
        Zapisz
      </Button>
    </form>
  );
}
describe("form recovery", () => {
  it("focuses first invalid field before any network mutation", async () => {
    const save = vi.fn();
    const user = userEvent.setup();
    render(<Harness save={save} />);
    await user.click(screen.getByRole("button", { name: "Zapisz" }));
    expect(await screen.findByText("Uzupełnij to pole.")).toBeVisible();
    await vi.waitFor(() =>
      expect(
        screen.getByLabelText("Nazwa projektu", { exact: false }),
      ).toHaveFocus(),
    );
    expect(save).not.toHaveBeenCalled();
  });
  it("retains entered values after permission failure so they can be copied or retried", async () => {
    const save = vi.fn().mockRejectedValue(new ApiError(403));
    const user = userEvent.setup();
    render(<Harness save={save} />);
    await user.type(
      screen.getByLabelText("Nazwa projektu", { exact: false }),
      "Analiza domeny",
    );
    await user.click(screen.getByRole("button", { name: "Zapisz" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie masz uprawnień",
    );
    expect(
      screen.getByLabelText("Nazwa projektu", { exact: false }),
    ).toHaveValue("Analiza domeny");
    expect(screen.getByRole("button", { name: "Zapisz" })).toBeEnabled();
  });
});
