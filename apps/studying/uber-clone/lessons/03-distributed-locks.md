# Lesson 03 — Distributed Locks

## The problem: TOCTOU with soft `busy`

Before this lesson the system marked a driver `busy` only _after_ creating the offer:

```
Ride A: GET /nearby  → driver D is available ✓
Ride B: GET /nearby  → driver D is available ✓   ← both snapshots pass
Ride A: INSERT offer for D, PATCH status → busy
Ride B: INSERT offer for D, PATCH status → busy   ← D now has two PENDING offers!
```

This is a classic **Time-of-Check / Time-of-Use (TOCTOU)** race. The status check and the state change are not atomic, so two concurrent executions can both pass the check before either has written the new state.

Marking the driver `busy` does _not_ fix it — you still need to atomically claim the driver before anyone else can.

---

## Solution: Redis `SET NX` — atomic claim

```
SET ride-lock:{driverId} {rideId} NX EX {ttl}
```

- **NX** — only set if the key does **not exist**.  This is atomic at the Redis level.
- **EX {ttl}** — auto-expire if we crash before releasing (safety net).
- Return value: `OK` = acquired, `nil` = held by someone else.

The lock is **held for the entire offer window**, not only at the moment of acceptance:

| Phase | Lock action |
|---|---|
| Offer created (SFN calls `offer-driver`) | `POST /drivers/:id/lock` — acquire (30 s TTL) |
| Driver responds _Decline_ | `DELETE /drivers/:id/lock` — release |
| SFN offer timeout fires | `DELETE /drivers/:id/lock` — release (in `expirePendingOffers`) |
| Driver responds _Accept_ | `POST /drivers/:id/lock/extend` — bump to 1 h |

Holding from offer time means **at most one pending offer per driver** at any moment.  A second ride that calls `POST /drivers/:id/lock` while the first ride holds it gets HTTP `409 { heldBy: "<rideId>" }`.

---

## Safe release: Lua compare-and-delete

A plain `DEL ride-lock:{driverId}` is dangerous: if Ride A's lock expired and Ride B acquired it, Ride A's release would delete Ride B's lock.

The safe pattern is an atomic compare-and-delete in Lua:

```lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
```

Lua scripts on Redis run atomically — no other command can interleave between the `GET` and the conditional `DEL`.  The Location Service exposes this via `DELETE /drivers/:id/lock { rideId }` (returns `200` if released, `409` if held by a different `rideId`).

---

## DriverLocked → AdvanceCursor

When the `offer-driver` worker calls Ride Service and receives `409`, it:

1. Calls `SendTaskFailure({ error: 'DriverLocked' })` on the SFN activity token.
2. Returns without storing the token (the driver is unavailable; there is nothing to wait for).

The ASL `OfferToDriver` state has a `Catch` that matches `DriverLocked` alongside `DriverDeclined` and `States.Timeout` — all three route to `AdvanceCursor`:

```json
"Catch": [
  {
    "ErrorEquals": ["States.Timeout", "DriverDeclined", "DriverLocked"],
    "Next": "AdvanceCursor"
  }
]
```

This means the state machine skips the locked driver and tries the next candidate automatically — no manual intervention needed.

---

## How to run the race demo

### Option A — UI "Race 2 rides" button

Open the dashboard and click **Race 2 rides**.  This fires two `POST /rides` requests in parallel.  Watch the lock status panel: one ride acquires a lock (green), the other shows `lock.denied` (red badge) and its SFN transitions to `AdvanceCursor`.

### Option B — two parallel curl calls

```bash
curl -s -X POST http://localhost:4401/rides \
  -H 'content-type: application/json' \
  -d '{"riderId":"rider-a","pickup":{"lat":37.7749,"lng":-122.4194},"dropoff":{"lat":37.7599,"lng":-122.4148}}' &

curl -s -X POST http://localhost:4401/rides \
  -H 'content-type: application/json' \
  -d '{"riderId":"rider-b","pickup":{"lat":37.7749,"lng":-122.4194},"dropoff":{"lat":37.7599,"lng":-122.4148}}' &

wait
```

### Option C — smoke test

```bash
pnpm smoke     # runs scripts/smoke.ts
```

Test 5 ("Concurrent lock race") starts two rides simultaneously and asserts that no driver ends up `MATCHED` to more than one ride.

---

## After any ASL change — re-bootstrap

Step Functions Local reads the state machine definition only at startup.  Any time `infra/ride-matching.asl.json` is modified you must re-register the definition:

```bash
pnpm bootstrap   # from apps/studying/uber-clone
```

This runs `scripts/bootstrap-sfn-local.ts`, which calls `CreateStateMachine` / `UpdateStateMachine` on SFN Local so workers pick up the new `DriverLocked` catch.

---

## What to observe in the event log

| Event | Meaning |
|---|---|
| `lock.acquired` | Ride claimed driver; offer window starts |
| `lock.denied` | Second ride tried same driver; SFN will AdvanceCursor |
| `lock.released` | Driver declined / timed out; driver is free again |
| `offer.timeout` + `lock.released` | SFN timeout fired; auto-expired by `expirePendingOffers` |

---

## Key files

| File | Role |
|---|---|
| `services/location-service/src/app.ts` | Redis `SET NX`, Lua release, `GET /locks` |
| `services/ride-service/src/location-client.ts` | Thin HTTP wrappers for lock acquire/release/extend |
| `services/ride-service/src/app.ts` | Lock lifecycle tied to offer/decline/match callbacks |
| `services/ride-matching-service/src/workers/offer-driver.worker.ts` | `SendTaskFailure(DriverLocked)` on 409 |
| `infra/ride-matching.asl.json` | `DriverLocked` Catch → AdvanceCursor |
| `packages/shared/src/index.ts` | `lock.acquired` / `lock.denied` / `lock.released` in `DomainEvent` |

## Next: [Lesson 04 — Production Considerations](04-production.md)
