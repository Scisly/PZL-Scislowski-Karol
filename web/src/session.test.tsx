import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
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
  it("does not restore an earlier account when its session refetch finishes after logout", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30000 } },
    });
    const account = {
      id: "u1",
      displayName: "Student",
      email: "student@example.com",
      roles: ["Student"],
    };
    client.setQueryData(["session"], account);
    let finishSessionCheck!: (value: typeof account) => void;
    const sessionCheck = new Promise<typeof account>((resolve) => {
      finishSessionCheck = resolve;
    });
    vi.spyOn(transport, "api").mockImplementation(async (path) =>
      path === "/auth/me" ? (sessionCheck as never) : (undefined as never),
    );
    vi.spyOn(transport, "refreshCsrf").mockResolvedValue("anonymous-token");
    function SessionRoute() {
      const { user: account, logout } = useSession();
      return account ? (
        <button onClick={() => void logout()}>Wyloguj testowo</button>
      ) : (
        <p>Sesja zakończona</p>
      );
    }
    render(
      <QueryClientProvider client={client}>
        <SessionProvider>
          <SessionRoute />
        </SessionProvider>
      </QueryClientProvider>,
    );
    const pendingCheck = client.refetchQueries({ queryKey: ["session"] });
    await user.click(screen.getByRole("button", { name: "Wyloguj testowo" }));
    expect(await screen.findByText("Sesja zakończona")).toBeVisible();
    await act(async () => {
      finishSessionCheck(account);
      await pendingCheck;
    });
    expect(screen.getByText("Sesja zakończona")).toBeVisible();
    expect(client.getQueryData(["session"])).toBeNull();
  });
  it("logs out without restarting a mounted protected query", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30000 } },
    });
    const account = {
      id: "u1",
      displayName: "Student",
      email: "student@example.com",
      roles: ["Student"],
    };
    vi.spyOn(transport, "api").mockImplementation(async (path) =>
      path === "/auth/me" ? (account as never) : (undefined as never),
    );
    vi.spyOn(transport, "refreshCsrf").mockResolvedValue("anonymous-token");
    const fetchProjects = vi.fn(async () => [{ id: "private-project" }]);
    function ProtectedProjects() {
      const { logout } = useSession();
      const projects = useQuery({
        queryKey: ["projects"],
        queryFn: fetchProjects,
      });
      return (
        <>
          <p>{projects.data?.[0]?.id}</p>
          <button onClick={() => void logout()}>Wyloguj testowo</button>
        </>
      );
    }
    function SessionRoute() {
      return useSession().user ? (
        <ProtectedProjects />
      ) : (
        <p>Sesja zakończona</p>
      );
    }
    render(
      <QueryClientProvider client={client}>
        <SessionProvider>
          <SessionRoute />
        </SessionProvider>
      </QueryClientProvider>,
    );
    await screen.findByText("private-project");
    expect(fetchProjects).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Wyloguj testowo" }));
    expect(fetchProjects).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Sesja zakończona")).toBeVisible();
    expect(client.getQueryData(["projects"])).toBeUndefined();
  });
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
