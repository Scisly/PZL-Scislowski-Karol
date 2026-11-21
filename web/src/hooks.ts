import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · TaskFlow`;
  }, [title]);
}
export function useFilters() {
  const [params, setParams] = useSearchParams();
  function set(key: string, value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  }
  function clear() {
    setParams((current) => {
      const next = new URLSearchParams();
      const tab = current.get("tab");
      if (tab) next.set("tab", tab);
      return next;
    });
  }
  return {
    params,
    set,
    clear,
    page: Math.max(1, Number(params.get("page")) || 1),
  };
}
export function useRefresh() {
  const client = useQueryClient();
  return async (skipRefetch: string[] = []) => {
    await Promise.all(
      [
        "projects",
        "project",
        "tasks",
        "task",
        "comments",
        "members",
        "my-tasks",
      ].map((key) =>
        client.invalidateQueries({
          queryKey: [key],
          refetchType: skipRefetch.includes(key) ? "none" : "active",
        }),
      ),
    );
  };
}
export function pageItems<T>(items: T[], page: number, size = 12) {
  return items.slice(
    (Math.min(page, Math.max(1, Math.ceil(items.length / size))) - 1) * size,
    Math.min(page, Math.max(1, Math.ceil(items.length / size))) * size,
  );
}
