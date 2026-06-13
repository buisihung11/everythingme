import type { PropsWithChildren } from 'react';

export function PageContainer({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`mx-auto w-full max-w-3xl px-4 py-8 ${className}`.trim()}>
      {children}
    </div>
  );
}
