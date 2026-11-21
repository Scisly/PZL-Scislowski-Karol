import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import { api } from "../api";
import type { Member, Project, TaskItem } from "../types";
import { dateLabel, statuses } from "../types";
import { useNotice, useSession } from "../context";
import { useFilters, useRefresh, usePageTitle } from "../hooks";
import { Search } from "../ui/Fields";
import {
  ErrorMessage,
  Badge,
  Button,
  ClearFilters,
  Empty,
  Loading,
  QueryError,
} from "../ui/Feedback";
import { Select as Choice } from "../ui/Select";
import { Confirm } from "../ui/Modal";
import { ProjectForm } from "./ProjectForm";
import { TaskForm } from "./TaskForm";
import { TaskDetail } from "./TaskDetail";
import { TaskViews } from "./TaskViews";
import { Team } from "./Team";
import s from "./pages.module.css";
export function ProjectPage() {
  const { id } = useParams();
  const { user } = useSession();
  const filter = useFilters();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const notice = useNotice();
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState<"delete" | "archive">();
  const [formTask, setFormTask] = useState<TaskItem | "new">();
  const [detail, setDetail] = useState<string>();
  const [restoreError, setRestoreError] = useState<unknown>();
  const [restoring, setRestoring] = useState(false);
  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: ({ signal }) => api<Project>(`/projects/${id}`, { signal }),
  });
  const membersQuery = useQuery({
    queryKey: ["members", id],
    queryFn: ({ signal }) =>
      api<Member[]>(`/projects/${id}/members`, { signal }),
  });
  const tasksQuery = useQuery({
    queryKey: ["tasks", id],
    queryFn: ({ signal }) =>
      api<TaskItem[]>(`/tasks?projectId=${id}`, { signal }),
  });
  usePageTitle(projectQuery.data?.name ?? "Projekt");
  if (projectQuery.isPending) return <Loading />;
  if (projectQuery.isError)
    return (
      <QueryError
        error={projectQuery.error}
        retry={() => void projectQuery.refetch()}
      />
    );
  const project = projectQuery.data;
  const owner = project.ownerId === user?.id;
  const members = membersQuery.data ?? [];
  const tab = filter.params.get("tab") ?? "kanban";
  const search = filter.params.get("q") ?? "";
  const status = filter.params.get("status") ?? "";
  const assigned = filter.params.get("assigned") ?? "";
  const priority = filter.params.get("priority") ?? "";
  const tasks = tasksQuery.data ?? [];
  const filtered = tasks.filter(
    (task) =>
      (!status || task.status === status) &&
      (!assigned ||
        (assigned === "none"
          ? !task.assignedUserId
          : task.assignedUserId === assigned)) &&
      (!priority || task.priority === priority) &&
      `${task.title} ${task.description ?? ""}`
        .toLocaleLowerCase("pl")
        .includes(search.toLocaleLowerCase("pl")),
  );
  const filtersActive = !!(search || status || assigned || priority);
  return (
    <>
      <Link className={s.backLink} to="/projects">
        <ArrowLeft size={15} />
        Wszystkie projekty
      </Link>
      <div className={s.projectHeader}>
        <div className={s.projectHeaderMain}>
          <p className={s.eyebrow}>{project.courseName}</p>
          <h1>{project.name}</h1>
          <p className={s.projectIntro}>
            {project.description ||
              "Wspólna przestrzeń na zadania i ustalenia zespołu."}
          </p>
          <div className={s.projectMeta}>
            <span>
              <CalendarDays size={16} />
              Oddanie: {dateLabel(project.deadline)}
            </span>
            <span>
              <Users size={16} />
              {project.memberCount} osób w zespole
            </span>
            <Badge tone={owner ? "info" : "neutral"}>
              {owner ? "Właściciel projektu" : "Członek zespołu"}
            </Badge>
          </div>
        </div>
        {owner ? (
          <div className={s.projectActions}>
            {project.isArchived ? (
              <Button
                variant="outline"
                busy={restoring}
                onClick={async () => {
                  setRestoring(true);
                  setRestoreError(undefined);
                  try {
                    await api(`/projects/${id}/restore`, { method: "POST" });
                    await refresh();
                    notice("Przywrócono projekt.");
                  } catch (error) {
                    setRestoreError(error);
                  } finally {
                    setRestoring(false);
                  }
                }}
              >
                <RotateCcw size={16} />
                Przywróć projekt
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEdit(true)}>
                  <Pencil size={16} />
                  Edytuj
                </Button>
                <Button variant="ghost" onClick={() => setConfirm("archive")}>
                  <Archive size={16} />
                  Archiwizuj
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={() => setConfirm("delete")}
              aria-label="Usuń projekt"
              title="Usuń projekt"
            >
              <Trash2 size={17} />
            </Button>
          </div>
        ) : null}
      </div>
      {restoreError ? <ErrorMessage error={restoreError} /> : null}
      {project.isArchived ? (
        <div className={s.archiveBanner}>
          <Archive size={20} />
          <div>
            <strong>Projekt w archiwum</strong>
            <p>
              Zadania, zespół i komentarze są tylko do odczytu.
              {owner ? " Przywróć projekt, aby kontynuować pracę." : ""}
            </p>
          </div>
        </div>
      ) : null}
      <div className={s.projectProgress}>
        <span>Postęp projektu</span>
        <progress
          max={project.taskCount || 1}
          value={project.completedTaskCount}
          aria-label="Postęp projektu"
        />
        <strong>
          {project.completedTaskCount} / {project.taskCount} zadań
        </strong>
      </div>
      <div className={s.tabBar}>
        <nav className={s.tabs} aria-label="Widok projektu">
          {[
            { value: "kanban", label: "Kanban", icon: LayoutGrid },
            { value: "list", label: "Lista", icon: List },
            { value: "team", label: "Zespół", icon: Users },
          ].map((item) => (
            <button
              key={item.value}
              className={tab === item.value ? s.tabActive : ""}
              aria-current={tab === item.value ? "page" : undefined}
              onClick={() => filter.set("tab", item.value)}
            >
              <item.icon size={17} />
              {item.label}
              {item.value === "team" ? <span>{members.length}</span> : null}
            </button>
          ))}
        </nav>
        {tab !== "team" && !project.isArchived ? (
          <Button
            onClick={() => setFormTask("new")}
            disabled={membersQuery.isPending || membersQuery.isError}
          >
            <Plus size={17} />
            Nowe zadanie
          </Button>
        ) : null}
      </div>
      {tab === "team" ? (
        membersQuery.isPending ? (
          <Loading />
        ) : membersQuery.isError ? (
          <QueryError
            error={membersQuery.error}
            retry={() => void membersQuery.refetch()}
          />
        ) : (
          <Team project={project} members={members} owner={owner} />
        )
      ) : (
        <>
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
              label="Przypisanie"
              value={assigned}
              onChange={(value) => filter.set("assigned", value)}
              options={[
                { value: "", label: "Wszystkie osoby" },
                { value: "none", label: "Nieprzypisane" },
                ...members.map((member) => ({
                  value: member.userId,
                  label: member.displayName,
                })),
              ]}
            />
            <Choice
              label="Priorytet"
              value={priority}
              onChange={(value) => filter.set("priority", value)}
              options={[
                { value: "", label: "Wszystkie priorytety" },
                { value: "High", label: "Wysoki" },
                { value: "Normal", label: "Normalny" },
                { value: "Low", label: "Niski" },
              ]}
            />
          </div>
          <div className={s.resultsLine}>
            <span>
              {filtered.length} z {tasks.length} zadań
            </span>
            <ClearFilters active={filtersActive} onClear={filter.clear} />
          </div>
          {tasksQuery.isPending ? (
            <Loading />
          ) : tasksQuery.isError ? (
            <QueryError
              error={tasksQuery.error}
              retry={() => void tasksQuery.refetch()}
            />
          ) : tasks.length === 0 ? (
            <Empty
              title="Zróbcie pierwszy krok"
              action={
                !project.isArchived ? (
                  <Button
                    onClick={() => setFormTask("new")}
                    disabled={!membersQuery.data}
                  >
                    <Plus size={17} />
                    Dodaj pierwsze zadanie
                  </Button>
                ) : undefined
              }
            >
              Podzielcie projekt na zadania, przypiszcie osoby i ustalcie
              terminy.
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
              Spróbuj innego tytułu lub zmień wybrane filtry.
            </Empty>
          ) : (
            <TaskViews
              tasks={filtered}
              view={tab}
              onOpen={(task) => setDetail(task.id)}
              page={filter.page}
              onPage={(page) => filter.set("page", String(page))}
              canCreate={!project.isArchived}
              onCreate={() => setFormTask("new")}
            />
          )}
        </>
      )}
      {edit ? (
        <ProjectForm project={project} onClose={() => setEdit(false)} />
      ) : null}
      {formTask ? (
        <TaskForm
          project={project}
          members={members}
          task={formTask === "new" ? undefined : formTask}
          onClose={() => setFormTask(undefined)}
        />
      ) : null}
      {detail ? (
        <TaskDetail
          taskId={detail}
          project={project}
          onClose={() => setDetail(undefined)}
          onEdit={(task) => {
            setDetail(undefined);
            setFormTask(task);
          }}
        />
      ) : null}
      {confirm ? (
        <Confirm
          title={
            confirm === "delete"
              ? `Usunąć projekt „${project.name}”?`
              : `Zarchiwizować projekt „${project.name}”?`
          }
          description={
            confirm === "delete"
              ? "Projekt, zadania, komentarze i członkostwa zostaną trwale usunięte. Tej operacji nie można cofnąć."
              : "Projekt i cała jego zawartość staną się tylko do odczytu. Możesz go później przywrócić."
          }
          variant={confirm === "delete" ? "danger" : "warning"}
          action={confirm === "delete" ? "Usuń projekt" : "Archiwizuj projekt"}
          onClose={() => setConfirm(undefined)}
          onConfirm={async () => {
            if (confirm === "delete") {
              await api(`/projects/${id}`, { method: "DELETE" });
              await refresh([
                "project",
                "tasks",
                "task",
                "comments",
                "members",
              ]);
              notice("Usunięto projekt.");
              navigate("/projects");
            } else {
              await api(`/projects/${id}/archive`, { method: "POST" });
              await refresh();
              notice("Zarchiwizowano projekt.");
            }
          }}
        />
      ) : null}
    </>
  );
}
