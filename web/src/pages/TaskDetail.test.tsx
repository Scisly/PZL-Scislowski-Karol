import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { TaskDetail } from "./TaskDetail";
import type { Project, TaskItem } from "../types";
vi.mock("../context", () => ({
  useSession: () => ({ user: { id: "u1" } }),
  useNotice: () => vi.fn(),
}));
const project: Project = {
  id: "p1",
  name: "Projekt",
  courseName: "Przedmiot",
  deadline: "2027-06-18",
  description: null,
  isArchived: false,
  ownerId: "u1",
  createdAt: "2026-11-21T12:00:00Z",
  memberCount: 1,
  taskCount: 1,
  completedTaskCount: 0,
};
const task: TaskItem = {
  id: "t1",
  projectId: "p1",
  projectName: "Projekt",
  title: "Zadanie",
  description: null,
  status: "Todo",
  priority: "Normal",
  dueDate: null,
  assignedUserId: null,
  assignedUserName: null,
  createdAt: "2026-11-21T12:00:00Z",
  updatedAt: "2026-11-21T12:00:00Z",
};
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(["task", "t1"], task);
  client.setQueryData(
    ["comments", "t1"],
    [
      {
        id: "c1",
        taskId: "t1",
        authorId: "u1",
        authorName: "Student",
        content: "Zapisany komentarz",
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
    ],
  );
  const onEdit = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <TaskDetail
        taskId="t1"
        project={project}
        onEdit={onEdit}
        onClose={() => {}}
      />
    </QueryClientProvider>,
  );
  return { onEdit };
}
describe("comment draft protection", () => {
  it("guards switching to task edit and preserves a new comment after cancelling discard", async () => {
    const user = userEvent.setup();
    const { onEdit } = setup();
    await user.type(
      screen.getByLabelText("Dodaj komentarz", { exact: false }),
      "Nowy szkic",
    );
    await user.click(screen.getByRole("button", { name: "Edytuj zadanie" }));
    expect(onEdit).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Odrzucić niezapisane zmiany?" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Anuluj" }));
    expect(
      screen.getByLabelText("Dodaj komentarz", { exact: false }),
    ).toHaveValue("Nowy szkic");
    await user.click(screen.getByRole("button", { name: "Edytuj zadanie" }));
    await user.click(screen.getByRole("button", { name: "Odrzuć zmiany" }));
    expect(onEdit).toHaveBeenCalledWith(task);
  });
  it("guards cancelling an edited comment and only discards on explicit confirmation", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Edytuj" }));
    const editor = screen.getByLabelText("Edytuj komentarz", { exact: false });
    await user.clear(editor);
    await user.type(editor, "Zmieniony szkic");
    await user.click(screen.getByRole("button", { name: "Anuluj" }));
    expect(
      screen.getByRole("heading", { name: "Odrzucić niezapisane zmiany?" }),
    ).toBeVisible();
    await user.click(screen.getAllByRole("button", { name: "Anuluj" }).at(-1)!);
    expect(editor).toHaveValue("Zmieniony szkic");
    await user.click(screen.getByRole("button", { name: "Anuluj" }));
    await user.click(screen.getByRole("button", { name: "Odrzuć zmiany" }));
    expect(
      screen.queryByLabelText("Edytuj komentarz", { exact: false }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Zapisany komentarz")).toBeVisible();
  });
});
