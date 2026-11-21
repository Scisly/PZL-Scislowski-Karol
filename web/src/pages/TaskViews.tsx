import {
  CalendarDays,
  Circle,
  CircleCheck,
  CircleDot,
  UserRound,
} from "lucide-react";
import type { TaskItem, TaskStatus } from "../types";
import { dateLabel, priorities, statuses } from "../types";
import { Badge, Button, Empty, Pagination } from "../ui/Feedback";
import { pageItems } from "../hooks";
import s from "./pages.module.css";
const StatusIcons = { Todo: Circle, InProgress: CircleDot, Done: CircleCheck };
export function TaskViews({
  tasks,
  view,
  onOpen,
  page,
  onPage,
  canCreate,
  onCreate,
}: {
  tasks: TaskItem[];
  view: string;
  onOpen: (task: TaskItem) => void;
  page: number;
  onPage: (page: number) => void;
  canCreate?: boolean;
  onCreate?: () => void;
}) {
  if (view === "kanban")
    return (
      <div className={s.kanban}>
        {(Object.keys(statuses) as TaskStatus[]).map((status) => {
          const Icon = StatusIcons[status];
          const items = tasks.filter((task) => task.status === status);
          return (
            <section className={s.kanbanColumn} key={status}>
              <h3>
                <span>
                  <Icon size={17} />
                  {statuses[status]}
                </span>
                <span>{items.length}</span>
              </h3>
              <div className={s.taskStack}>
                {items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpen={() => onOpen(task)}
                  />
                ))}
                {!items.length ? (
                  <p className={s.columnEmpty}>Brak zadań w tym statusie.</p>
                ) : null}
                {canCreate && status === "Todo" ? (
                  <Button variant="ghost" onClick={onCreate}>
                    + Dodaj zadanie
                  </Button>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    );
  if (!tasks.length)
    return (
      <Empty title="Brak pasujących zadań">
        Zmień filtry lub dodaj zadanie do projektu.
      </Empty>
    );
  return (
    <>
      <div className={s.tableWrap}>
        <table>
          <thead>
            <tr>
              <th scope="col">Zadanie</th>
              <th scope="col">Status</th>
              <th scope="col">Priorytet</th>
              <th scope="col">Osoba</th>
              <th scope="col">Termin</th>
            </tr>
          </thead>
          <tbody>
            {pageItems(tasks, page).map((task) => (
              <tr key={task.id}>
                <td>
                  <button className={s.tableTitle} onClick={() => onOpen(task)}>
                    {task.title}
                  </button>
                  <small className={s.tableProject}>{task.projectName}</small>
                </td>
                <td>
                  <Badge
                    tone={
                      task.status === "Done"
                        ? "success"
                        : task.status === "InProgress"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {statuses[task.status]}
                  </Badge>
                </td>
                <td>
                  <Badge
                    tone={task.priority === "High" ? "warning" : "neutral"}
                  >
                    {priorities[task.priority]}
                  </Badge>
                </td>
                <td>{task.assignedUserName ?? "Nieprzypisane"}</td>
                <td>{dateLabel(task.dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination total={tasks.length} page={page} onChange={onPage} />
    </>
  );
}
function TaskCard({ task, onOpen }: { task: TaskItem; onOpen: () => void }) {
  return (
    <article className={s.taskCard}>
      <div className={s.taskPriority}>
        <Badge tone={task.priority === "High" ? "warning" : "neutral"}>
          {priorities[task.priority]}
        </Badge>
      </div>
      <h4>
        <button onClick={onOpen}>{task.title}</button>
      </h4>
      {task.description ? <p>{task.description}</p> : null}
      <div className={s.taskMeta}>
        <span>
          <CalendarDays size={14} />
          {dateLabel(task.dueDate)}
        </span>
        <span title={task.assignedUserName ?? "Nieprzypisane"}>
          <UserRound size={14} />
          {task.assignedUserName?.split(" ")[0] ?? "Brak osoby"}
        </span>
      </div>
    </article>
  );
}
