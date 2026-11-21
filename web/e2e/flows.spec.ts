import { test, expect } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";
const password = () => {
  const value = process.env.DEMO_PASSWORD;
  if (!value)
    throw Error("Set DEMO_PASSWORD via the ignored .env and scripts/e2e.mjs.");
  return value;
};
const marker = () =>
  `E2E ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const expectedUnauthorized =
      message.text().includes("401") &&
      /\/api\/(auth\/(me|logout)|deadline-advice)/.test(message.location().url);
    if (!expectedUnauthorized) errors.push(message.text());
  });
});
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? [], "unexpected browser errors").toEqual(
    [],
  );
});
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel(/^E-mail(?:\s*\*)?$/).fill(email);
  await page.getByLabel(/^Hasło(?:\s*\*)?$/).fill(password());
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Projekty", exact: true }),
  ).toBeVisible();
}
async function apiLogin(
  request: APIRequestContext,
  email = "owner@taskflow.local",
) {
  let token = await (await request.get("/api/auth/csrf")).json();
  const response = await request.post("/api/auth/login", {
    data: { email, password: password() },
    headers: { "X-CSRF-TOKEN": token.token },
  });
  expect(response.ok()).toBeTruthy();
  token = await (await request.get("/api/auth/csrf")).json();
  return token.token as string;
}
async function cleanupProject(request: APIRequestContext, name: string) {
  const token = await apiLogin(request);
  const projects = (await (await request.get("/api/projects")).json()) as {
    id: string;
    name: string;
  }[];
  for (const project of projects.filter((item) => item.name === name)) {
    expect(
      (
        await request.delete(`/api/projects/${project.id}`, {
          headers: { "X-CSRF-TOKEN": token },
        })
      ).status(),
    ).toBe(204);
  }
}
async function createProject(page: Page, name: string) {
  await page.getByRole("button", { name: "Nowy projekt", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nazwa projektu").fill(name);
  await dialog
    .getByLabel(/^Przedmiot(?:\s*\*)?$/)
    .fill("Programowanie zaawansowane");
  await dialog.getByLabel("Termin oddania").fill("2027-06-18");
  await dialog
    .getByRole("button", { name: "Utwórz projekt", exact: true })
    .click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  return new URL(page.url()).pathname.split("/").pop()!;
}
async function select(page: Page, label: string, option: string) {
  await page
    .getByRole("dialog")
    .last()
    .getByRole("combobox", { name: label, exact: true })
    .click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test("owner completes project, task, comment, filter, archive/restore and deletion flow", async ({
  page,
  request,
}) => {
  const name = marker();
  try {
    await login(page, "owner@taskflow.local");
    await page.screenshot({
      path: "test-results/projects-desktop.png",
      fullPage: true,
    });
    await createProject(page, name);
    await page
      .getByRole("button", { name: "Nowe zadanie", exact: true })
      .click();
    let dialog = page.getByRole("dialog").last();
    await dialog.getByLabel("Tytuł zadania").fill("Przygotować model domeny");
    await dialog
      .getByLabel("Opis zadania")
      .fill("Encje, relacje i reguły projektu.");
    await select(page, "Priorytet", "Wysoki");
    await dialog.getByLabel("Termin zadania").fill("2027-06-10");
    await dialog
      .getByRole("button", { name: "Dodaj zadanie", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Przygotować model domeny",
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/kanban-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    const statusFilter = page.getByRole("combobox", {
      name: "Status",
      exact: true,
    });
    await statusFilter.focus();
    await page.keyboard.press("ArrowDown");
    const popup = page.getByRole("listbox", { name: "Status", exact: true });
    await expect(popup).toBeVisible();
    const triggerBox = await statusFilter.boundingBox();
    const popupBox = await popup.boundingBox();
    expect(Math.abs(triggerBox!.width - popupBox!.width)).toBeLessThanOrEqual(
      1,
    );
    expect(popupBox!.x).toBeGreaterThanOrEqual(0);
    expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(390);
    await page.screenshot({
      path: "test-results/kanban-mobile-select.png",
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await expect(statusFilter).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: "test-results/kanban-mobile.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page
      .getByRole("button", { name: "Przygotować model domeny", exact: true })
      .click();
    dialog = page.getByRole("dialog").last();
    await dialog
      .getByLabel("Dodaj komentarz")
      .fill("Ustalono zakres implementacji.");
    await dialog.getByRole("button", { name: "Edytuj zadanie" }).click();
    const discard = page.getByRole("dialog", {
      name: "Odrzucić niezapisane zmiany?",
      exact: true,
    });
    await expect(discard).toBeVisible();
    await discard.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog.getByLabel("Dodaj komentarz")).toHaveValue(
      "Ustalono zakres implementacji.",
    );
    await dialog
      .getByRole("button", { name: "Dodaj komentarz", exact: true })
      .click();
    await expect(
      dialog.getByText("Ustalono zakres implementacji.", { exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Edytuj", exact: true }).click();
    await dialog
      .getByLabel("Edytuj komentarz")
      .fill("Niezapisana zmiana komentarza");
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(discard).toBeVisible();
    await discard.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog.getByLabel("Edytuj komentarz")).toHaveValue(
      "Niezapisana zmiana komentarza",
    );
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await discard
      .getByRole("button", { name: "Odrzuć zmiany", exact: true })
      .click();
    await expect(
      dialog.getByText("Ustalono zakres implementacji.", { exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Edytuj zadanie" }).click();
    dialog = page.getByRole("dialog").last();
    await select(page, "Status", "Gotowe");
    await dialog.getByRole("button", { name: "Zapisz zmiany" }).click();
    await page.getByRole("button", { name: "Lista", exact: true }).click();
    await page
      .getByRole("searchbox", { name: "Szukaj zadania" })
      .fill("nieistniejące");
    await expect(
      page.getByRole("heading", { name: "Brak pasujących zadań" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Wyczyść wyszukiwanie" }).click();
    await expect(
      page.getByRole("button", { name: "Przygotować model domeny" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Archiwizuj", exact: true }).click();
    await page
      .getByRole("dialog")
      .last()
      .getByRole("button", { name: "Archiwizuj projekt" })
      .click();
    await expect(
      page.getByText("Projekt w archiwum", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Nowe zadanie", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Przywróć projekt" }).click();
    await expect(
      page.getByRole("button", { name: "Nowe zadanie" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Usuń projekt", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .last()
      .getByRole("button", { name: "Usuń projekt", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Projekty", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
  } finally {
    await cleanupProject(request, name);
  }
});

test("member works with shared tasks and comments while ownership remains enforced", async ({
  page,
  request,
}) => {
  const token = await apiLogin(request);
  const name = marker();
  const project = await (
    await request.post("/api/projects", {
      data: {
        name,
        courseName: "Praca zespołowa",
        description: null,
        deadline: "2027-06-18",
      },
      headers: { "X-CSRF-TOKEN": token },
    })
  ).json();
  try {
    const memberResponse = await request.post(
      `/api/projects/${project.id}/members`,
      {
        data: { email: "member@taskflow.local" },
        headers: { "X-CSRF-TOKEN": token },
      },
    );
    expect(memberResponse.ok()).toBeTruthy();
    const member = await memberResponse.json();
    await login(page, "member@taskflow.local");
    await page.goto(`/projects/${project.id}`);
    await expect(
      page.getByRole("button", { name: "Archiwizuj", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Usuń projekt", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Nowe zadanie" }).click();
    let dialog = page.getByRole("dialog").last();
    await dialog.getByLabel("Tytuł zadania").fill("Zadanie członka zespołu");
    await select(page, "Osoba odpowiedzialna", member.displayName);
    await select(page, "Status", "W toku");
    const [createdTaskResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname === "/api/tasks",
      ),
      dialog
        .getByRole("button", { name: "Dodaj zadanie", exact: true })
        .click(),
    ]);
    expect(createdTaskResponse.status()).toBe(201);
    const createdTask = (await createdTaskResponse.json()) as { id: string };
    await page.getByRole("link", { name: "Moje zadania", exact: true }).click();
    await page
      .getByRole("button", { name: "Zadanie członka zespołu", exact: true })
      .click();
    dialog = page.getByRole("dialog").last();
    await dialog
      .getByLabel("Dodaj komentarz")
      .fill("Pierwsza wersja komentarza");
    await dialog
      .getByRole("button", { name: "Dodaj komentarz", exact: true })
      .click();
    await dialog.getByRole("button", { name: "Edytuj", exact: true }).click();
    await dialog
      .getByLabel("Edytuj komentarz")
      .fill("Poprawiona wersja komentarza");
    await dialog
      .getByRole("button", { name: "Zapisz komentarz", exact: true })
      .click();
    await expect(
      dialog.getByText("Poprawiona wersja komentarza", { exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Usuń komentarz" }).click();
    await page
      .getByRole("dialog")
      .last()
      .getByRole("button", { name: "Usuń", exact: true })
      .click();
    await expect(
      page.getByText("Poprawiona wersja komentarza", { exact: true }),
    ).toHaveCount(0);
    await dialog.getByRole("button", { name: "Usuń", exact: true }).click();
    const [deletedTaskResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === "DELETE" &&
          new URL(response.url()).pathname === `/api/tasks/${createdTask.id}`,
      ),
      page
        .getByRole("dialog")
        .last()
        .getByRole("button", { name: "Usuń", exact: true })
        .click(),
    ]);
    expect(deletedTaskResponse.status()).toBe(204);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: "Zadanie członka zespołu",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Moje zadania" }),
    ).toBeVisible();
  } finally {
    const response = await request.delete(`/api/projects/${project.id}`, {
      headers: { "X-CSRF-TOKEN": token },
    });
    expect(response.status()).toBe(204);
  }
});

test("registration starts a student session and admin sees read-only accounts", async ({
  page,
}) => {
  const email = `student-${Date.now()}@taskflow.local`;
  await page.goto("/register");
  await page.getByLabel("Imię i nazwisko").fill("Student Testowy");
  await page.getByLabel(/^E-mail(?:\s*\*)?$/).fill(email);
  await page.getByLabel(/^Hasło(?:\s*\*)?$/).fill(password());
  await page.getByRole("button", { name: "Pokaż hasło" }).click();
  await expect(page.getByLabel(/^Hasło(?:\s*\*)?$/)).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Ukryj hasło" }).click();
  await page.getByRole("button", { name: "Utwórz konto", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Projekty", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tu zaczyna się wspólna praca" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Wyloguj się", exact: true }).click();
  await page
    .getByRole("dialog")
    .last()
    .getByRole("button", { name: "Wyloguj się", exact: true })
    .click();
  await login(page, "admin@taskflow.local");
  await page.getByRole("link", { name: "Konta użytkowników" }).click();
  await expect(
    page.getByRole("heading", { name: "Konta użytkowników" }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Szukaj po nazwisku lub e-mailu" })
    .fill(email);
  await expect(
    page.getByRole("cell", { name: email, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Tylko do odczytu", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Konta użytkowników" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test("expired cookie refreshes anonymous CSRF before reauth and preserves the task draft", async ({
  page,
  context,
  request,
}) => {
  await login(page, "owner@taskflow.local");
  const name = marker();
  try {
    await createProject(page, name);
    await page
      .getByRole("button", { name: "Nowe zadanie", exact: true })
      .click();
    const taskForm = page.getByRole("dialog", {
      name: "Nowe zadanie",
      exact: true,
    });
    await taskForm
      .getByLabel("Tytuł zadania")
      .fill("Szkic zachowany po wygaśnięciu sesji");
    await taskForm
      .getByLabel("Opis zadania")
      .fill("Nie utracimy tych ustaleń podczas ponownego logowania.");
    const csrfCookie = (await context.cookies()).find(
      (cookie) => cookie.name === "TaskFlow.Csrf",
    );
    expect(csrfCookie).toBeTruthy();
    await context.clearCookies({ name: "TaskFlow.Session" });
    expect(
      (await context.cookies()).some(
        (cookie) => cookie.name === "TaskFlow.Csrf",
      ),
    ).toBeTruthy();
    const expired = page.waitForResponse(
      (response) =>
        response.url().includes("/api/deadline-advice") &&
        response.status() === 401,
    );
    await taskForm.getByLabel("Termin zadania").fill("2027-05-17");
    await expired;
    const reauth = page.getByRole("dialog", {
      name: "Zaloguj się ponownie",
      exact: true,
    });
    await expect(reauth).toBeVisible();
    await reauth.getByLabel(/^Hasło(?:\s*\*)?$/).fill(password());
    const signedIn = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/login") && response.status() === 200,
    );
    await reauth
      .getByRole("button", { name: "Zaloguj się", exact: true })
      .click();
    await signedIn;
    await expect(reauth).toHaveCount(0);
    await expect(taskForm.getByLabel("Tytuł zadania")).toHaveValue(
      "Szkic zachowany po wygaśnięciu sesji",
    );
    await expect(taskForm.getByLabel("Opis zadania")).toHaveValue(
      "Nie utracimy tych ustaleń podczas ponownego logowania.",
    );
    await taskForm
      .getByRole("button", { name: "Dodaj zadanie", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Szkic zachowany po wygaśnięciu sesji",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Nowe zadanie", exact: true })
      .click();
    const abandonedDraft = page.getByRole("dialog", {
      name: "Nowe zadanie",
      exact: true,
    });
    await abandonedDraft
      .getByLabel("Tytuł zadania")
      .fill("Szkic porzucony przy zakończeniu sesji");
    await context.clearCookies({ name: "TaskFlow.Session" });
    const expiredAgain = page.waitForResponse(
      (response) =>
        response.url().includes("/api/deadline-advice") &&
        response.status() === 401,
    );
    await abandonedDraft.getByLabel("Termin zadania").fill("2027-05-18");
    await expiredAgain;
    const endSession = page.getByRole("dialog", {
      name: "Zaloguj się ponownie",
      exact: true,
    });
    const alreadyLoggedOut = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/logout") &&
        response.status() === 401,
    );
    await endSession
      .getByRole("button", { name: "Zakończ sesję", exact: true })
      .click();
    await alreadyLoggedOut;
    await expect(
      page.getByRole("heading", {
        name: "Zaloguj się do TaskFlow",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Moje zadania", exact: true }),
    ).toHaveCount(0);
  } finally {
    await cleanupProject(request, name);
  }
});
