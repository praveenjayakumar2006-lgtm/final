
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


export default function BookParkingPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/booking');
  }, [router]);

  return null;
}
