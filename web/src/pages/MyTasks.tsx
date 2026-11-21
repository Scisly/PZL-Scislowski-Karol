import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Member, Project, TaskItem } from "../types";
import { statuses } from "../types";
import { useSession } from "../context";
import { usePageTitle, useFilters } from "../hooks";
import { Search } from "../ui/Fields";
import {
  Button,
  ClearFilters,
  Empty,
  Loading,
  QueryError,
} from "../ui/Feedback";
import { Select as Choice } from "../ui/Select";
import { Modal } from "../ui/Modal";
import { TaskDetail } from "./TaskDetail";
import { TaskForm } from "./TaskForm";
import { TaskViews } from "./TaskViews";
import s from "./pages.module.css";
export function MyTasksPage() {
  const { user } = useSession();
  usePageTitle("Moje zadania");
  const filter = useFilters();
  const [selected, setSelected] = useState<TaskItem>();
  const query = useQuery({
    queryKey: ["my-tasks", user?.id],
    queryFn: ({ signal }) =>
      api<TaskItem[]>(`/tasks?assignedUserId=${user!.id}`, { signal }),
  });
  const search = filter.params.get("q") ?? "";
  const status = filter.params.get("status") ?? "";
  const data = query.data ?? [];
  const project = filter.params.get("project") ?? "";
  const projects = [
    ...new Map(
      data.map((task) => [task.projectId, task.projectName]),
    ).entries(),
  ];
  const filtered = data.filter(
    (task) =>
      (!status || task.status === status) &&
      (!project || task.projectId === project) &&
      task.title
        .toLocaleLowerCase("pl")
        .includes(search.toLocaleLowerCase("pl")),
  );
  return (
    <>
      <div className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>TWÓJ NASTĘPNY KROK</p>
          <h1>Moje zadania</h1>
          <p>Przypisane do Ciebie zadania ze wszystkich projektów.</p>
        </div>
      </div>
      <div className={s.panel}>
        <div className={s.taskToolbar}>
          <Search
            label="Szukaj zadania"
            value={search}
            onChange={(value) => filter.set("q", value)}
          />
          <Choice
            label="Status"
            value={status}
            onChange={(value) => filter.set("status", value)}
            options={[
              { value: "", label: "Wszystkie statusy" },
              ...Object.entries(statuses).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
          <Choice
            label="Projekt"
            value={project}
            onChange={(value) => filter.set("project", value)}
            options={[
              { value: "", label: "Wszystkie projekty" },
              ...projects.map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
        <div className={s.resultsLine}>
          <span>{filtered.length} zadań</span>
          <ClearFilters
            active={!!(search || status || project)}
            onClear={filter.clear}
          />
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <QueryError error={query.error} retry={() => void query.refetch()} />
        ) : !data.length ? (
          <Empty title="Wszystko pod kontrolą">
            Nie masz jeszcze przypisanych zadań. Wybierz projekt i ustalcie
            podział pracy w zespole.
          </Empty>
        ) : !filtered.length ? (
          <Empty
            title="Brak pasujących zadań"
            action={
              <Button variant="outline" onClick={filter.clear}>
                Wyczyść filtry
              </Button>
            }
          >
            Zmień wybrane filtry.
          </Empty>
        ) : (
          <TaskViews
            tasks={filtered}
            view="list"
            page={filter.page}
            onPage={(page) => filter.set("page", String(page))}
            onOpen={setSelected}
          />
        )}
      </div>
      {selected ? (
        <MyTaskOverlay task={selected} onClose={() => setSelected(undefined)} />
      ) : null}
    </>
  );
}
function MyTaskOverlay({
  task,
  onClose,
}: {
  task: TaskItem;
  onClose: () => void;
}) {
  const [edit, setEdit] = useState<TaskItem>();
  const project = useQuery({
    queryKey: ["project", task.projectId],
    queryFn: ({ signal }) =>
      api<Project>(`/projects/${task.projectId}`, { signal }),
  });
  const members = useQuery({
    queryKey: ["members", task.projectId],
    queryFn: ({ signal }) =>
      api<Member[]>(`/projects/${task.projectId}/members`, { signal }),
  });
  if (!project.data || !members.data)
    return (
      <Modal title="Szczegóły zadania" onClose={onClose}>
        {project.isError || members.isError ? (
          <QueryError
            error={project.error || members.error}
            retry={() => {
              void project.refetch();
              void members.refetch();
            }}
          />
        ) : (
          <Loading />
        )}
      </Modal>
    );
  return edit ? (
    <TaskForm
      project={project.data}
      members={members.data}
      task={edit}
      onClose={onClose}
    />
  ) : (
    <TaskDetail
      taskId={task.id}
      project={project.data}
      onClose={onClose}
      onEdit={setEdit}
    />
  );
}
