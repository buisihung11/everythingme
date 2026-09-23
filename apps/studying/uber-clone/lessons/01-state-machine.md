# Lesson 01 — The State Machine

## File: `infra/ride-matching.asl.json`

The entire matching logic lives in a single Amazon States Language (ASL) file. No code in the matching service controls the flow — Step Functions does.

## State diagram

```
[*] → FetchCandidates (Activity, Retry×3)
       ↓
     InitCursor  {index: 0}
       ↓
     HasMoreDrivers ──── index ≥ count ──→ NotifyNoDrivers → MatchingFailed
       │
       │ index < count
       ↓
     SelectDriver  (Pass: pick candidates[cursor.index])
       ↓
     OfferToDriver (Activity, TimeoutSeconds=10)
       │              │
       │ accepted      │ Catch: States.Timeout | DriverDeclined
       ↓              ↓
     NotifyMatched  AdvanceCursor → HasMoreDrivers
       ↓
     [SUCCESS]
```

## Key concepts

### Activities vs. Lambda

Lambda runs your code synchronously and returns immediately. An **Activity** is a token-based pattern:

1. SFN creates a task and waits.
2. Your worker calls `GetActivityTask` (long-polling).
3. Worker does work, then calls `SendTaskSuccess` or `SendTaskFailure`.

This means the worker process can be anywhere — not in AWS — which is perfect for local development.

### The `offer-driver` worker is special

Most workers complete their task token immediately. The `offer-driver` worker intentionally does **not** call `SendTaskSuccess`. Instead it:

1. Stores the task token in Redis (`offer:{rideId}:{driverId}`).
2. Notifies the Ride Service to create the offer record.
3. Returns without completing the task.

The task stays "running" until:
- A driver accepts → `/matches/:rideId/offers/:driverId/respond` calls `SendTaskSuccess`
- A driver declines → same endpoint calls `SendTaskFailure("DriverDeclined")`
- 10 seconds pass → SFN fires `States.Timeout`

Both `DriverDeclined` and `States.Timeout` are caught by the `Catch` on `OfferToDriver` and route to `AdvanceCursor`.

### JSONPath intrinsics (no Lambda needed)

```json
"SelectDriver": {
  "Type": "Pass",
  "Parameters": {
    "currentDriverId.$": "States.ArrayGetItem($.candidates.driverIds, $.cursor.index)"
  }
}
```

`States.ArrayGetItem` and `States.MathAdd` are built-in intrinsic functions that work in both SFN Local and real AWS. No Lambda needed to pick the next driver.

## CDK equivalent

`infra/cdk/ride-matching-stack.ts` creates the same four `Activity` constructs and a `StateMachine` from the same ASL file, with real ARNs substituted in. Run `pnpm cdk:synth` to verify.

## Next: [Lesson 02 — Fault Tolerance](02-fault-tolerance.md)
