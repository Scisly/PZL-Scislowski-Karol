import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { api } from "../api";
import type { User } from "../types";
import { initials } from "../types";
import { useSession } from "../context";
import { usePageTitle, pageItems, useFilters } from "../hooks";
import { Search } from "../ui/Fields";
import {
  Badge,
  Button,
  Empty,
  Loading,
  Pagination,
  QueryError,
} from "../ui/Feedback";
import s from "./pages.module.css";
export function AdminPage() {
  const { user } = useSession();
  usePageTitle("Konta użytkowników");
  const filter = useFilters();
  const allowed = user?.roles.includes("Admin");
  const query = useQuery({
    queryKey: ["admin-users"],
    queryFn: ({ signal }) => api<User[]>("/admin/users", { signal }),
    enabled: allowed,
  });
  if (!allowed)
    return (
      <Empty
        title="Brak uprawnień"
        action={<Link to="/projects">Wróć do projektów</Link>}
      >
        Lista kont jest dostępna wyłącznie dla administratora. Twoje projekty i
        zadania pozostają dostępne.
      </Empty>
    );
  const search = filter.params.get("q") ?? "";
  const data = (query.data ?? []).filter((account) =>
    `${account.displayName} ${account.email}`
      .toLocaleLowerCase("pl")
      .includes(search.toLocaleLowerCase("pl")),
  );
  return (
    <>
      <div className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>ADMINISTRACJA</p>
          <h1>Konta użytkowników</h1>
          <p>Lista kont i ról w przestrzeni TaskFlow.</p>
        </div>
        <Badge tone="info">
          <ShieldCheck size={14} />
          Tylko do odczytu
        </Badge>
      </div>
      <section className={s.panel}>
        <div className={s.toolbar}>
          <Search
            label="Szukaj po nazwisku lub e-mailu"
            value={search}
            onChange={(value) => filter.set("q", value)}
          />
          <span className={s.muted}>{data.length} kont</span>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <QueryError error={query.error} retry={() => void query.refetch()} />
        ) : !data.length ? (
          <Empty
            title="Brak pasujących kont"
            action={
              search ? (
                <Button variant="outline" onClick={filter.clear}>
                  Wyczyść wyszukiwanie
                </Button>
              ) : undefined
            }
          >
            Zmień wyszukiwane nazwisko lub adres e-mail.
          </Empty>
        ) : (
          <>
            <div className={s.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Użytkownik</th>
                    <th scope="col">E-mail</th>
                    <th scope="col">Rola</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems(data, filter.page).map((account) => (
                    <tr key={account.id}>
                      <td>
                        <span className={s.userCell}>
                          <span className={s.avatar}>
                            {initials(account.displayName)}
                          </span>
                          <strong>{account.displayName}</strong>
                        </span>
                      </td>
                      <td>{account.email}</td>
                      <td>
                        {account.roles.map((role) => (
                          <Badge
                            key={role}
                            tone={role === "Admin" ? "info" : "neutral"}
                          >
                            {role === "Admin"
                              ? "Administrator"
                              : role === "Student"
                                ? "Student"
                                : role}
                          </Badge>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              total={data.length}
              page={filter.page}
              onChange={(page) => filter.set("page", String(page))}
            />
          </>
        )}
        <p className={s.panelNote}>
          Uprawnienia administratora nie dają dostępu do projektów bez
          członkostwa.
        </p>
      </section>
    </>
  );
}
