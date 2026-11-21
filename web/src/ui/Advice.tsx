import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { api } from "../api";
import type { DeadlineAdvice } from "../types";
import s from "./ui.module.css";
export function Advice({ date }: { date: string }) {
  const query = useQuery({
    queryKey: ["advice", date],
    queryFn: ({ signal }) =>
      api<DeadlineAdvice>(`/deadline-advice?date=${encodeURIComponent(date)}`, {
        signal,
      }),
    enabled: !!date,
    retry: false,
    staleTime: 300000,
  });
  if (!date) return null;
  if (query.isPending)
    return (
      <p className={s.hint} role="status">
        Sprawdzanie kalendarza — zapis jest dostępny.
      </p>
    );
  if (query.isError)
    return (
      <p className={s.hint}>
        Kalendarz jest niedostępny. Możesz zapisać wybrany termin.
      </p>
    );
  return query.data.warnings.length ? (
    <div className={s.advice}>
      {query.data.warnings.map((warning) => (
        <p key={warning.code}>
          <AlertTriangle size={15} />
          {warning.message}
        </p>
      ))}
    </div>
  ) : null;
}
