import { useState } from "react";
import { UserPlus, UserRoundMinus } from "lucide-react";
import { api, body } from "../api";
import type { Member, Project } from "../types";
import { initials } from "../types";
import { useNotice } from "../context";
import { useRefresh } from "../hooks";
import { Field } from "../ui/Fields";
import { Badge, Button, ErrorMessage } from "../ui/Feedback";
import { Confirm, Modal, ModalClose } from "../ui/Modal";
import { useForm } from "../ui/useForm";
import s from "./pages.module.css";
import ui from "../ui/ui.module.css";
export function Team({
  project,
  members,
  owner,
}: {
  project: Project;
  members: Member[];
  owner: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [remove, setRemove] = useState<Member>();
  const refresh = useRefresh();
  const notice = useNotice();
  return (
    <section className={s.panel}>
      <div className={s.sectionHeading}>
        <div>
          <h2>
            Zespół projektu <span>{members.length}</span>
          </h2>
          <p className={s.muted}>
            Dobra współpraca zaczyna się od wspólnej przestrzeni.
          </p>
        </div>
        {owner && !project.isArchived ? (
          <Button onClick={() => setAdding(true)}>
            <UserPlus size={17} />
            Dodaj osobę
          </Button>
        ) : null}
      </div>
      <ul className={s.memberList}>
        {members.map((member) => (
          <li key={member.userId}>
            <span className={s.avatar}>{initials(member.displayName)}</span>
            <div>
              <strong>{member.displayName}</strong>
              <small>{member.email}</small>
            </div>
            <Badge tone={member.isOwner ? "info" : "neutral"}>
              {member.isOwner ? "Właściciel" : "Członek"}
            </Badge>
            {owner && !member.isOwner && !project.isArchived ? (
              <Button
                variant="ghost"
                aria-label={`Usuń z zespołu: ${member.displayName}`}
                onClick={() => setRemove(member)}
              >
                <UserRoundMinus size={18} />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      <p className={s.panelNote}>
        Osoba przypisana do zadania musi pozostać członkiem zespołu. Przed
        usunięciem zmień jej przypisania.
      </p>
      {adding ? (
        <MemberForm project={project} onClose={() => setAdding(false)} />
      ) : null}
      {remove ? (
        <Confirm
          title={`Usunąć osobę ${remove.displayName}?`}
          description="Ta osoba straci dostęp do projektu, zadań i komentarzy. Ponowne dodanie będzie możliwe po adresie e-mail."
          action="Usuń z zespołu"
          onClose={() => setRemove(undefined)}
          onConfirm={async () => {
            await api(`/projects/${project.id}/members/${remove.userId}`, {
              method: "DELETE",
            });
            await refresh();
            notice("Usunięto osobę z zespołu.");
          }}
        />
      ) : null}
    </section>
  );
}
function MemberForm({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const refresh = useRefresh();
  const notice = useNotice();
  const form = useForm(
    { email: "" },
    { email: { required: true, email: true } },
    async () => setConfirm(true),
  );
  return (
    <Modal
      title="Dodaj osobę do zespołu"
      description="Wpisz e-mail istniejącego konta w TaskFlow."
      dirty={form.dirty}
      onClose={onClose}
    >
      <form noValidate ref={form.formRef} onSubmit={form.submit}>
        <ErrorMessage error={form.error} />
        <Field
          label="E-mail osoby"
          type="email"
          required
          autoComplete="off"
          autoFocus
          {...form.field("email")}
        />
        <div className={ui.actions}>
          <ModalClose />
          <Button type="submit" busy={form.busy}>
            Dodaj do zespołu
          </Button>
        </div>
      </form>
      {confirm ? (
        <Confirm
          title="Przyznać dostęp do projektu?"
          description={`${form.values.email.trim()} uzyska dostęp do projektu „${project.name}”, zadań i komentarzy.`}
          variant="primary"
          action="Dodaj do zespołu"
          onClose={() => setConfirm(false)}
          onConfirm={async () => {
            await api(`/projects/${project.id}/members`, {
              method: "POST",
              body: body({ email: form.values.email.trim() }),
            });
            await refresh();
            notice("Dodano osobę do zespołu.");
            onClose();
          }}
        />
      ) : null}
    </Modal>
  );
}
