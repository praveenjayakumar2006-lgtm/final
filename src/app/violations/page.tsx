
import { ViolationChecker } from '@/components/violations/violation-checker';
import { Suspense } from 'react';

export default function ViolationsPage() {
  return (
    <div className="w-full flex-1 flex items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <ViolationChecker />
      </Suspense>
    </div>
  );
}
