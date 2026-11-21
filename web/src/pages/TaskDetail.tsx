import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  MessageSquare,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import { api, body } from "../api";
import type { Comment, Project, TaskItem } from "../types";
import { dateLabel, initials, priorities, statuses, timestamp } from "../types";
import { useNotice, useSession } from "../context";
import { useRefresh } from "../hooks";
import { Field } from "../ui/Fields";
import { Modal, Confirm } from "../ui/Modal";
import {
  Badge,
  Button,
  ErrorMessage,
  Loading,
  QueryError,
} from "../ui/Feedback";
import { useForm } from "../ui/useForm";
import s from "./pages.module.css";
import ui from "../ui/ui.module.css";
export function TaskDetail({
  taskId,
  project,
  onClose,
  onEdit,
}: {
  taskId: string;
  project: Project;
  onClose: () => void;
  onEdit: (task: TaskItem) => void;
}) {
  const taskQuery = useQuery({
    queryKey: ["task", taskId],
    queryFn: ({ signal }) => api<TaskItem>(`/tasks/${taskId}`, { signal }),
  });
  const comments = useQuery({
    queryKey: ["comments", taskId],
    queryFn: ({ signal }) =>
      api<Comment[]>(`/tasks/${taskId}/comments`, { signal }),
  });
  const [remove, setRemove] = useState(false);
  const notice = useNotice();
  const refresh = useRefresh();
  const task = taskQuery.data;
  return (
    <Modal
      title="Szczegóły zadania"
      description={project.name}
      onClose={onClose}
      wide
    >
      {taskQuery.isPending ? (
        <Loading />
      ) : taskQuery.isError ? (
        <QueryError
          error={taskQuery.error}
          retry={() => void taskQuery.refetch()}
        />
      ) : task ? (
        <>
          <div className={s.detailHeading}>
            <div className={s.badgeRow}>
              <Badge tone={task.status === "Done" ? "success" : "info"}>
                {statuses[task.status]}
              </Badge>
              <Badge tone={task.priority === "High" ? "warning" : "neutral"}>
                Priorytet: {priorities[task.priority]}
              </Badge>
            </div>
            <h3>{task.title}</h3>
            {!project.isArchived ? (
              <div className={s.detailActions}>
                <Button variant="outline" onClick={() => onEdit(task)}>
                  <Pencil size={15} />
                  Edytuj zadanie
                </Button>
                <Button variant="ghost" onClick={() => setRemove(true)}>
                  <Trash2 size={15} />
                  Usuń
                </Button>
              </div>
            ) : null}
          </div>
          <div className={s.detailMeta}>
            <span>
              <UserRound size={17} />
              {task.assignedUserName ?? "Nieprzypisane"}
            </span>
            <span>
              <CalendarDays size={17} />
              {dateLabel(task.dueDate)}
            </span>
          </div>
          <p className={s.detailDescription}>
            {task.description || "To zadanie nie ma jeszcze opisu."}
          </p>
          <small className={s.muted}>
            Ostatnia zmiana: {timestamp(task.updatedAt)}
          </small>
          <section className={s.comments}>
            <h3>
              <MessageSquare size={19} />
              Komentarze <span>{comments.data?.length ?? 0}</span>
            </h3>
            {comments.isPending ? (
              <Loading label="Wczytywanie komentarzy…" />
            ) : comments.isError ? (
              <QueryError
                error={comments.error}
                retry={() => void comments.refetch()}
              />
            ) : comments.data?.length ? (
              <ul>
                {comments.data.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    project={project}
                  />
                ))}
              </ul>
            ) : (
              <p className={s.muted}>
                Brak komentarzy. Dodaj pierwsze ustalenie do tego zadania.
              </p>
            )}
            {!project.isArchived ? (
              <CommentForm key={task.id} taskId={task.id} />
            ) : (
              <p className={s.archiveNote}>
                Projekt jest w archiwum. Komentarze są tylko do odczytu.
              </p>
            )}
          </section>
        </>
      ) : null}
      {remove && task ? (
        <Confirm
          title={`Usunąć zadanie „${task.title}”?`}
          description="Zadanie i wszystkie jego komentarze zostaną trwale usunięte."
          onClose={() => setRemove(false)}
          onConfirm={async () => {
            await api(`/tasks/${task.id}`, { method: "DELETE" });
            await refresh(["task", "comments"]);
            notice("Usunięto zadanie.");
            onClose();
          }}
        />
      ) : null}
    </Modal>
  );
}
function CommentItem({
  comment,
  project,
}: {
  comment: Comment;
  project: Project;
}) {
  const { user } = useSession();
  const [edit, setEdit] = useState(false);
  const [remove, setRemove] = useState(false);
  const mine = comment.authorId === user?.id;
  const canRemove = mine || project.ownerId === user?.id;
  const refresh = useRefresh();
  const notice = useNotice();
  return (
    <li className={s.comment}>
      <span className={s.avatar}>{initials(comment.authorName)}</span>
      <div className={s.commentBody}>
        <div className={s.commentMeta}>
          <strong>{comment.authorName}</strong>
          <time dateTime={comment.createdAt}>
            {timestamp(comment.createdAt)}
          </time>
        </div>
        {edit ? (
          <CommentForm
            taskId={comment.taskId}
            comment={comment}
            onClose={() => setEdit(false)}
          />
        ) : (
          <p>{comment.content}</p>
        )}
        {!project.isArchived && !edit ? (
          <div className={s.commentActions}>
            {mine ? (
              <Button variant="ghost" onClick={() => setEdit(true)}>
                Edytuj
              </Button>
            ) : null}
            {canRemove ? (
              <Button variant="ghost" onClick={() => setRemove(true)}>
                Usuń komentarz
              </Button>
            ) : null}
            {comment.updatedAt !== comment.createdAt ? (
              <small>Edytowano</small>
            ) : null}
          </div>
        ) : null}
      </div>
      {remove ? (
        <Confirm
          title="Usunąć komentarz?"
          description={`Komentarz autora ${comment.authorName} zostanie trwale usunięty.`}
          onClose={() => setRemove(false)}
          onConfirm={async () => {
            await api(`/comments/${comment.id}`, { method: "DELETE" });
            await refresh();
            notice("Usunięto komentarz.");
          }}
        />
      ) : null}
    </li>
  );
}
function CommentForm({
  taskId,
  comment,
  onClose,
}: {
  taskId: string;
  comment?: Comment;
  onClose?: () => void;
}) {
  const refresh = useRefresh();
  const notice = useNotice();
  const form = useForm(
    { content: comment?.content ?? "" },
    { content: { required: true, max: 2000 } },
    async (values, reset) => {
      await api(
        comment ? `/comments/${comment.id}` : `/tasks/${taskId}/comments`,
        {
          method: comment ? "PUT" : "POST",
          body: body({ content: values.content.trim() }),
        },
      );
      await refresh();
      notice(comment ? "Zapisano komentarz." : "Dodano komentarz.");
      if (onClose) onClose();
      else reset();
    },
  );
  return (
    <form
      noValidate
      onSubmit={form.submit}
      ref={form.formRef}
      className={s.commentForm}
    >
      <ErrorMessage error={form.error} />
      <Field
        label={comment ? "Edytuj komentarz" : "Dodaj komentarz"}
        multiline
        required
        maxLength={2000}
        autoFocus={!!comment}
        {...form.field("content")}
      />
      <div className={ui.actions}>
        {onClose ? (
          <Button variant="outline" onClick={onClose} disabled={form.busy}>
            Anuluj
          </Button>
        ) : null}
        <Button type="submit" busy={form.busy}>
          {comment ? "Zapisz komentarz" : "Dodaj komentarz"}
        </Button>
      </div>
    </form>
  );
}
