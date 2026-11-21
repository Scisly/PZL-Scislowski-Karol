import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as transport from "./api";
import { SessionProvider, useSession } from "./context";
afterEach(() => vi.restoreAllMocks());
function Draft() {
  const { user } = useSession();
  return user ? (
    <label>
      Szkic zadania
      <input defaultValue="" />
    </label>
  ) : (
    <p>Sesja zakończona</p>
  );
}
describe("session recovery", () => {
  it("keeps the mounted draft and reauthenticates when background session check expires", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const call = vi
      .spyOn(transport, "api")
      .mockResolvedValueOnce({
        id: "u1",
        displayName: "Student",
        email: "student@example.com",
        roles: ["Student"],
      })
      .mockRejectedValue(new transport.ApiError(401));
    render(
      <QueryClientProvider client={client}>
        <SessionProvider>
          <Draft />
        </SessionProvider>
      </QueryClientProvider>,
    );
    await user.type(
      await screen.findByLabelText("Szkic zadania"),
      "Zachowaj opis",
    );
    await client.invalidateQueries({ queryKey: ["session"] });
    expect(
      await screen.findByRole("heading", { name: "Zaloguj się ponownie" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Szkic zadania")).toHaveValue("Zachowaj opis");
    expect(call).toHaveBeenCalledTimes(2);
  });
});
