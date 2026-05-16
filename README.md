# Loop Social Server Side - Production-Ready Backend

## Overview

Loop Social is an Express/MongoDB backend for a small social network. The original project supported user registration/login, profile management, following/unfollowing users, creating posts, liking posts, commenting, and deleting owned posts.

This refactor preserves those core API contracts while turning the project into a production-grade reference implementation. The upgrade moves route logic into a layered architecture, validates all external input, centralizes errors and logging, adds security middleware, introduces automated API documentation, adds Docker/CI support, and includes unit, integration, and E2E tests with coverage gates above 80%.

## Original Project Analysis

The starter code used Node.js, Express, MongoDB, Mongoose, JWT, and bcrypt. It worked as a learning project, but it had several limitations that are common in beginner backends:

- Route handlers directly contained business logic, persistence logic, and HTTP response formatting.
- Runtime configuration was read directly from `process.env` without validation.
- Errors were handled inconsistently with `console.log` and repeated `try/catch` blocks.
- Mongoose calls included bugs such as `Post.findAll`, which is not a Mongoose API.
- Passwords could be exposed unless every query remembered to exclude them.
- Protected routes used JWT auth, but there was no authorization helper for roles.
- There were no tests, no coverage gate, no CI workflow, and no documented local setup.
- There was no OpenAPI documentation, health check, structured logging, or production container story.

## Architecture Highlights

The project now uses a modular monolith with clear layers:

```text
src/
  app.js                              # Express app composition
  server.js                           # Runtime startup and graceful shutdown
  config/                             # Environment loading and validation
  domain/errors/                      # Framework-independent application errors
  infrastructure/
    database/
      models/                         # Mongoose schemas
      repositories/                   # Persistence access layer
    docs/                             # OpenAPI/Swagger setup
    http/
      controllers/                    # HTTP request/response orchestration
      middlewares/                    # Auth, validation, error handling
      routes/                         # API route declarations
      validators/                     # Zod request schemas
    jobs/                             # BullMQ-backed background job adapter
    logging/                          # Pino structured logger
tests/
  unit/
  integration/
  e2e/
```

Controllers now translate HTTP concerns into service calls. Services hold business rules such as “users cannot follow themselves” or “a user can only comment once on a post.” Repositories isolate Mongoose access so persistence details do not leak through the rest of the codebase.

## Key Production Features Added

- Configuration: `.env` values are loaded and validated with Zod in `src/config/env.js`.
- Auth: JWT authentication is centralized, and `authorize(...roles)` supports role checks for future admin endpoints.
- Validation: Zod schemas validate request bodies and params at the API boundary.
- Error handling: async route wrappers and global error middleware return consistent structured JSON.
- Logging: Pino and `pino-http` emit structured JSON logs with token/password redaction.
- Security: Helmet, CORS, rate limiting, JSON body limits, Mongo operator sanitization, and disabled `x-powered-by`.
- Database: Mongoose connection pooling options, sanitized schemas, indexes, and repository pattern.
- Product feed: cursor-based home timeline from the authenticated user and their followings.
- Discovery: public post explore endpoint with tag/text search and paginated user search.
- Engagement: bookmarks, shares, likes, comments, social graph counts, and post-level creator analytics.
- Notifications: follow, like, comment, and share notifications with unread filtering and read receipts.
- Background jobs: BullMQ is used when `REDIS_URL` is configured; tests/dev can use the same queue interface without Redis.
- Observability: `/health` returns service status, uptime, and timestamp for load balancers and deploy checks.
- API docs: Swagger UI is available at `/api/docs`.
- DevOps: Dockerfile, Docker Compose, GitHub Actions CI, ESLint, Prettier, Husky, and lint-staged.

## Testing Strategy

The project uses a test pyramid:

- Unit tests cover service rules, middleware branches, error mapping, and queue behavior.
- Integration tests exercise MongoDB-backed API flows with `mongodb-memory-server`.
- E2E-style tests verify externally visible security behavior.

Coverage is enforced by Jest:

```bash
npm run test:coverage
```

Current verified coverage:

- Statements: 95.41%
- Branches: 82.03%
- Functions: 94.28%
- Lines: 95.32%

## Getting Started

Prerequisites:

- Node.js 20+
- npm 10+
- MongoDB 7+
- Redis 7+ for production background jobs

Setup:

```bash
cp .env.example .env
npm install
npm run db:sync-indexes
npm run dev
```

The API runs on `http://localhost:8800` by default.

Useful commands:

```bash
npm run dev            # Start with nodemon
npm start              # Start production runtime
npm run lint           # Run ESLint
npm run format         # Format files with Prettier
npm test               # Run tests
npm run test:coverage  # Run tests with coverage gates
```

Important endpoints:

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users`
- `GET /api/users/search?q=backend`
- `GET /api/users/bookmarks`
- `GET /api/users/:id/social-graph`
- `PATCH /api/users/update-profile`
- `POST /api/posts/create-post`
- `GET /api/posts/feed?limit=20&cursor=2026-01-01T00:00:00.000Z`
- `GET /api/posts/explore?tag=node`
- `PATCH /api/posts/:id/bookmark`
- `PATCH /api/posts/:id/unbookmark`
- `POST /api/posts/:id/share`
- `GET /api/posts/:id/analytics`
- `GET /api/notifications?unreadOnly=true`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `GET /api/docs`

## Docker Deployment

Build and run the API:

```bash
docker build -t loop-social-api .
docker run --env-file .env -p 8800:8800 loop-social-api
```

Run the full local stack:

```bash
docker compose up --build
```

Compose starts:

- API on port `8800`
- MongoDB on port `27017`
- Redis on port `6379`

## Why These Changes Matter

Separating controllers, services, and repositories makes the code testable and easier to change. A route can change without rewriting business rules, and MongoDB can be isolated behind repository functions.

Validating environment variables prevents broken deployments from starting with missing secrets or invalid ports. This is a core 12-factor practice: config belongs in the environment, not hardcoded in application code.

Validating request input at the boundary protects the domain logic from malformed payloads. Controllers should receive known-good data, not defensive guesses.

Global error handling creates predictable client responses and prevents sensitive stack traces from leaking. It also keeps route handlers focused on success paths.

Structured logs make production debugging practical. JSON logs can be indexed by platforms such as Datadog, Loki, CloudWatch, or ELK.

Health checks enable zero-downtime deployments in load-balanced and containerized environments. Platforms can remove unhealthy instances before users are affected.

Background jobs keep slow side effects out of request latency. Today the queue records registration audit events; the same pattern can support emails, notifications, media processing, or fan-out tasks.

CI, linting, formatting, and pre-commit hooks make quality repeatable. Senior-level projects do not rely on memory or manual discipline for basic checks.

## Learning Takeaways

- Config is not code. Validate environment variables before starting the server.
- Validate every external input before it reaches business logic.
- Keep HTTP, domain rules, and database access in separate layers.
- Centralize error handling so every endpoint behaves consistently.
- Use structured logs and redact secrets by default.
- Test behavior at multiple levels: service rules, API integration, and security boundaries.
- Treat Docker, CI, docs, and health checks as part of the backend, not optional extras.
