import * as cdk from 'aws-cdk-lib';
import { RideMatchingStack } from './ride-matching-stack';

const app = new cdk.App();
new RideMatchingStack(app, 'RideMatchingStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '123456789012',
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
