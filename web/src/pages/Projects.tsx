import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  Plus,
  Users,
} from "lucide-react";
import { api } from "../api";
import type { Project } from "../types";
import { dateLabel } from "../types";
import { useSession } from "../context";
import { usePageTitle, pageItems, useFilters } from "../hooks";
import { Search } from "../ui/Fields";
import {
  Badge,
  Button,
  ClearFilters,
  Empty,
  Loading,
  Pagination,
  QueryError,
} from "../ui/Feedback";
import { Select as Choice } from "../ui/Select";
import { ProjectForm } from "./ProjectForm";
import s from "./pages.module.css";
export function ProjectsPage() {
  const { user } = useSession();
  usePageTitle("Projekty");
  const query = useQuery({
    queryKey: ["projects"],
    queryFn: ({ signal }) => api<Project[]>("/projects", { signal }),
  });
  const filter = useFilters();
  const search = filter.params.get("q") ?? "";
  const archived = filter.params.get("archive") ?? "active";
  const [create, setCreate] = useState(false);
  const data = query.data ?? [];
  const active = data.filter((project) => !project.isArchived);
  const filtered = data.filter(
    (project) =>
      (archived === "all" ||
        project.isArchived === (archived === "archived")) &&
      `${project.name} ${project.courseName}`
        .toLocaleLowerCase("pl")
        .includes(search.toLocaleLowerCase("pl")),
  );
  const canCreate = user?.roles.some(
    (role) => role === "Student" || role === "Admin",
  );
  return (
    <>
      <div className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>TWOJA PRZESTRZEŃ</p>
          <h1>Projekty</h1>
          <p>Wspólny plan na każdy przedmiot.</p>
        </div>
        {canCreate ? (
          <Button onClick={() => setCreate(true)}>
            <Plus size={18} />
            Nowy projekt
          </Button>
        ) : null}
      </div>
      <div className={s.summary}>
        <div>
          <span className={s.summaryIcon}>
            <FolderKanban size={20} />
          </span>
          <div>
            <strong>{query.isPending ? "—" : active.length}</strong>
            <span>Aktywne projekty</span>
          </div>
        </div>
        <div>
          <span className={s.summaryIcon}>
            <CheckCircle2 size={20} />
          </span>
          <div>
            <strong>
              {query.isPending
                ? "—"
                : active.reduce(
                    (sum, project) => sum + project.completedTaskCount,
                    0,
                  )}
              <small>
                {" "}
                / {active.reduce((sum, project) => sum + project.taskCount, 0)}
              </small>
            </strong>
            <span>Ukończone zadania</span>
          </div>
        </div>
        <div>
          <span className={s.summaryIcon}>
            <CalendarDays size={20} />
          </span>
          <div>
            <strong className={s.summaryDate}>
              {active.length
                ? dateLabel(
                    [...active].sort((a, b) =>
                      a.deadline.localeCompare(b.deadline),
                    )[0].deadline,
                  )
                : "—"}
            </strong>
            <span>Najbliższy termin projektu</span>
          </div>
        </div>
      </div>
      <section className={s.projectSection}>
        <div className={s.sectionHeading}>
          <h2>
            Twoje projekty <span>{filtered.length}</span>
          </h2>
          <span className={s.muted}>
            Każdy dobry wynik zaczyna się od planu.
          </span>
        </div>
        <div className={s.toolbar}>
          <Search
            label="Szukaj po nazwie lub przedmiocie"
            value={search}
            onChange={(value) => filter.set("q", value)}
          />
          <Choice
            label="Widoczność projektów"
            value={archived}
            onChange={(value) => filter.set("archive", value)}
            options={[
              { value: "active", label: "Aktywne projekty" },
              { value: "archived", label: "Archiwum" },
              { value: "all", label: "Wszystkie projekty" },
            ]}
          />
          <ClearFilters
            active={!!search || archived !== "active"}
            onClear={filter.clear}
          />
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <QueryError error={query.error} retry={() => void query.refetch()} />
        ) : filtered.length ? (
          <>
            <div className={s.projectGrid}>
              {pageItems(filtered, filter.page).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  own={project.ownerId === user?.id}
                />
              ))}
            </div>
            <Pagination
              total={filtered.length}
              page={filter.page}
              onChange={(page) => filter.set("page", String(page))}
            />
          </>
        ) : data.length ? (
          <Empty
            title="Brak pasujących projektów"
            action={
              <Button variant="outline" onClick={filter.clear}>
                Wyczyść filtry
              </Button>
            }
          >
            Zmień wyszukiwanie lub widoczność projektów.
          </Empty>
        ) : (
          <Empty
            title="Tu zaczyna się wspólna praca"
            action={
              canCreate ? (
                <Button onClick={() => setCreate(true)}>
                  <Plus size={17} />
                  Utwórz pierwszy projekt
                </Button>
              ) : undefined
            }
          >
            Dodaj projekt i zaproś członków zespołu po adresie e-mail.
          </Empty>
        )}
      </section>
      {create ? <ProjectForm onClose={() => setCreate(false)} /> : null}
    </>
  );
}
function ProjectCard({ project, own }: { project: Project; own: boolean }) {
  const percent = project.taskCount
    ? Math.round((project.completedTaskCount / project.taskCount) * 100)
    : 0;
  return (
    <article className={s.projectCard}>
      <div className={s.cardTop}>
        <span className={s.course}>{project.courseName}</span>
        <Badge tone={project.isArchived ? "neutral" : own ? "info" : "neutral"}>
          {project.isArchived ? "Archiwum" : own ? "Właściciel" : "Członek"}
        </Badge>
      </div>
      <h3>
        <Link to={`/projects/${project.id}`}>
          {project.name}
          <ArrowUpRight size={19} />
        </Link>
      </h3>
      <p className={s.projectDescription}>
        {project.description ||
          "Dodajcie pierwsze zadania i wspólnie ustalcie kolejne kroki."}
      </p>
      <div className={s.progressHeading}>
        <span>Postęp projektu</span>
        <strong>{percent}%</strong>
      </div>
      <progress
        max="100"
        value={percent}
        aria-label={`Postęp projektu ${project.name}`}
      />
      <div className={s.cardBottom}>
        <span>
          <CalendarDays size={15} />
          {dateLabel(project.deadline)}
        </span>
        <span>
          <Users size={15} />
          {project.memberCount}
          <span className={s.srOnly}> członków</span>
        </span>
        <span>
          {project.completedTaskCount}/{project.taskCount} zadań
        </span>
      </div>
    </article>
  );
}
