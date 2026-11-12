// Mirrors the Task returned by the NestJS API (api/src/tasks/task.entity.ts).

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** Date only, e.g. "2026-11-20". */
  dueDate: string | null;
  createdAt: string;
}

/** What the form sends to POST /tasks and PATCH /tasks/:id. */
export interface TaskInput {
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
}
