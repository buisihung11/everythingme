/**
 * seed-drivers.ts
 * Places 6 drivers around a centre point (downtown San Francisco).
 * Run: tsx scripts/seed-drivers.ts
 */

const LOCATION_URL = process.env.LOCATION_URL ?? 'http://localhost:4403';

const CENTER = { lat: 37.7749, lng: -122.4194 };

const DRIVERS = [
  { id: 'driver-1', name: 'Alice Chen' },
  { id: 'driver-2', name: 'Bob Martinez' },
  { id: 'driver-3', name: 'Carol Kim' },
  { id: 'driver-4', name: 'Dave Patel' },
  { id: 'driver-5', name: 'Eve Johnson' },
  { id: 'driver-6', name: 'Frank Lee' },
];

/** Offset lat/lng by up to ±radiusKm km */
function jitter(lat: number, lng: number, radiusKm: number) {
  const KM_PER_DEG_LAT = 111.32;
  const KM_PER_DEG_LNG = 111.32 * Math.cos((lat * Math.PI) / 180);
  const dlat = ((Math.random() * 2 - 1) * radiusKm) / KM_PER_DEG_LAT;
  const dlng = ((Math.random() * 2 - 1) * radiusKm) / KM_PER_DEG_LNG;
  return { lat: lat + dlat, lng: lng + dlng };
}

async function main() {
  console.log(`Seeding ${DRIVERS.length} drivers to ${LOCATION_URL}…`);
  for (const driver of DRIVERS) {
    const pos = jitter(CENTER.lat, CENTER.lng, 3);
    const res = await fetch(`${LOCATION_URL}/drivers/${driver.id}/location`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        lat: pos.lat,
        lng: pos.lng,
        status: 'available',
        name: driver.name,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to seed ${driver.id}: ${res.status}`);
    }
    console.log(
      `  ✓ ${driver.name} at (${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)})`,
    );
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
