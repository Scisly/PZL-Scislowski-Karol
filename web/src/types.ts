export type User = {
  id: string;
  displayName: string;
  email: string;
  roles: string[];
};
export type Project = {
  id: string;
  name: string;
  courseName: string;
  description: string | null;
  deadline: string;
  isArchived: boolean;
  ownerId: string;
  createdAt: string;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
};
export type Member = {
  userId: string;
  displayName: string;
  email: string;
  isOwner: boolean;
};
export type TaskStatus = "Todo" | "InProgress" | "Done";
export type Priority = "Low" | "Normal" | "High";
export type TaskItem = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  createdAt: string;
  updatedAt: string;
};
export type Comment = {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
export type DeadlineAdvice = {
  date: string;
  warnings: { code: string; message: string }[];
};
export const statuses: Record<TaskStatus, string> = {
  Todo: "Do zrobienia",
  InProgress: "W toku",
  Done: "Gotowe",
};
export const priorities: Record<Priority, string> = {
  Low: "Niski",
  Normal: "Normalny",
  High: "Wysoki",
};
export const dateLabel = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat("pl-PL", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(`${date}T12:00:00`))
    : "Bez terminu";
export const timestamp = (date: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Warsaw",
  }).format(new Date(date));
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
