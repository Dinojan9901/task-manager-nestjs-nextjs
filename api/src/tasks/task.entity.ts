import { TaskStatus } from './task-status.enum.js';

/** The shape of a task as it is stored and returned by the API. */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** Date only, e.g. "2026-11-20". */
  dueDate: string | null;
  /** ISO timestamp set by the server. */
  createdAt: string;
}
