/**
 * bootstrap-sfn-local.ts
 * Creates the four activities and the state machine in Step Functions Local.
 * Idempotent: uses existing resources if they already exist.
 * Writes ARNs to .sfn-local.json for the services to pick up.
 */

import {
  SFNClient,
  CreateActivityCommand,
  CreateStateMachineCommand,
  ListActivitiesCommand,
  ListStateMachinesCommand,
} from '@aws-sdk/client-sfn';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;

const sfn = new SFNClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8083',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
});

const ACTIVITY_NAMES = [
  'fetch-candidates',
  'offer-driver',
  'notify-matched',
  'notify-no-drivers',
] as const;

const STATE_MACHINE_NAME = 'ride-matching';

async function getExistingActivities(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let nextToken: string | undefined;
  do {
    const res = await sfn.send(
      new ListActivitiesCommand({ nextToken, maxResults: 100 }),
    );
    for (const a of res.activities ?? []) {
      if (a.name && a.activityArn) {
        map.set(a.name, a.activityArn);
      }
    }
    nextToken = res.nextToken;
  } while (nextToken);
  return map;
}

async function getExistingStateMachines(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let nextToken: string | undefined;
  do {
    const res = await sfn.send(
      new ListStateMachinesCommand({ nextToken, maxResults: 100 }),
    );
    for (const sm of res.stateMachines ?? []) {
      if (sm.name && sm.stateMachineArn) {
        map.set(sm.name, sm.stateMachineArn);
      }
    }
    nextToken = res.nextToken;
  } while (nextToken);
  return map;
}

async function main() {
  console.log('🚀 Bootstrapping Step Functions Local...');

  // ── 1. Create activities ──────────────────────────────────────────────────
  const existing = await getExistingActivities();
  const activityArns: Record<string, string> = {};

  for (const name of ACTIVITY_NAMES) {
    if (existing.has(name)) {
      const arn = existing.get(name)!;
      console.log(`  ✓ Activity already exists: ${name}`);
      activityArns[name] = arn;
    } else {
      const res = await sfn.send(new CreateActivityCommand({ name }));
      const arn = res.activityArn!;
      console.log(`  ✚ Created activity: ${name} → ${arn}`);
      activityArns[name] = arn;
    }
  }

  // ── 2. Load + patch ASL ───────────────────────────────────────────────────
  const aslPath = resolve(ROOT, 'infra/ride-matching.asl.json');
  const asl = JSON.parse(await readFile(aslPath, 'utf-8'));

  // Patch the activity ARNs into the ASL
  const states = asl.States as Record<string, { Resource?: string }>;
  const activityStateMap: Record<string, keyof typeof activityArns> = {
    FetchCandidates: 'fetch-candidates',
    OfferToDriver: 'offer-driver',
    NotifyMatched: 'notify-matched',
    NotifyNoDrivers: 'notify-no-drivers',
  };
  for (const [stateName, activityName] of Object.entries(activityStateMap)) {
    if (states[stateName]) {
      states[stateName].Resource = activityArns[activityName];
    }
  }

  // ── 3. Create / update state machine ─────────────────────────────────────
  const existingSMs = await getExistingStateMachines();
  let stateMachineArn: string;

  if (existingSMs.has(STATE_MACHINE_NAME)) {
    stateMachineArn = existingSMs.get(STATE_MACHINE_NAME)!;
    console.log(`  ✓ State machine already exists: ${STATE_MACHINE_NAME}`);
  } else {
    const res = await sfn.send(
      new CreateStateMachineCommand({
        name: STATE_MACHINE_NAME,
        definition: JSON.stringify(asl),
        roleArn:
          'arn:aws:iam::123456789012:role/DummyRole',
        type: 'STANDARD',
      }),
    );
    stateMachineArn = res.stateMachineArn!;
    console.log(`  ✚ Created state machine: ${stateMachineArn}`);
  }

  // ── 4. Write output file ──────────────────────────────────────────────────
  const output = {
    stateMachineArn,
    activities: activityArns,
  };
  const outPath = resolve(ROOT, '.sfn-local.json');
  await writeFile(outPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Written to ${outPath}`);
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
