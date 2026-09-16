# Support ticket portal

Technical assessment. An internal support portal: employees open tickets, and the support team tracks, filters and moves them through the status workflow.

FastAPI with SQLite on the backend, React with TypeScript on the frontend.

A note on languages: code, comments and the API contract are in English, while the interface and the error messages shown to users are in Portuguese, since the end users are Brazilian employees.

## Running the project

Requires Python 3.11+ and Node 18+.

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Linux / macOS

pip install -r requirements-dev.txt
python -m app.seed            # optional, creates 12 sample tickets
uvicorn app.main:app --reload
```

The API runs on http://127.0.0.1:8000 and Swagger is at `/docs`. The database (`tickets.db`) is created on the first run. To rebuild the sample data: `python -m app.seed --reset`.

**Frontend**, in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Opens at http://localhost:5173. Vite already proxies `/api` to the backend, so there is nothing else to configure.

**Tests**: run `pytest` inside `backend` (45 tests covering the API and the status workflow). On the frontend, `npm run build` runs the type check along with the build.

Environment variables are all optional and documented in the `.env.example` files: `DATABASE_URL` and `CORS_ORIGINS` on the backend, `VITE_API_URL` on the frontend (only needed if you are not using the Vite proxy).

## Layout

```
backend/
  app/
    main.py        app creation, CORS, routes
    config.py      configuration through environment variables
    database.py    engine and session
    errors.py      domain error -> HTTP status
    seed.py        sample data
    domain/        business rules (enums, status workflow, exceptions)
    models/        tables
    schemas/       API input and output
    services/      create, list, detail, change status
    routers/       endpoints
  tests/
frontend/
  src/
    api/           HTTP client and API calls
    components/    table, filters, badges, history, screen states
    constants/     Portuguese labels and filter options
    hooks/         async loading and list parameters
    pages/         list, detail, new ticket
    types/         types mirroring the API contracts
```

On the backend the path is always `router -> service -> model`. The router only deals with HTTP (parameters, status codes, serialization) and the service runs the use case. What is actually a business rule (which status transitions are valid, how much each priority weighs) lives in `domain/`, with no framework dependency, which keeps those tests very direct.

## API

Everything under `/api`, JSON, dates in UTC using ISO format.

| Method | Route | What it does | Errors |
|---|---|---|---|
| `GET` | `/tickets` | List with filters, sorting and pagination | 422 |
| `POST` | `/tickets` | Creates the ticket (201 + `Location` header) | 422 |
| `GET` | `/tickets/{id}` | Detail with history and valid next statuses | 404 |
| `PATCH` | `/tickets/{id}/status` | Moves the status forward | 404, 409, 422 |
| `GET` | `/health` | Health check | |

Filters on `GET /tickets`: `status` (`open`, `in_progress`, `resolved`, `closed`), `category` (`it`, `facilities`, `hr`, `finance`, `other`) and `priority` (`low`, `medium`, `high`, `urgent`). Sorting through `sort_by` (`created_at` or `priority`) and `order` (`asc` or `desc`), defaulting to newest first. Pagination through `page` and `page_size`.

Creating a ticket:

```http
POST /api/tickets

{
  "title": "Notebook não liga",
  "description": "A luz de energia pisca e depois apaga.",
  "category": "it",
  "priority": "urgent"
}
```

The response carries the ticket, its `history` (creation is recorded as `null -> open`) and `allowed_transitions`, the list of statuses that ticket can move to from where it is now. Changing the status is a `PATCH /api/tickets/{id}/status` with `{"status": "in_progress"}`.

Business errors come back as `{"detail": "message"}`, and validation errors use the standard FastAPI format with the list of invalid fields.

## Decisions

**FastAPI.** Most of the work here is validating input and returning JSON, which is exactly what Pydantic handles on its own. Swagger comes for free on top of that, which makes the API easy to try out without Postman. Django would have brought an admin, templates and its own ORM that this project would not use.

**SQLite with SQLAlchemy.** I picked it with the reviewer in mind: clone, install and run, with no service to stand up. Since all access goes through SQLAlchemy, moving to Postgres means changing `DATABASE_URL` and the driver. I did consider storing everything in a JSON file, but filtering, sorting, pagination and the ticket-to-history relationship would all be far more fragile by hand than in SQL.

**History in its own table.** Every change is a row with the source status, the target status and a timestamp. That gives an audit trail that is never rewritten, and later it can carry who made the change or a comment without touching the tickets table.

**The workflow rule lives on the backend.** The map of allowed transitions sits in one place (`app/domain/workflow.py`) and the API answers 409 if anyone tries to skip a step, even when calling it outside the interface. The ticket detail returns `allowed_transitions`, so the screen only renders valid buttons without repeating the rule in JavaScript.

**A dedicated endpoint for the status** instead of a generic `PATCH /tickets/{id}`. Changing status is not an ordinary edit: it has its own validation and it writes history. A separate endpoint makes that explicit and keeps a generic update from bypassing the workflow.

**Sorting by priority with numeric weights.** Sorting the column directly would return alphabetical order (`high, low, medium, urgent`), which means nothing to a support team. The query uses a `CASE` mapping each priority to a number. On a tie the oldest ticket comes first, since that is the one that has been waiting the longest.

**A `version` column on the ticket.** If two people from support act on the same ticket at the same time, the second one gets a 409 instead of silently overwriting the first. The screen reloads the ticket to show its real state.

**No state library on the frontend.** The scope is small, and a hook with `AbortController` already covers loading and error states while cancelling the previous request, so a slow response from an older filter never overwrites the current screen. On a larger project I would reach for TanStack Query because of the caching.

Filters live in the URL, so the page can be reloaded and a filtered view can be shared as a link.

## Assumptions

**No authentication, and this was a deliberate call.** The brief names two actors, the employee who submits and the support team who manages, but it does not ask for login. Building half of an authentication system (tokens without refresh, weak password storage) would be worse than not building it at all, and it would consume the time budget of the exercise. So both personas share the same interface here.

What that means in practice: anyone can open a ticket, which matches how a support portal actually works, and anyone can move the status, which is the part real authentication would restrict. With login in place, the role would come from the session, the frontend would render the transition buttons only for support, and the backend would enforce that permission the same way it already enforces the status workflow today.

**Tickets do not record who opened them.** This is the gap I would close first. Support can see the ticket but not who to reply to. With authentication the requester comes from the session; without it, a requester field on the form solves it. I left it out to keep the data model aligned with the decision above rather than inventing an identity the system cannot verify.

Other assumptions:

- The workflow is strictly linear: one step forward at a time, no going back, and Closed is final.
- Fixed categories: IT, Facilities, HR, Finance and Other.
- Tickets are not edited or deleted after creation.
- The form starts with Medium priority selected, and choosing a category is mandatory.

## Limitations

- Tables are created at startup, without Alembic. Fine for a prototype, but it does not version schema changes.
- SQLite has limited concurrent writes. Good enough for a small team, not for heavy usage.
- Offset pagination, which is simple but degrades on large volumes.
- Validation exists on both sides (the backend is the source of truth, the frontend is there for immediate feedback), so the limits have to be kept in sync by hand.
- Tests are on the backend, where the rules are. On the frontend I relied on TypeScript.

## With more time

- Login with roles: an employee sees their own tickets, support sees the queue, and the history records who changed what.
- A requester and an assignee on each ticket, plus comments.
- Reopening a resolved ticket with a required reason.
- Alembic and Postgres.
- Component tests with Vitest and an end-to-end test of the main flow.
- Full-text search and multi-value filters.
