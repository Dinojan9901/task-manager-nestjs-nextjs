import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TaskStatus } from './task-status.enum.js';
import type { Task } from './task.entity.js';

@Injectable()
export class TasksService {
  // In-memory store (id -> task). Data is reset when the server restarts.
  private readonly tasks = new Map<string, Task>();

  findAll(): Task[] {
    // A Map keeps insertion order, so reversing gives newest first.
    return [...this.tasks.values()].reverse();
  }

  findOne(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) {
      // Nest turns this exception into a 404 response.
      throw new NotFoundException(`Task with id "${id}" not found`);
    }
    return task;
  }

  create(dto: CreateTaskDto): Task {
    const task: Task = {
      id: randomUUID(),
      title: dto.title,
      description: dto.description || null, // "" or missing -> null
      status: dto.status ?? TaskStatus.TODO,
      dueDate: dto.dueDate ?? null,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id: string, dto: UpdateTaskDto): Task {
    const existing = this.findOne(id); // throws 404 if missing

    // undefined = "field not sent, keep the old value".
    const updated: Task = {
      ...existing,
      title: dto.title ?? existing.title,
      status: dto.status ?? existing.status,
      description:
        dto.description === undefined
          ? existing.description
          : dto.description || null,
      dueDate: dto.dueDate === undefined ? existing.dueDate : dto.dueDate,
    };
    this.tasks.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    this.findOne(id); // throws 404 if missing
    this.tasks.delete(id);
  }
}
