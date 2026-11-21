import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, resetCsrf } from "./api";
afterEach(() => {
  vi.unstubAllGlobals();
  resetCsrf();
});
describe("same-origin API client", () => {
  it("acquires CSRF and sends cookie credentials with mutation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "fresh-token" })),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await api("/projects/p1", { method: "DELETE" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/csrf");
    expect(fetchMock.mock.calls[1][1].credentials).toBe("include");
    expect(
      new Headers(fetchMock.mock.calls[1][1].headers).get("X-CSRF-TOKEN"),
    ).toBe("fresh-token");
  });
  it("retains field problems and safe request reference", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            title: "Błąd",
            detail: "Nie można zapisać.",
            traceId: "request-1",
            errors: { Name: ["Za długa nazwa."] },
          }),
          { status: 400 },
        ),
      ),
    );
    try {
      await api("/projects");
      throw Error("expected rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).fields.name).toBe("Za długa nazwa.");
      expect((error as ApiError).traceId).toBe("request-1");
    }
  });
  it("does not parse a successful empty response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    expect(await api("/health")).toBeUndefined();
  });
  it("signals session expiry for resources without exposing an auth redirect", async () => {
    const listener = vi.fn();
    window.addEventListener("session-expired", listener);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
    );
    await expect(api("/projects")).rejects.toMatchObject({ status: 401 });
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener("session-expired", listener);
  });
  it("discards an identity-bound CSRF token after session expiry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "authenticated-token" })),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "anonymous-token" })),
      )
      .mockResolvedValueOnce(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    await api("/projects/p1", { method: "PUT" });
    await expect(api("/projects")).rejects.toMatchObject({ status: 401 });
    await api("/auth/login", { method: "POST", body: "{}" });
    expect(fetchMock.mock.calls[3][0]).toBe("/api/auth/csrf");
    expect(
      new Headers(fetchMock.mock.calls[4][1].headers).get("X-CSRF-TOKEN"),
    ).toBe("anonymous-token");
  });
});
