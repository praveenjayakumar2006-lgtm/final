'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getViolations } from '@/app/actions/violations';
import { getReservations } from '@/app/actions/reservations';
import type { Reservation, User } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';

type Violation = {
  id: string;
  slotNumber: string;
  violationType: string;
  licensePlate: string;
  createdAt: string;
  imageUrl?: string;
};

type Fine = Violation & {
  fineAmount: number;
};

// Formats license plates like 'TN72FB9999' to 'TN 72 FB 9999'
const formatLicensePlate = (plate: string | null) => {
    if (!plate) return null;
    const cleaned = plate.replace(/\s/g, '').toUpperCase();
    const match = cleaned.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,2})(\d{1,4})$/);
    if (match) {
        const [_, state, district, series, number] = match;
        return `${state} ${district} ${series} ${number}`;
    }
    return plate;
}

const formatSlotId = (slotId: string | null) => {
    if (!slotId) return null;
    const match = slotId.match(/^([A-Z])(\d+)$/);
    if (match) {
        return `${match[1]} ${match[2]}`;
    }
    return slotId;
}

export default function FinesPage() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchFines = async () => {
      setIsLoading(true);
      try {
        const violations = await getViolations();
        const reservations = await getReservations();

        const userReservations = reservations.filter(r => r.userId === user.id);
        const userLicensePlates = [...new Set(userReservations.map(r => r.vehiclePlate))];
        
        const userViolations = violations.filter(v => userLicensePlates.includes(v.licensePlate));

        const finesWithAmount: Fine[] = userViolations.map(v => ({
          ...v,
          fineAmount: v.violationType === 'overstaying' ? 50 : 100, // Basic fine amount
        }));

        setFines(finesWithAmount);
      } catch (error) {
        console.error("Failed to fetch fines:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFines();
  }, [user]);
  
  const sortedFines = useMemo(() => 
    [...fines].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), 
  [fines]);


  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={`skel-${i}`}>
            <CardContent className="p-4 space-y-4">
                 <Skeleton className="h-40 w-full rounded-lg" />
                 <div className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-24" />
                 </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Skeleton className="h-4 w-40" />
            </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="w-full flex-1 flex flex-col items-center">
        <Card className="w-full max-w-7xl border-0 bg-transparent shadow-none">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl">My Fines</CardTitle>
                <p className="text-muted-foreground">
                    Review any parking violations associated with your vehicles.
                </p>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
            {isLoading && renderSkeletons()}
            {!isLoading && sortedFines.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedFines.map((fine) => (
                    <Card key={fine.id}>
                    <CardContent className="p-4 space-y-4">
                        {fine.imageUrl && (
                        <div className="overflow-hidden rounded-lg">
                            <Image
                            src={fine.imageUrl}
                            alt={`Violation at ${fine.slotNumber}`}
                            width={400}
                            height={225}
                            className="object-cover aspect-video"
                            />
                        </div>
                        )}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Badge variant={fine.violationType === 'overstaying' ? 'destructive' : 'secondary'}>
                                    {fine.violationType.replace('_', ' ')}
                                </Badge>
                                <p className="font-semibold text-lg text-destructive">${fine.fineAmount.toFixed(2)}</p>
                            </div>
                            <CardTitle className="text-xl">{formatLicensePlate(fine.licensePlate)}</CardTitle>
                            <p className="text-muted-foreground">
                                Slot: <span className="font-semibold text-foreground">{formatSlotId(fine.slotNumber)}</span>
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                            Issued on {format(new Date(fine.createdAt), 'PPP')}
                        </p>
                        <Button size="sm" disabled>Pay Fine</Button>
                    </CardFooter>
                    </Card>
                ))}
                </div>
            )}
            {!isLoading && sortedFines.length === 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center p-8 text-muted-foreground">
                            You have no outstanding fines. Great job!
                        </div>
                    </CardContent>
                </Card>
            )}
            </CardContent>
        </Card>
    </div>
  );
}
