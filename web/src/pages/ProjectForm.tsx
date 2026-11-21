import { useNavigate } from "react-router-dom";
import { api, body } from "../api";
import type { Project } from "../types";
import { useNotice } from "../context";
import { useRefresh } from "../hooks";
import { Field } from "../ui/Fields";
import { Modal, ModalClose } from "../ui/Modal";
import { Button, ErrorMessage } from "../ui/Feedback";
import { Advice } from "../ui/Advice";
import { useForm } from "../ui/useForm";
import ui from "../ui/ui.module.css";
export function ProjectForm({
  project,
  onClose,
}: {
  project?: Project;
  onClose: () => void;
}) {
  const notice = useNotice();
  const refresh = useRefresh();
  const navigate = useNavigate();
  const form = useForm(
    {
      name: project?.name ?? "",
      courseName: project?.courseName ?? "",
      description: project?.description ?? "",
      deadline: project?.deadline ?? "",
    },
    {
      name: { required: true, max: 200 },
      courseName: { required: true, max: 150 },
      description: { max: 4000 },
      deadline: { required: true },
    },
    async (values) => {
      const result = await api<Project>(
        project ? `/projects/${project.id}` : "/projects",
        {
          method: project ? "PUT" : "POST",
          body: body({
            ...values,
            name: values.name.trim(),
            courseName: values.courseName.trim(),
            description: values.description.trim() || null,
          }),
        },
      );
      await refresh();
      notice(project ? "Zapisano zmiany projektu." : "Utworzono projekt.");
      onClose();
      if (!project) navigate(`/projects/${result.id}`);
    },
  );
  return (
    <Modal
      title={project ? "Edytuj projekt" : "Nowy projekt"}
      description="Ustalcie temat i termin. Zadania dodacie w kolejnym kroku."
      onClose={onClose}
      dirty={form.dirty && !form.busy}
    >
      <form noValidate ref={form.formRef} onSubmit={form.submit}>
        <ErrorMessage error={form.error} />
        <Field
          label="Nazwa projektu"
          required
          maxLength={200}
          autoFocus
          {...form.field("name")}
        />
        <Field
          label="Przedmiot"
          required
          maxLength={150}
          placeholder="np. Programowanie zaawansowane"
          {...form.field("courseName")}
        />
        <Field
          label="Opis projektu"
          multiline
          maxLength={4000}
          hint="Cel, zakres lub najważniejsze ustalenia zespołu."
          {...form.field("description")}
        />
        <Field
          label="Termin oddania"
          type="date"
          required
          {...form.field("deadline")}
        />
        <Advice date={form.values.deadline} />
        <div className={ui.actions}>
          <ModalClose disabled={form.busy} />
          <Button type="submit" busy={form.busy}>
            {project ? "Zapisz zmiany" : "Utwórz projekt"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
