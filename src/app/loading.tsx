
'use client';

import { Car, Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background gap-4">
      <div className="flex items-center gap-4 text-lg font-semibold">
        <Car className="h-14 w-14 text-primary animate-pulse" />
        <span className="font-bold text-4xl">ParkEasy</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}
