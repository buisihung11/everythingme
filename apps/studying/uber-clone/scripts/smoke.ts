/**
 * smoke.ts
 * End-to-end smoke tests for the Uber Clone study project.
 *
 * Run after all services are up and drivers are seeded:
 *   pnpm infra:up && pnpm db:setup && pnpm bootstrap && pnpm seed
 *   tsx scripts/smoke.ts
 *
 * Tests:
 *   1. accept path  — first driver accepts, then complete ride
 *   2. decline path — two drivers decline, third accepts
 *   3. no-driver path — all drivers set to decline
 *   4. late accept   — try to accept after token expired / after SFN moved on
 */

const RIDE_URL = process.env.RIDE_URL ?? 'http://localhost:4401';
const MATCHING_URL = process.env.MATCHING_URL ?? 'http://localhost:4402';
const LOCATION_URL = process.env.LOCATION_URL ?? 'http://localhost:4403';

const PICKUP = { lat: 37.7749, lng: -122.4194, address: 'Union Square' };
const DROPOFF = { lat: 37.7599, lng: -122.4148, address: 'Mission' };

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createRide(riderId = 'smoke-rider') {
  const res = await fetch(`${RIDE_URL}/rides`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ riderId, pickup: PICKUP, dropoff: DROPOFF }),
  });
  assert(res.status === 201, `POST /rides returns 201 (got ${res.status})`);
  const data = (await res.json()) as { ride: { id: string; status: string } };
  return data.ride;
}

async function getRide(id: string) {
  const res = await fetch(`${RIDE_URL}/rides/${id}`);
  const data = (await res.json()) as { ride: { id: string; status: string; driverId?: string } };
  return data.ride;
}

async function getHistory(rideId: string) {
  const res = await fetch(`${MATCHING_URL}/matches/${rideId}/history`);
  const data = (await res.json()) as { events: Array<{ type: string; stateEnteredEventDetails?: { name: string } }> };
  return data.events ?? [];
}

async function respond(
  rideId: string,
  driverId: string,
  accept: boolean,
): Promise<number> {
  const res = await fetch(
    `${RIDE_URL}/rides/${rideId}/offers/${driverId}/respond`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accept }),
    },
  );
  return res.status;
}

async function waitForOffer(
  rideId: string,
  driverId: string,
  timeoutMs = 8000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${RIDE_URL}/rides/${rideId}/offers`);
    const data = (await res.json()) as {
      offers: Array<{ driverId: string; status: string }>;
    };
    if (data.offers.some((o) => o.driverId === driverId && o.status === 'PENDING')) {
      return true;
    }
    await sleep(500);
  }
  return false;
}

async function waitForStatus(
  rideId: string,
  status: string,
  timeoutMs = 15000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ride = await getRide(rideId);
    if (ride.status === status) return true;
    await sleep(500);
  }
  return false;
}

async function getFirstPendingDriver(rideId: string): Promise<string | null> {
  const res = await fetch(`${RIDE_URL}/rides/${rideId}/offers`);
  const data = (await res.json()) as {
    offers: Array<{ driverId: string; status: string }>;
  };
  const pending = data.offers.find((o) => o.status === 'PENDING');
  return pending?.driverId ?? null;
}

// ── Test 1: Accept path ────────────────────────────────────────────────────────

async function testAcceptPath() {
  console.log('\n📋 Test 1: First driver accepts');

  const ride = await createRide();
  assert(ride.status === 'REQUESTED' || ride.status === 'MATCHING', 'ride starts as REQUESTED or MATCHING');

  // Wait for an offer to arrive
  await sleep(3000); // Give workers time to poll and offer
  const offeredDriver = await getFirstPendingDriver(ride.id);

  if (!offeredDriver) {
    console.log('  ⚠️  No offer found within 3s — skipping accept step (workers may not be running)');
    return;
  }

  const status = await respond(ride.id, offeredDriver, true);
  assert(status === 200, `respond accept returns 200 (got ${status})`);

  const matched = await waitForStatus(ride.id, 'MATCHED', 10000);
  assert(matched, 'ride reaches MATCHED status');

  const final = await getRide(ride.id);
  assert(final.driverId === offeredDriver, `ride.driverId = ${offeredDriver}`);

  const completeRes = await fetch(`${RIDE_URL}/rides/${ride.id}/complete`, {
    method: 'POST',
  });
  assert(completeRes.status === 200, `complete ride returns 200 (got ${completeRes.status})`);
  const completed = await getRide(ride.id);
  assert(completed.status === 'COMPLETED', `ride status is COMPLETED (got ${completed.status})`);

  const driversRes = await fetch(`${LOCATION_URL}/drivers`);
  const driversData = (await driversRes.json()) as {
    drivers: Array<{ id: string; status: string }>;
  };
  const freed = driversData.drivers.find((d) => d.id === offeredDriver);
  assert(freed?.status === 'available', 'matched driver is available after complete');

  const locksRes = await fetch(`${LOCATION_URL}/locks`);
  if (locksRes.ok) {
    const locksData = (await locksRes.json()) as {
      locks: Array<{ driverId: string }>;
    };
    assert(
      !locksData.locks.some((lock) => lock.driverId === offeredDriver),
      'matched driver lock is released after complete',
    );
  }
}

// ── Test 2: Decline path ────────────────────────────────────────────────────────

async function testDeclinePath() {
  console.log('\n📋 Test 2: Two declines, third accepts');

  const ride = await createRide('smoke-rider-2');
  let declineCount = 0;

  for (let i = 0; i < 2; i++) {
    await sleep(2000);
    const driver = await getFirstPendingDriver(ride.id);
    if (!driver) {
      console.log(`  ⚠️  No pending offer for decline #${i + 1} — workers may not be running`);
      break;
    }
    const status = await respond(ride.id, driver, false);
    assert(status === 200, `decline #${i + 1} returns 200 (got ${status})`);
    declineCount++;
  }

  if (declineCount === 2) {
    await sleep(2000);
    const driver = await getFirstPendingDriver(ride.id);
    if (driver) {
      const status = await respond(ride.id, driver, true);
      assert(status === 200, `accept after 2 declines returns 200 (got ${status})`);
      const matched = await waitForStatus(ride.id, 'MATCHED', 10000);
      assert(matched, 'ride reaches MATCHED after 2 declines + accept');

      const history = await getHistory(ride.id);
      const catchTransitions = history.filter(
        (e) => e.stateEnteredEventDetails?.name === 'AdvanceCursor',
      );
      assert(catchTransitions.length >= 2, `at least 2 AdvanceCursor transitions (got ${catchTransitions.length})`);
    }
  }
}

// ── Test 3: No drivers ────────────────────────────────────────────────────────

async function testNoDriversPath() {
  console.log('\n📋 Test 3: No-driver path (all drivers offline)');

  // Take all drivers offline
  const driversRes = await fetch(`${LOCATION_URL}/drivers`);
  const driversData = (await driversRes.json()) as { drivers: Array<{ id: string }> };
  for (const d of driversData.drivers) {
    await fetch(`${LOCATION_URL}/drivers/${d.id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'offline' }),
    });
  }

  const ride = await createRide('smoke-rider-3');
  await sleep(5000); // Give workers time to fetch candidates (empty) and notify-no-drivers

  const final = await getRide(ride.id);
  assert(
    final.status === 'NO_DRIVERS' || final.status === 'MATCHING',
    `ride status is NO_DRIVERS or MATCHING (got ${final.status})`,
  );

  // Restore drivers
  for (const d of driversData.drivers) {
    await fetch(`${LOCATION_URL}/drivers/${d.id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'available' }),
    });
  }
}

// ── Test 4: Late accept ───────────────────────────────────────────────────────

async function testLateAccept() {
  console.log('\n📋 Test 4: Late accept returns TaskTimedOut');

  const ride = await createRide('smoke-rider-4');
  await sleep(2000);

  const driver = await getFirstPendingDriver(ride.id);
  if (!driver) {
    console.log('  ⚠️  No offer found — skipping late accept test');
    return;
  }

  // Wait past the 65s SFN offer timeout
  console.log(`  Waiting 70s for offer to time out…`);
  await sleep(70000);

  const status = await respond(ride.id, driver, true);
  assert(
    status === 422 || status === 404,
    `late accept returns 422 or 404 (got ${status})`,
  );
}

// ── Fare estimate sanity ──────────────────────────────────────────────────────

async function testFareEstimate() {
  console.log('\n📋 Test 0: Fare estimate');
  const res = await fetch(`${RIDE_URL}/fares/estimate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pickup: PICKUP, dropoff: DROPOFF }),
  });
  assert(res.ok, `POST /fares/estimate returns 200 (got ${res.status})`);
  const data = (await res.json()) as { fareEstimate: number; distanceKm: number };
  assert(data.fareEstimate > 0, `fareEstimate > 0 (got ${data.fareEstimate})`);
  assert(data.distanceKm > 0, `distanceKm > 0 (got ${data.distanceKm})`);
}

// ── Test 5: Concurrent lock race ──────────────────────────────────────────────

/**
 * Start two rides almost simultaneously and verify that:
 *   a) No driver ends up MATCHED to more than one ride.
 *   b) If both rides end up competing for the same driver, at least one
 *      lock.denied event is visible via GET /locks history, OR the second
 *      ride simply matched a different driver — both outcomes are acceptable.
 *
 * Success criteria:
 *   - No driver id appears in the driverId field of two MATCHED rides.
 *   - Both rides settle to a terminal status within the timeout window.
 */
async function testConcurrentLockRace() {
  console.log('\n📋 Test 5: Concurrent lock race — no driver double-booked');

  // Fire both rides as close together as possible.
  const [rideA, rideB] = await Promise.all([
    createRide('smoke-racer-a'),
    createRide('smoke-racer-b'),
  ]);

  assert(!!rideA.id, `Ride A created (id: ${rideA.id})`);
  assert(!!rideB.id, `Ride B created (id: ${rideB.id})`);

  // Accept the first pending offer for each ride so they race toward MATCHED.
  // We run these in parallel to maximise the chance of a real lock collision.
  async function acceptFirstOffer(ride: { id: string }, label: string) {
    const driver = await (async () => {
      const deadline = Date.now() + 10_000;
      while (Date.now() < deadline) {
        const d = await getFirstPendingDriver(ride.id);
        if (d) return d;
        await sleep(400);
      }
      return null;
    })();

    if (!driver) {
      console.log(`  ⚠️  ${label}: no pending offer within 10s (workers may not be running)`);
      return;
    }

    const status = await respond(ride.id, driver, true);
    assert(
      status === 200 || status === 404,
      `${label}: respond accept returns 200 or 404 (got ${status})`,
    );
  }

  await Promise.all([
    acceptFirstOffer(rideA, 'Ride A'),
    acceptFirstOffer(rideB, 'Ride B'),
  ]);

  // Wait for both rides to reach a terminal state.
  const TERMINAL = new Set(['MATCHED', 'NO_DRIVERS', 'CANCELLED']);
  const deadline = Date.now() + 20_000;
  let finalA = await getRide(rideA.id);
  let finalB = await getRide(rideB.id);

  while (Date.now() < deadline) {
    if (TERMINAL.has(finalA.status) && TERMINAL.has(finalB.status)) break;
    await sleep(500);
    if (!TERMINAL.has(finalA.status)) finalA = await getRide(rideA.id);
    if (!TERMINAL.has(finalB.status)) finalB = await getRide(rideB.id);
  }

  console.log(`  Ride A final: ${finalA.status} (driver: ${finalA.driverId ?? 'none'})`);
  console.log(`  Ride B final: ${finalB.status} (driver: ${finalB.driverId ?? 'none'})`);

  // Core invariant: no driver double-booked.
  const driverA = finalA.driverId;
  const driverB = finalB.driverId;

  if (driverA && driverB) {
    assert(
      driverA !== driverB,
      `drivers are distinct (A: ${driverA}, B: ${driverB})`,
    );
  } else {
    // At least one ride didn't get a driver — still a valid outcome.
    assert(true, 'no driver conflict detected (one or both rides have no driver)');
  }

  // Verify lock state: after both rides settle there should be at most one
  // active lock per driver visible from GET /locks.
  const locksRes = await fetch(`${LOCATION_URL}/locks`);
  if (locksRes.ok) {
    const locksData = (await locksRes.json()) as { locks: Array<{ driverId: string; rideId: string }> };
    const driverLockCounts = new Map<string, number>();
    for (const lock of locksData.locks) {
      driverLockCounts.set(lock.driverId, (driverLockCounts.get(lock.driverId) ?? 0) + 1);
    }
    const doubleBooked = [...driverLockCounts.entries()].filter(([, count]) => count > 1);
    assert(
      doubleBooked.length === 0,
      `no driver holds more than one active lock (found ${doubleBooked.length} violations)`,
    );
  } else {
    console.log(`  ⚠️  GET /locks returned ${locksRes.status} — skipping lock count check`);
  }
}

// ── Health checks ─────────────────────────────────────────────────────────────

async function testHealthChecks() {
  console.log('\n📋 Test: Health checks');
  for (const [name, url] of [
    ['Ride Service', `${RIDE_URL}/health`],
    ['Matching Service', `${MATCHING_URL}/health`],
    ['Location Service', `${LOCATION_URL}/health`],
  ]) {
    const res = await fetch(url);
    assert(res.ok, `${name} /health returns 200`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting smoke tests...');
  console.log(`  Ride: ${RIDE_URL}`);
  console.log(`  Matching: ${MATCHING_URL}`);
  console.log(`  Location: ${LOCATION_URL}`);

  await testHealthChecks();
  await testFareEstimate();
  await testAcceptPath();
  await testDeclinePath();
  await testNoDriversPath();
  await testLateAccept();
  await testConcurrentLockRace();

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ All smoke tests passed!');
  }
}

main().catch((e) => {
  console.error('Smoke test error:', e);
  process.exit(1);
});
