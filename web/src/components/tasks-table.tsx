import { PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TaskStatusBadge } from '@/components/task-status-badge';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/types';

interface TasksTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

/** "2026-11-20" -> "Nov 20, 2026" (read as a local date, not UTC). */
function formatDate(isoDate: string): string {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00`).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' },
  );
}

/** Today's date as "YYYY-MM-DD" in local time. */
function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function TasksTable({ tasks, onEdit, onDelete }: TasksTableProps) {
  const today = todayIsoDate();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const isOverdue =
              task.dueDate !== null &&
              task.dueDate < today &&
              task.status !== 'DONE';

            return (
              <TableRow key={task.id}>
                <TableCell className="max-w-xs">
                  <div className="font-medium break-words whitespace-normal">
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="line-clamp-2 text-sm whitespace-normal text-muted-foreground">
                      {task.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={task.status} />
                </TableCell>
                <TableCell
                  className={cn(isOverdue && 'font-medium text-destructive')}
                >
                  {task.dueDate ? formatDate(task.dueDate) : '—'}
                  {isOverdue && <span className="sr-only"> (overdue)</span>}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {formatDate(task.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit "${task.title}"`}
                      onClick={() => onEdit(task)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete "${task.title}"`}
                      onClick={() => onDelete(task)}
                    >
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
