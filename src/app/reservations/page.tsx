
'use client';
import { ReservationsTable } from '@/components/reservations/reservations-table';
import { useState, useEffect } from 'react';

export default function ViewBookingsPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4">
       <div className="mb-4 text-center mt-4">
        <h1 className="text-3xl font-semibold">My Bookings</h1>
        <p className="text-muted-foreground">View and manage your past, active, and upcoming reservations.</p>
       </div>
       <div>
        {isClient && <ReservationsTable />}
      </div>
    </div>
  );
}
