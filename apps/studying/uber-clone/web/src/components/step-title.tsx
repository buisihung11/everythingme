import type { ReactNode } from 'react';
import { CardTitle } from '@everythingme/ui';

interface Props {
  step: number;
  children: ReactNode;
}

/** Numbered card heading shared by the three panels of the walkthrough. */
export function StepTitle({ step, children }: Props) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {step}
      </span>
      <CardTitle className="text-base">{children}</CardTitle>
    </div>
  );
}
