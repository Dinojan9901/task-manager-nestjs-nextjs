'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2Icon, PlusIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteTaskDialog } from '@/components/delete-task-dialog';
import { TaskFormDialog } from '@/components/task-form-dialog';
import { TasksTable } from '@/components/tasks-table';
import { tasksApi } from '@/lib/api';
import {
  STATUS_LABELS,
  TASK_STATUSES,
  type Task,
  type TaskInput,
  type TaskStatus,
} from '@/lib/types';

type StatusFilter = TaskStatus | 'ALL';
type SortOrder = 'newest' | 'due-asc' | 'due-desc';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

/** Sorts by due date; tasks without a due date always go last. */
function compareDueDates(a: Task, b: Task, order: SortOrder): number {
  if (a.dueDate === b.dueDate) return 0;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  const diff = a.dueDate.localeCompare(b.dueDate); // "YYYY-MM-DD" sorts as text
  return order === 'due-asc' ? diff : -diff;
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Load tasks on first render, and again when "Try again" is clicked.
  useEffect(() => {
    let ignore = false; // avoid setting state after unmount / a newer request
    tasksApi
      .list()
      .then((data) => {
        if (!ignore) setTasks(data);
      })
      .catch((error: unknown) => {
        if (!ignore) setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }

  // Filtering and sorting happen in the browser (the list is small).
  const visibleTasks = useMemo(() => {
    const filtered =
      statusFilter === 'ALL'
        ? tasks
        : tasks.filter((task) => task.status === statusFilter);
    if (sortOrder === 'newest') return filtered; // API already returns newest first
    return [...filtered].sort((a, b) => compareDueDates(a, b, sortOrder));
  }, [tasks, statusFilter, sortOrder]);

  function openCreateForm() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function openEditForm(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  // Errors are thrown on purpose: the form catches them and shows the message.
  async function handleSave(input: TaskInput) {
    if (editingTask) {
      const updated = await tasksApi.update(editingTask.id, input);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success('Task updated');
    } else {
      const created = await tasksApi.create(input);
      setTasks((prev) => [created, ...prev]);
      toast.success('Task created');
    }
    setFormOpen(false);
  }

  async function handleDelete() {
    if (!taskToDelete) return;
    try {
      await tasksApi.remove(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      toast.success('Task deleted');
      setTaskToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Create, track and finish your tasks.
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <PlusIcon /> New task
        </Button>
      </header>

      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortOrder}
          onValueChange={(value) => setSortOrder(value as SortOrder)}
        >
          <SelectTrigger className="w-52" aria-label="Sort tasks">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="due-asc">Due date (earliest first)</SelectItem>
            <SelectItem value="due-desc">Due date (latest first)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-md border py-16 text-muted-foreground"
        >
          <Loader2Icon className="size-4 animate-spin" /> Loading tasks…
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-12 text-center"
        >
          <p className="font-medium text-destructive">Could not load tasks</p>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button variant="outline" onClick={retry}>
            <RefreshCwIcon /> Try again
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed px-4 py-16 text-center">
          <p className="font-medium">No tasks yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first task to get started.
          </p>
          <Button onClick={openCreateForm}>
            <PlusIcon /> New task
          </Button>
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          No tasks match this filter.
        </div>
      ) : (
        <TasksTable
          tasks={visibleTasks}
          onEdit={openEditForm}
          onDelete={setTaskToDelete}
        />
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        onSubmit={handleSave}
      />
      <DeleteTaskDialog
        task={taskToDelete}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={handleDelete}
      />
    </main>
  );
}
