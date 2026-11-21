import { api, body } from "../api";
import type { Member, Project, TaskItem } from "../types";
import { priorities, statuses } from "../types";
import { useNotice } from "../context";
import { useRefresh } from "../hooks";
import { Field } from "../ui/Fields";
import { Modal, ModalClose } from "../ui/Modal";
import { Select as Choice } from "../ui/Select";
import { Button, ErrorMessage } from "../ui/Feedback";
import { Advice } from "../ui/Advice";
import { useForm } from "../ui/useForm";
import ui from "../ui/ui.module.css";
export function TaskForm({
  project,
  members,
  task,
  onClose,
}: {
  project: Project;
  members: Member[];
  task?: TaskItem;
  onClose: () => void;
}) {
  const notice = useNotice();
  const refresh = useRefresh();
  const form = useForm(
    {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "Todo",
      priority: task?.priority ?? "Normal",
      dueDate: task?.dueDate ?? "",
      assignedUserId: task?.assignedUserId ?? "",
    },
    {
      title: { required: true, max: 200 },
      description: { max: 4000 },
      dueDate: { maxDate: project.deadline },
    },
    async (values) => {
      const data = {
        ...values,
        title: values.title.trim(),
        description: values.description.trim() || null,
        dueDate: values.dueDate || null,
        assignedUserId: values.assignedUserId || null,
        ...(!task ? { projectId: project.id } : {}),
      };
      await api(task ? `/tasks/${task.id}` : "/tasks", {
        method: task ? "PUT" : "POST",
        body: body(data),
      });
      await refresh();
      notice(task ? "Zapisano zmiany zadania." : "Dodano zadanie.");
      onClose();
    },
  );
  return (
    <Modal
      title={task ? "Edytuj zadanie" : "Nowe zadanie"}
      description={project.name}
      onClose={onClose}
      dirty={form.dirty && !form.busy}
    >
      <form noValidate onSubmit={form.submit} ref={form.formRef}>
        <ErrorMessage error={form.error} />
        <Field
          label="Tytuł zadania"
          required
          maxLength={200}
          autoFocus
          {...form.field("title")}
        />
        <Field
          label="Opis zadania"
          multiline
          maxLength={4000}
          {...form.field("description")}
        />
        <div className={ui.formRow}>
          <Choice
            label="Status"
            options={Object.entries(statuses).map(([value, label]) => ({
              value,
              label,
            }))}
            {...form.field("status")}
          />
          <Choice
            label="Priorytet"
            options={Object.entries(priorities).map(([value, label]) => ({
              value,
              label,
            }))}
            {...form.field("priority")}
          />
        </div>
        <Choice
          label="Osoba odpowiedzialna"
          options={[
            { value: "", label: "Nieprzypisane" },
            ...members.map((member) => ({
              value: member.userId,
              label: member.displayName,
            })),
          ]}
          {...form.field("assignedUserId")}
        />
        <Field
          label="Termin zadania"
          type="date"
          max={project.deadline}
          hint="Termin nie może przekraczać terminu oddania projektu."
          {...form.field("dueDate")}
        />
        <Advice date={form.values.dueDate} />
        <div className={ui.actions}>
          <ModalClose disabled={form.busy} />
          <Button type="submit" busy={form.busy}>
            {task ? "Zapisz zmiany" : "Dodaj zadanie"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
