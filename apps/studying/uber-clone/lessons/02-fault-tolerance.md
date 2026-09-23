# Lesson 02 — Fault Tolerance

This project demonstrates several patterns that make distributed ride-matching robust.

## 1. Idempotent execution names

```typescript
await sfn.send(new StartExecutionCommand({
  stateMachineArn: sfnConfig.stateMachineArn,
  name: rideId,   // ← execution name = rideId
  input: JSON.stringify(input),
}));
```

If the matching service crashes and restarts, calling `POST /matches` again returns `ExecutionAlreadyExists` — the state machine was not started twice. The ride either completes from where it was, or was already finished.

## 2. Activity workers are at-least-once

The activity worker polling loop in `worker-loop.ts` catches all SFN errors and retries. If a worker crashes mid-offer:

- The task token is still stored in Redis.
- When the worker restarts, the 10s offer timer is still running in the state machine.
- Either the driver responds before the timer, or the timer fires → `AdvanceCursor`.

No state is held in worker memory; all progress is in the **execution state** managed by Step Functions.

## 3. Redis token TTL as a safety net

```typescript
await redis.set(key, token, 'EX', 60);  // 60s TTL
```

The token TTL (60s, well above the 10s offer timeout) means that:
- If the matching service is down for >60s, the token expires.
- Any late `SendTaskSuccess` after the timeout returns `TaskTimedOut`.
- This degrades gracefully: the state machine already moved on.

## 4. REQUESTED reconciler

The Ride Service runs a 5s interval that re-triggers any ride stuck in `REQUESTED`:

```typescript
// services/ride-service/src/app.ts  startReconciler()
SELECT * FROM rides WHERE status = 'REQUESTED' AND updated_at < NOW() - INTERVAL '5 seconds'
```

If the Matching Service was down when a ride was created, the ride stays `REQUESTED`. When the service comes back up, the reconciler calls `POST /matches` again (which is idempotent) within 10s.

## 5. Offer upsert idempotency

```typescript
await db.insert(schema.rideOffers)
  .values({ ... })
  .onConflictDoNothing();
```

If the `offer-driver` worker fires twice for the same (rideId, driverId) pair, the second insert is silently ignored.

## 6. Status guards on accept/decline

```typescript
const offer = await db.query.rideOffers.findFirst({
  where: and(
    eq(schema.rideOffers.rideId, rideId),
    eq(schema.rideOffers.driverId, driverId),
    eq(schema.rideOffers.status, 'PENDING'),   // ← guard
  ),
});
if (!offer) return c.json({ error: 'No pending offer' }, 404);
```

A driver can only respond if their offer is still PENDING. Double-clicks or replay attacks fail safely.

## Failure scenarios tested by smoke.ts

| Scenario | Expected outcome |
|---|---|
| All drivers decline | `MatchingFailed` (NoDriversAvailable) |
| All drivers ignore (timeout) | All `AdvanceCursor` transitions, then `MatchingFailed` |
| One driver accepts after 1 decline | `NotifyMatched` with 1 `AdvanceCursor` transition |
| Late accept (after 10s) | `TaskTimedOut` error returned, state already advanced |
| Matching service down → up | Reconciler re-triggers, execution proceeds |

## Production considerations

- Replace Redis with DynamoDB for token storage (no TTL surprises under high load).
- Add heartbeats to `OfferToDriver` if the offer timeout needs to exceed 60s.
- Use SQS + Lambda for activity workers instead of long-polling in EC2/ECS.
- The `REQUESTED` reconciler logic works identically on real AWS.

## Next: [Lesson 03 — Distributed Locks](03-distributed-locks.md)
