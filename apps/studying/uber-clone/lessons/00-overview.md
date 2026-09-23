# Lesson 00 — Overview

## What you'll build

A simplified Uber ride-matching system in which a backend **Step Functions state machine** orchestrates the entire "find a driver" process, while three Hono microservices and a React dashboard make the workflow visible and interactive.

## System map

```
Web (4400) ──REST+SSE──> Ride Service (4401)
                              │
                              ├─ POST /matches ──> Ride Matching (4402)
                              │                        │
                              │                        ├── GetActivityTask (SFN Local 8083)
                              │                        └── Redis token store (6380)
                              │
                              └─ Internal callbacks <── Ride Matching
Ride Service ──────────────────────────────> Postgres (5433/uber_clone)
Ride Matching ─────────────────────────────> Location Service (4403)
Location Service ──────────────────────────> Redis GEO (6380)
```

## Ports at a glance

| Service              | Port |
|----------------------|------|
| Web dashboard        | 4400 |
| Ride Service         | 4401 |
| Ride Matching        | 4402 |
| Location Service     | 4403 |
| Step Functions Local | 8083 |
| Redis                | 6380 |
| Postgres (shared)    | 5433 |

## Quick start

```bash
# 1. Start infrastructure
cd apps/studying/uber-clone
pnpm infra:up              # SFN Local + Redis
# (Postgres is already running from root docker-compose)

# 2. Set up database
pnpm db:setup              # creates uber_clone DB + runs drizzle-kit push

# 3. Bootstrap Step Functions Local
pnpm bootstrap             # creates 4 activities + state machine, writes .sfn-local.json

# 4. Seed drivers
pnpm seed

# 5. Start all services
pnpm dev
```

Then open http://localhost:4400 for the dashboard.

## Next: [Lesson 01 — The State Machine](01-state-machine.md)
