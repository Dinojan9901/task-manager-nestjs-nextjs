import type { Task, TaskInput } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** An error with a message that is safe to show to the user. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Shape of NestJS error responses, e.g. { statusCode: 400, message: [...], error: "Bad Request" } */
interface NestErrorBody {
  message?: string | string[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    // fetch only throws on network errors (server down, CORS, offline).
    throw new ApiError(
      `Cannot reach the API at ${API_URL}. Is the backend running?`,
      0,
    );
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as NestErrorBody | null;
    // Validation errors (400) come as a list of messages; others as one string.
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? `Request failed with status ${res.status}`);
    throw new ApiError(message, res.status);
  }

  // 204 No Content (DELETE) has no body to parse.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const tasksApi = {
  list: () => request<Task[]>('/tasks'),

  create: (input: TaskInput) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) }),

  update: (id: string, input: TaskInput) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};
