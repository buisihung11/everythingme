/**
 * sfn-client.ts
 * Shared Step Functions client + config loaded from .sfn-local.json
 */

import {
  SFNClient,
} from '@aws-sdk/client-sfn';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('../../../', import.meta.url).pathname;
const CONFIG_PATH = resolve(ROOT, '.sfn-local.json');

export interface SfnConfig {
  stateMachineArn: string;
  activities: {
    'fetch-candidates': string;
    'offer-driver': string;
    'notify-matched': string;
    'notify-no-drivers': string;
  };
}

function loadConfig(): SfnConfig {
  if (!existsSync(CONFIG_PATH)) {
    // Fallback defaults for SFN Local
    return {
      stateMachineArn:
        'arn:aws:states:us-east-1:123456789012:stateMachine:ride-matching',
      activities: {
        'fetch-candidates':
          'arn:aws:states:us-east-1:123456789012:activity:fetch-candidates',
        'offer-driver':
          'arn:aws:states:us-east-1:123456789012:activity:offer-driver',
        'notify-matched':
          'arn:aws:states:us-east-1:123456789012:activity:notify-matched',
        'notify-no-drivers':
          'arn:aws:states:us-east-1:123456789012:activity:notify-no-drivers',
      },
    };
  }
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as SfnConfig;
}

export const sfnConfig = loadConfig();

export const sfn = new SFNClient({
  region: 'us-east-1',
  endpoint: process.env.SFN_ENDPOINT ?? 'http://localhost:8083',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local',
  },
});
