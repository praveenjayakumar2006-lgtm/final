
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Car, Clock, Hash, Mail, User as UserIcon, Info, Badge as BadgeIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import type { Reservation } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getReservations, deleteReservation } from '@/app/actions/reservations';
import { getUsers } from '@/app/actions/users';
import { Badge, badgeVariants } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ParkingMap } from '@/components/dashboard/parking-map';
import Loading from '@/app/loading';


type User = {
    id: string;
    username: string;
    email: string;
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2.5">
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-medium text-sm">{value}</div>
            </div>
        </div>
    )
}

function BookingDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  const fetchBookingDetails = useCallback(async () => {
    if (typeof id !== 'string') return;
    setIsLoading(true);
    try {
      const allReservations = await getReservations();
      const currentReservation = allReservations.find(res => res.id === id);

      if (currentReservation) {
        setReservation(currentReservation as any);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Booking not found.' });
        router.replace('/owner?view=bookings');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch booking details.' });
    } finally {
      setIsLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);
  
  const isCompleted = reservation?.status === 'Completed';
  const actionText = isCompleted ? 'Delete' : 'Cancel';

  const handleDelete = async () => {
    if (!reservation) return;

    const result = await deleteReservation(reservation.id);
    if (result.success) {
      toast({
        title: `Booking ${actionText}ed`,
        description: `The booking for slot ${reservation.slotId} has been ${actionText.toLowerCase()}ed.`,
      });
      router.replace('/owner?view=bookings');
    } else {
      toast({
        variant: 'destructive',
        title: `${actionText} Failed`,
        description: `Could not ${actionText.toLowerCase()} the booking. Please try again.`,
      });
    }
    setIsDeleteDialogOpen(false);
  };

  const getStatusBadgeVariant = (status?: Reservation['status']): VariantProps<typeof badgeVariants>['variant'] => {
    if (!status) return 'default';
    switch (status) {
      case 'Active':
        return 'active';
      case 'Completed':
        return 'completed';
      case 'Upcoming':
        return 'upcoming';
      default:
        return 'default';
    }
  };


  if (isLoading || !reservation) {
    return (
        <div className="w-full max-w-4xl mx-auto mt-6 px-4 pb-6">
            <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <Skeleton className="h-px w-full" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
                 <CardFooter className="p-4 pt-2 border-t">
                    <Skeleton className="h-9 w-full" />
                </CardFooter>
            </Card>
        </div>
    )
  }
  
  const startTime = new Date(reservation.startTime);
  const endTime = new Date(reservation.endTime);


  return (
    <div className="w-full max-w-4xl mx-auto mt-6 px-4 pb-6">
        <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <Card>
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">Booking Details</CardTitle>
                    <Badge variant={getStatusBadgeVariant(reservation.status)} className="text-sm capitalize">
                        {reservation.status}
                    </Badge>
                </div>
                <CardDescription>
                    {reservation.userName ? (
                        <>
                           <span className="font-semibold text-card-foreground">{reservation.userName}</span>
                           <span> ({reservation.email})</span>
                        </>
                    ) : 'User details not found'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 pt-2">
                   <DetailItem icon={Hash} label="Slot ID" value={reservation.slotId} />
                   <DetailItem icon={Car} label="Vehicle Plate" value={reservation.vehiclePlate} />
                   <DetailItem icon={Calendar} label="Start Time" value={format(startTime, 'PPp')} />
                   <DetailItem icon={Clock} label="End Time" value={format(endTime, 'PPp')} />
                   <DetailItem icon={Info} label="Booked On" value={format(new Date(reservation.createdAt), 'PPp')} />
                </div>
                <Separator />
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-4 text-center">Parking Layout</h3>
                  <div className="mt-4">
                    <ParkingMap displayOnlyReservation={reservation} />
                  </div>
                </div>
            </CardContent>
             <CardFooter className="p-4 pt-2 border-t">
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="w-full sm:w-auto ml-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {actionText} Booking
                </Button>
            </CardFooter>
        </Card>

         <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{actionText} this booking?</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to permanently {actionText.toLowerCase()} the booking for slot{' '}
                    <span className="font-bold text-foreground">{reservation.slotId}</span> for vehicle{' '}
                    <span className="font-bold text-foreground">{reservation.vehiclePlate}</span>?
                    This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                onClick={handleDelete}
                asChild
                >
                <Button variant="destructive">{actionText} Booking</Button>
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

export default function BookingDetailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <BookingDetailContent />
        </Suspense>
    )
}
