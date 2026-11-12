import { NotFoundException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum.js';
import { TasksService } from './tasks.service.js';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(() => {
    service = new TasksService(); // fresh in-memory store for every test
  });

  it('creates a task with status TODO by default', () => {
    const task = service.create({ title: 'Test' });
    expect(task.status).toBe(TaskStatus.TODO);
    expect(service.findAll()).toHaveLength(1);
  });

  it('returns tasks newest first', () => {
    service.create({ title: 'First' });
    service.create({ title: 'Second' });
    expect(service.findAll().map((t) => t.title)).toEqual(['Second', 'First']);
  });

  it('keeps fields that are not sent in an update', () => {
    const task = service.create({ title: 'Old', description: 'Keep me' });
    const updated = service.update(task.id, { title: 'New' });
    expect(updated).toMatchObject({ title: 'New', description: 'Keep me' });
  });

  it('throws NotFoundException for an unknown id', () => {
    expect(() => service.findOne('missing')).toThrow(NotFoundException);
    expect(() => service.remove('missing')).toThrow(NotFoundException);
  });
});
