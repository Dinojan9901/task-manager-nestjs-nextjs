import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';

describe('Tasks API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app); // same ValidationPipe + CORS as main.ts
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  describe('happy path', () => {
    it('POST /tasks creates a task with defaults (201)', async () => {
      const res = await api()
        .post('/tasks')
        .send({ title: '  Write README  ' })
        .expect(201);

      expect(res.body).toMatchObject({
        title: 'Write README', // trimmed
        description: null,
        status: 'TODO', // default status
        dueDate: null,
      });
      expect(res.body.id).toEqual(expect.any(String));
      expect(res.body.createdAt).toEqual(expect.any(String));
    });

    it('lists, reads, updates and deletes a task', async () => {
      const { body: created } = await api()
        .post('/tasks')
        .send({ title: 'Buy milk', description: 'Full cream', dueDate: '2026-12-01' })
        .expect(201);

      const list = await api().get('/tasks').expect(200);
      expect(list.body).toHaveLength(1);

      const one = await api().get(`/tasks/${created.id}`).expect(200);
      expect(one.body.title).toBe('Buy milk');

      const patched = await api()
        .patch(`/tasks/${created.id}`)
        .send({ status: 'DONE', description: null })
        .expect(200);
      expect(patched.body).toMatchObject({
        title: 'Buy milk', // not sent, so unchanged
        status: 'DONE',
        description: null, // cleared with null
        dueDate: '2026-12-01',
      });

      await api().delete(`/tasks/${created.id}`).expect(204);
      await api().get(`/tasks/${created.id}`).expect(404);
    });
  });

  describe('400 Bad Request (validation)', () => {
    it.each([
      ['a missing title', {}],
      ['a blank title', { title: '   ' }],
      ['an invalid status', { title: 'A', status: 'LATER' }],
      ['an invalid dueDate', { title: 'A', dueDate: 'not-a-date' }],
      ['an unknown field', { title: 'A', priority: 'HIGH' }],
    ])('POST /tasks rejects %s', async (_label, body) => {
      const res = await api().post('/tasks').send(body).expect(400);
      expect(res.body.message).toEqual(expect.any(Array)); // list of errors
    });

    it('PATCH /tasks/:id rejects a null title', async () => {
      const { body: created } = await api()
        .post('/tasks')
        .send({ title: 'Keep me' })
        .expect(201);

      await api().patch(`/tasks/${created.id}`).send({ title: null }).expect(400);
    });
  });

  describe('404 Not Found', () => {
    const missingId = 'does-not-exist';

    it('GET /tasks/:id', async () => {
      const res = await api().get(`/tasks/${missingId}`).expect(404);
      expect(res.body.message).toContain(missingId);
    });

    it('PATCH /tasks/:id', async () => {
      await api().patch(`/tasks/${missingId}`).send({ status: 'DONE' }).expect(404);
    });

    it('DELETE /tasks/:id', async () => {
      await api().delete(`/tasks/${missingId}`).expect(404);
    });
  });
});
