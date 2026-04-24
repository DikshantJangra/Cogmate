import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-2xl border border-slate-100 bg-white px-6 py-4 text-sm font-bold ring-offset-white placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/10 focus-visible:border-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
