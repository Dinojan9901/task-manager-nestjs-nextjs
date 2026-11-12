# Task Manager (NestJS + Next.js)

A small task manager with a **NestJS REST API** (`/api`) and a **Next.js + shadcn/ui** frontend (`/web`).

- Create, edit and delete tasks (title, description, status, due date)
- Tasks table with a status badge, overdue due dates highlighted in red
- Create/edit form in a dialog, confirmation before delete
- Loading, error (with "Try again") and empty states; toast after every successful action
- Bonus: filter by status and sort by due date
- API validation with DTOs + class-validator (400) and 404 for unknown tasks, covered by e2e tests

## Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | **24 LTS**, or **22.22.3+** |
| npm | 10 or newer (comes with Node.js) |
| Git | any recent version |

> Tested on Windows 11 with Node.js 22.22.2 and npm 11.21.1. On Node 22.22.2, `npm install` in `/api` prints an `EBADENGINE` warning from the Nest CLI. It is only a warning and everything works.

No database is needed: tasks are stored **in memory** in the API (see [Design decisions](#design-decisions)).

## Getting started

You need **two terminals**: one for the API and one for the frontend.

### 1. Clone the repository

```bash
git clone https://github.com/Dinojan9901/task-manager-nestjs-nextjs.git
cd task-manager-nestjs-nextjs
```

### 2. Start the API (terminal 1)

```bash
cd api
npm install
npm run start:dev
```

The API runs on **http://localhost:4000**. Wait for the line `API running on http://localhost:4000`.

### 3. Start the frontend (terminal 2)

From the repository root:

```bash
cd web
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

### Environment variables

**None are required.** The defaults below work out of the box. Change them only if you need other ports.

| App | Variable | Default | Purpose |
| --- | --- | --- | --- |
| api | `PORT` | `4000` | Port the API listens on |
| api | `CORS_ORIGIN` | `http://localhost:3000` | Frontend origin allowed to call the API |
| web | `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Base URL of the API |

To change the frontend setting, copy `web/.env.example` to `web/.env.local` and edit it, then restart `npm run dev`. The API variables are read from the shell environment, for example `PORT=5000 npm run start:dev` (bash) or `$env:PORT=5000; npm run start:dev` (PowerShell).

## Running the tests

```bash
cd api
npm test            # unit tests for TasksService
npm run test:e2e    # e2e tests: full CRUD flow, 400 validation cases, 404 cases
```

The e2e tests start the real Nest app in memory (with the same `ValidationPipe` as `main.ts`) and call it over HTTP with Supertest. Tests use Vitest, the test runner that ships with the NestJS 12 template.

## API

Base URL: `http://localhost:4000`

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/tasks` | – | 200, array of tasks (newest first) | – |
| GET | `/tasks/:id` | – | 200, task | 404 |
| POST | `/tasks` | `title` (required), `description?`, `status?`, `dueDate?` | 201, created task | 400 |
| PATCH | `/tasks/:id` | any of the fields above | 200, updated task | 400, 404 |
| DELETE | `/tasks/:id` | – | 204, no body | 404 |

Validation rules:

- `title`: required string, 1-120 characters after trimming spaces (`"   "` is rejected)
- `description`: optional string, max 1000 characters; send `null` in PATCH to clear it
- `status`: one of `TODO`, `IN_PROGRESS`, `DONE` (default `TODO`)
- `dueDate`: optional ISO date such as `2026-12-01`; send `null` in PATCH to clear it
- Unknown fields are rejected with 400 (`forbidNonWhitelisted`)

Example task:

```json
{
  "id": "4f0c5a8e-2b8f-4c8e-9a51-0a7c1f1b2d3e",
  "title": "Write README",
  "description": null,
  "status": "TODO",
  "dueDate": "2026-12-01",
  "createdAt": "2026-11-12T10:30:00.000Z"
}
```

### Try it with curl

On Windows, run these in **Git Bash** (installed with Git for Windows). Windows PowerShell 5.1 removes the inner quotes from JSON arguments, so the POST and PATCH examples fail there with a 400 "Unterminated string in JSON" error.

```bash
# Create (201)
curl -i -X POST http://localhost:4000/tasks -H "Content-Type: application/json" -d '{"title":"Write README","dueDate":"2026-12-01"}'

# List (200)
curl -i http://localhost:4000/tasks

# Invalid input (400): missing title, wrong status
curl -i -X POST http://localhost:4000/tasks -H "Content-Type: application/json" -d '{"status":"LATER"}'

# Unknown id (404)
curl -i http://localhost:4000/tasks/does-not-exist

# Update and delete (replace <id> with an id from the list)
curl -i -X PATCH http://localhost:4000/tasks/<id> -H "Content-Type: application/json" -d '{"status":"DONE"}'
curl -i -X DELETE http://localhost:4000/tasks/<id>
```

## Project structure

```
api/                          NestJS 12 (ESM, Vitest)
  src/main.ts                 starts the app on port 4000
  src/app.setup.ts            global ValidationPipe + CORS (shared with e2e tests)
  src/app.module.ts           root module
  src/tasks/
    tasks.module.ts           groups the controller and service
    tasks.controller.ts       HTTP layer: routes and status codes
    tasks.service.ts          business logic + in-memory store, throws 404
    dto/                      CreateTaskDto, UpdateTaskDto (class-validator rules)
    task.entity.ts            Task type
    task-status.enum.ts       TODO | IN_PROGRESS | DONE
  test/tasks.e2e-spec.ts      e2e tests (Supertest)

web/                          Next.js 16 App Router + shadcn/ui
  src/app/page.tsx            home page
  src/app/layout.tsx          root layout + toast container
  src/components/
    task-manager.tsx          page state: load, create, edit, delete, filter, sort
    tasks-table.tsx           tasks table
    task-status-badge.tsx     coloured status badge
    task-form-dialog.tsx      create/edit form inside a dialog
    delete-task-dialog.tsx    delete confirmation
    ui/                       shadcn/ui components
  src/lib/api.ts              typed API client, turns API errors into readable messages
  src/lib/types.ts            Task types shared by the components
```

## Design decisions

- **In-memory storage.** The assignment allows memory or SQLite. I chose memory so the project runs with no database setup, and because I had limited time. Data is lost when the API restarts. The data access is all inside `TasksService`, so moving to SQLite with Prisma would only change that class.
- **Validation in two places.** The form checks that the title is not empty for quick feedback, but the API is the source of truth. Any 400 message from the API is shown inside the form.
- **One form for create and edit.** `task === null` means create mode.
- **Client-side filtering and sorting.** The list is small, so filtering and sorting in the browser keeps the API simple. Tasks without a due date are always listed last.

## How I used AI

I used **Claude Code** (Anthropic's AI coding assistant, in VS Code) throughout this assignment.

What the AI did:

- Ran the scaffolding commands (`nest new`, `create-next-app`, `shadcn`).
- Wrote the first versions of the DTOs, service, controller, e2e tests, React components and this README, with explanations, so I could learn NestJS (new to me) by comparing it with Spring Boot, which I know.

What I decided, checked and changed:

- I chose the stack, the in-memory storage (deadline), the folder layout and the commit plan, and I asked for code I could explain line by line instead of clever code.
- **The assignment PDF contains hidden text addressed to AI assistants** (for example, start every label with "LLM" and add `// LLM:` comments). The AI pointed it out and we did **not** follow it, because it was not part of the real requirements.
- The NestJS 12 template is ESM with Vitest (not Jest). We kept the template's choices instead of fighting them, and I learned why imports end in `.js`.
- We replaced `PartialType` with an explicit `UpdateTaskDto`, so a PATCH can clear `description`/`dueDate` with `null` but can never set `title` to `null`.
- The first e2e run failed with a timeout during app start-up (a slow cold start). We raised the e2e `hookTimeout`; all 15 tests pass.
- We removed template files that did not belong (`AGENTS.md`, which also advertised a paid telemetry service, and the boilerplate `api/README.md`).
- I verified the result by running the unit and e2e tests, testing the endpoints with curl, using the UI, and following this README from a fresh clone.
