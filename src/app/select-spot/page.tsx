
'use client';

import { ParkingMap } from '@/components/dashboard/parking-map';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, addHours } from 'date-fns';
import { Calendar, Clock, Hourglass, Ticket, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

function SelectSpotContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const vehiclePlate = searchParams.get('vehiclePlate');
    const date = searchParams.get('date');
    const startTime = searchParams.get('startTime');
    const duration = searchParams.get('duration');

    const bookingDetails = vehiclePlate && date && startTime && duration ? { vehiclePlate, date, startTime, duration } : undefined;

    const formattedDate = date ? format(parseISO(date), 'PPP') : 'N/A';
    
    const formattedTime = (time: string | null) => {
        if (!time) return 'N/A';
        const [hour, minute] = time.split(':').map(Number);
        const period = hour < 12 ? 'AM' : 'PM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    }

    const getEndTime = () => {
        if (!date || !startTime || !duration) return 'N/A';
        const startDate = parseISO(date);
        const [hour, minute] = startTime.split(':').map(Number);
        startDate.setHours(hour, minute);
        const endDate = addHours(startDate, parseInt(duration, 10));
        return format(endDate, 'h:mm a');
    }

    const handleBack = () => {
        const params = new URLSearchParams();
        if (vehiclePlate) params.set('vehiclePlate', vehiclePlate);
        if (date) params.set('date', date);
        if (startTime) params.set('startTime', startTime);
        if (duration) params.set('duration', duration);
        router.push(`/booking?${params.toString()}`);
    }

    // Formats license plates like 'HR26DQ05551' to 'HR 26 DQ 05551'
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

    return (
        <div
            className="flex flex-col items-center justify-center flex-1 bg-muted p-4 md:p-6 w-full"
        >
            <div className="w-full max-w-4xl flex flex-col items-center">
                 <div className="w-full flex justify-start mb-4">
                    <Button variant="outline" onClick={handleBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </div>
                <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold tracking-tighter sm:text-4xl">Select Your Spot</h3>
                    <p className="max-w-2xl text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-2">
                        Choose an available spot from the map to complete your reservation.
                    </p>
                </div>

                {bookingDetails && (
                     <div className="mb-6 bg-background border rounded-lg p-4">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm justify-items-start">
                            <div className="flex items-center gap-2">
                                <Ticket className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">{formatLicensePlate(vehiclePlate)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">{formattedDate}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">{formattedTime(startTime)} - {getEndTime()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Hourglass className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">{duration} hour{Number(duration) > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="w-full flex justify-center">
                    <ParkingMap bookingDetails={bookingDetails} size="large" />
                </div>
            </div>
        </div>
    );
}

export default function SelectSpotPage() {
    return (
        <Suspense fallback={<div className="p-4 w-full flex flex-col gap-4 items-center">
            <Skeleton className="h-16 w-1/2" />
            <Skeleton className="h-24 w-full max-w-4xl" />
            <Skeleton className="h-96 w-full max-w-4xl" />
        </div>}>
            <SelectSpotContent />
        </Suspense>
    )
}

    
