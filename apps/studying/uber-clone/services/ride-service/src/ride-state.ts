/** Ride statuses that may still receive a matched callback (including idempotent retry). */
export const MATCH_APPLY_STATUSES = ['REQUESTED', 'MATCHING', 'MATCHED'] as const;

/** Ride statuses that may still be marked NO_DRIVERS. */
export const NO_DRIVERS_APPLY_STATUSES = ['REQUESTED', 'MATCHING'] as const;

export function canApplyMatchedCallback(status: string): boolean {
  return (MATCH_APPLY_STATUSES as readonly string[]).includes(status);
}

export function canApplyNoDriversCallback(status: string): boolean {
  return (NO_DRIVERS_APPLY_STATUSES as readonly string[]).includes(status);
}

/**
 * Accept commits the offer before Step Functions confirms the token.
 * If matching then fails (422 timeout / 5xx), the accept must be rolled back
 * so the driver is not left ACCEPTED + busy forever.
 */
export function shouldCompensateAcceptOnMatchingFailure(accept: boolean): boolean {
  return accept;
}
