import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Construct } from 'constructs';

const ASL_PATH = resolve(__dirname, '../ride-matching.asl.json');

interface AslDefinition {
  States: Record<string, { Resource?: string }>;
}

export class RideMatchingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ── Activities ────────────────────────────────────────────────────────────
    const fetchCandidates = new sfn.Activity(this, 'FetchCandidates', {
      activityName: 'fetch-candidates',
    });

    const offerDriver = new sfn.Activity(this, 'OfferDriver', {
      activityName: 'offer-driver',
    });

    const notifyMatched = new sfn.Activity(this, 'NotifyMatched', {
      activityName: 'notify-matched',
    });

    const notifyNoDrivers = new sfn.Activity(this, 'NotifyNoDrivers', {
      activityName: 'notify-no-drivers',
    });

    // ── Patch ASL with real ARNs ───────────────────────────────────────────────
    const rawAsl = JSON.parse(readFileSync(ASL_PATH, 'utf-8')) as AslDefinition;

    rawAsl.States['FetchCandidates'].Resource = fetchCandidates.activityArn;
    rawAsl.States['OfferToDriver'].Resource = offerDriver.activityArn;
    rawAsl.States['NotifyMatched'].Resource = notifyMatched.activityArn;
    rawAsl.States['NotifyNoDrivers'].Resource = notifyNoDrivers.activityArn;

    // ── IAM Role for the state machine ───────────────────────────────────────
    const role = new iam.Role(this, 'SfnRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
      inlinePolicies: {
        ActivityPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'states:GetActivityTask',
                'states:SendTaskSuccess',
                'states:SendTaskFailure',
                'states:SendTaskHeartbeat',
              ],
              resources: [
                fetchCandidates.activityArn,
                offerDriver.activityArn,
                notifyMatched.activityArn,
                notifyNoDrivers.activityArn,
              ],
            }),
          ],
        }),
      },
    });

    // ── State Machine ─────────────────────────────────────────────────────────
    new sfn.StateMachine(this, 'RideMatchingStateMachine', {
      stateMachineName: 'ride-matching',
      definitionBody: sfn.DefinitionBody.fromString(JSON.stringify(rawAsl)),
      role,
      timeout: Duration.minutes(30),
      stateMachineType: sfn.StateMachineType.STANDARD,
    });
  }
}
