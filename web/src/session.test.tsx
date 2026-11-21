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
  it("ends an already expired session and clears cached protected data", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const account = {
      id: "u1",
      displayName: "Student",
      email: "student@example.com",
      roles: ["Student"],
    };
    vi.spyOn(transport, "api").mockImplementation(async (path) => {
      if (path === "/auth/me") return account as never;
      throw new transport.ApiError(401);
    });
    const csrf = vi
      .spyOn(transport, "refreshCsrf")
      .mockResolvedValue("anonymous-token");
    client.setQueryData(["projects"], [{ id: "private-project" }]);
    render(
      <QueryClientProvider client={client}>
        <SessionProvider>
          <Draft />
        </SessionProvider>
      </QueryClientProvider>,
    );
    await screen.findByLabelText("Szkic zadania");
    window.dispatchEvent(new Event("session-expired"));
    await user.click(
      await screen.findByRole("button", { name: "Zakończ sesję" }),
    );
    expect(await screen.findByText("Sesja zakończona")).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Zaloguj się ponownie" }),
    ).not.toBeInTheDocument();
    expect(client.getQueryData(["projects"])).toBeUndefined();
    expect(csrf).toHaveBeenCalled();
  });
  it("shows logout server failures in reauthentication while retaining the draft", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const account = {
      id: "u1",
      displayName: "Student",
      email: "student@example.com",
      roles: ["Student"],
    };
    vi.spyOn(transport, "api").mockImplementation(async (path) => {
      if (path === "/auth/me") return account as never;
      throw new transport.ApiError(500);
    });
    render(
      <QueryClientProvider client={client}>
        <SessionProvider>
          <Draft />
        </SessionProvider>
      </QueryClientProvider>,
    );
    await user.type(
      await screen.findByLabelText("Szkic zadania"),
      "Zachowany szkic",
    );
    window.dispatchEvent(new Event("session-expired"));
    await user.click(
      await screen.findByRole("button", { name: "Zakończ sesję" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się wykonać operacji",
    );
    expect(screen.getByLabelText("Szkic zadania")).toHaveValue(
      "Zachowany szkic",
    );
    expect(screen.getByRole("button", { name: "Zakończ sesję" })).toBeEnabled();
  });
});
