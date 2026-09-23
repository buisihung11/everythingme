# Uber Clone — AWS Step Functions Study Project

A local-first study project showing how AWS Step Functions Activities work, using a ride-matching scenario (simplified Uber). Watch the state machine offer rides to drivers one at a time, timeout after 10s, and catch declines — all running locally.

## Architecture

```
Web (4400) ──REST+SSE──▶ Ride Service (4401) ──▶ Postgres (5433)
                               │
                               ├──▶ POST /matches ──▶ Ride Matching (4402)
                               │                           │
                               │                    SFN Local (8083)
                               │                    Redis tokens (6380)
                               │
                               ◀── Internal callbacks (offer/matched/no-drivers)

Ride Matching ──▶ Location Service (4403) ──▶ Redis GEO (6380)
```

## Prerequisites

- Node.js 20+, pnpm 10+
- Docker (for SFN Local, Redis)
- Root `docker-compose.yml` running (Postgres on 5433)

## Setup

```bash
# From repo root, start shared Postgres
docker compose up -d

# Enter project
cd apps/studying/uber-clone

# Install dependencies
pnpm install

# Start SFN Local + Redis
pnpm infra:up

# Create uber_clone DB + push schema
pnpm db:setup

# Create activities + state machine in SFN Local
pnpm bootstrap

# Place 6 drivers around SF
pnpm seed

# Start all 4 services concurrently
pnpm dev
```

Open **http://localhost:4400** for the dashboard.

## Scripts

| Command | Description |
|---|---|
| `pnpm infra:up` | Start SFN Local + Redis via docker compose |
| `pnpm infra:down` | Stop SFN Local + Redis |
| `pnpm db:setup` | Create `uber_clone` DB + push Drizzle schema |
| `pnpm bootstrap` | Create activities + state machine in SFN Local |
| `pnpm seed` | Place 6 drivers around SF in Redis GEO |
| `pnpm dev` | Run all 4 services concurrently |
| `pnpm typecheck` | TypeScript type-check |
| `pnpm cdk:synth` | Synthesize CDK stack (verifies ASL → AWS path) |

Or via Nx from repo root:

```bash
nx dev uber-clone
```

## Service Endpoints

### Ride Service (4401)
- `POST /fares/estimate` — fare estimate
- `POST /rides` — create a ride (triggers matching)
- `GET /rides/:id` — ride status
- `GET /rides/:id/offers` — offer history
- `POST /rides/:id/offers/:driverId/respond` — accept/decline an offer
- `GET /events` — SSE stream of all domain events

### Ride Matching Service (4402)
- `POST /matches` — start Step Functions execution (idempotent)
- `POST /matches/:rideId/offers/:driverId/respond` — complete the activity token
- `GET /matches/:rideId/history` — execution history from SFN

### Location Service (4403)
- `PUT /drivers/:id/location` — update driver location + status
- `PATCH /drivers/:id/status` — update driver status only
- `GET /drivers/nearby?lat&lng&radiusKm&limit` — GEOSEARCH nearby drivers
- `GET /drivers` — list all drivers
- `POST /chaos` — induce next N failures (for Retry demo)

## Smoke Tests

```bash
# With all services running:
tsx scripts/smoke.ts
```

Tests: accept path, 2-decline + accept path, no-driver path, late accept (TaskTimedOut).

## State Machine

The workflow lives in `infra/ride-matching.asl.json`. Key patterns:

- **Activities**: The worker long-polls, stores the task token in Redis, and doesn't complete until the driver responds or the 10s timer fires.
- **Idempotent execution name**: `name = rideId` means duplicate StartExecution returns `ExecutionAlreadyExists`.
- **JSONPath intrinsics**: `States.ArrayGetItem` and `States.MathAdd` advance the cursor without Lambda.
- **Catch**: Both `States.Timeout` and `DriverDeclined` route to `AdvanceCursor → HasMoreDrivers`.

## Lessons

1. [00 — Overview](lessons/00-overview.md)
2. [01 — The State Machine](lessons/01-state-machine.md)
3. [02 — Fault Tolerance](lessons/02-fault-tolerance.md)

## Limitations / Known Issues

- `cdk:synth` requires `AWS_DEFAULT_ACCOUNT` env var or uses dummy `123456789012`.
- Step Functions Local 2.0.0 is "unsupported" by AWS but works for Activities, Timeout, Catch, and JSONPath intrinsics.
- The `offer-driver` worker holds task tokens in process memory after Redis TTL expires; a process restart loses any in-flight tokens (they degrade to timeout, which is safe).
- No authentication on any service (study project).
