
'use client';

import { useState, useContext } from 'react';
import { Car, Bike, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { parkingSlots as defaultSlots } from '@/lib/data';
import type { ParkingSlot, Reservation, User } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { addHours, parseISO } from 'date-fns';
import { ReservationsContext } from '@/context/reservations-context';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

type BookingDetails = {
  vehiclePlate: string;
  date: string;
  startTime: string;
  duration: string;
};

export function ParkingMap({ bookingDetails, displayOnlyReservation, size = 'default' }: { bookingDetails?: BookingDetails, displayOnlyReservation?: Reservation, size?: 'default' | 'large' }) {
  const reservationsContext = useContext(ReservationsContext);
  const [user, setUser] = useState<User | null>(null);
  
  if (!reservationsContext) {
    throw new Error('ParkingMap must be used within a ReservationsProvider');
  }

  useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
  });
  
  const { addReservation, reservations, removeReservation, isClient, isLoading } = reservationsContext;
  const [slots] = useState<ParkingSlot[]>(defaultSlots);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const getConflictingReservation = (slotId: string) => {
    let searchStartTime: Date, searchEndTime: Date;

    if (displayOnlyReservation) {
        searchStartTime = new Date(displayOnlyReservation.startTime);
        searchEndTime = new Date(displayOnlyReservation.endTime);
    } else if (bookingDetails) {
        const [hour, minute] = bookingDetails.startTime.split(':').map(Number);
        searchStartTime = parseISO(bookingDetails.date);
        searchStartTime.setHours(hour, minute);
        searchEndTime = addHours(searchStartTime, parseInt(bookingDetails.duration, 10));
    } else {
        return null;
    }

    return reservations.find(res => {
        if (res.slotId !== slotId) return false;
        const resStartTime = new Date(res.startTime);
        const resEndTime = new Date(res.endTime);
        return (
            (searchStartTime >= resStartTime && searchStartTime < resEndTime) ||
            (searchEndTime > resStartTime && searchEndTime <= resEndTime) ||
            (resStartTime >= searchStartTime && resEndTime <= searchEndTime)
        );
    });
  }

  const handleSlotClick = (slot: ParkingSlot) => {
    // Disable all click interactions if it's for display only
    if (displayOnlyReservation) return;
    
    const { status, isUser, conflictingReservation } = getSlotStatus(slot.id);

    if (status === 'available') {
      if (!bookingDetails) {
          toast({
            variant: 'destructive',
            title: 'Booking Time Required',
            description: 'Please go back to the booking page and select a date, time, and duration.',
          });
          return;
      }
      setSelectedSlot(slot);
      setShowSuccess(false);
    } else if (status === 'reserved' && isUser && conflictingReservation) {
        if (conflictingReservation.status === 'Completed') {
             toast({
                variant: 'destructive',
                title: 'Action Not Allowed',
                description: 'This reservation is completed and cannot be cancelled.',
             });
        } else {
            setReservationToCancel(conflictingReservation);
        }
    } else if (status === 'occupied' || (status === 'reserved' && !isUser)) {
         toast({
            variant: 'destructive',
            title: 'Slot Unavailable',
            description: 'This slot is already occupied or reserved for the selected time.',
          });
    }
  };

  const handleConfirmReservation = () => {
    if (!selectedSlot || !bookingDetails) return;

    setShowSuccess(true);
    
    const [hour, minute] = bookingDetails.startTime.split(':').map(Number);
    const startDate = parseISO(bookingDetails.date);
    startDate.setHours(hour, minute);

    const newReservation = {
      slotId: selectedSlot.id,
      vehiclePlate: bookingDetails.vehiclePlate,
      startTime: startDate,
      endTime: addHours(startDate, parseInt(bookingDetails.duration, 10)),
    };
    
    addReservation(newReservation);
    toast({
        title: 'Reservation Successful!',
        description: `Parking slot ${selectedSlot.id} is now yours.`,
        duration: 2000,
    });

    setTimeout(() => {
      setSelectedSlot(null);
      setShowSuccess(false);
    }, 1500);
  };
  
  const handleCancelReservation = () => {
    if (!reservationToCancel) return;
    removeReservation(reservationToCancel.id);
    toast({
      title: 'Reservation Cancelled',
      description: `Your booking for slot ${reservationToCancel.slotId} has been cancelled.`,
      duration: 2000,
    });
    setReservationToCancel(null);
  };
  
  const getSlotStatus = (slotId: string): { status: 'available' | 'occupied' | 'reserved', isUser: boolean, conflictingReservation: Reservation | null } => {
    const conflictingReservation = getConflictingReservation(slotId);

    if (conflictingReservation) {
        const isCurrentUser = displayOnlyReservation 
            ? conflictingReservation.id === displayOnlyReservation.id 
            : conflictingReservation.userId === user?.id;
        return { status: 'reserved', isUser: isCurrentUser, conflictingReservation };
    }
    
    return { status: 'available', isUser: false, conflictingReservation: null };
  };


  const getSlotClasses = (slot: ParkingSlot) => {
    const { status, isUser } = getSlotStatus(slot.id);
    const isDisplayOnly = !!displayOnlyReservation;

    return cn(
      'relative flex flex-col items-center rounded-md border-2 transition-colors pt-1',
      {
        'bg-green-100 border-green-400 text-green-800': status === 'available',
        'hover:bg-green-200 cursor-pointer': status === 'available' && !isDisplayOnly,
        'bg-red-100 border-red-400 text-red-800 opacity-70': status === 'occupied' || (status === 'reserved' && !isUser),
        'cursor-not-allowed': isDisplayOnly || status === 'occupied' || (status === 'reserved' && !isUser),
        'bg-yellow-100 border-yellow-400 text-yellow-800': status === 'reserved' && isUser,
        'hover:bg-yellow-200 cursor-pointer': status === 'reserved' && isUser && !isDisplayOnly,

        'h-12 w-9': size === 'default' && slot.type === 'car',
        'h-10 w-7': size === 'default' && slot.type === 'bike',
        'h-16 w-12': size === 'large' && slot.type === 'car',
        'h-14 w-10': size === 'large' && slot.type === 'bike',
      }
    );
  };
  
   const VehicleIcon = ({ type, size }: { type: 'car' | 'bike', size: 'default' | 'large' }) => {
    const className = size === 'large' ? "h-2/3 w-2/3" : "h-2/3 w-2/3";
    if (type === 'car') {
      return <Car className={className} />;
    }
    return <Bike className={className} />;
  };

  const carSlots = slots.filter((slot) => slot.type === 'car');
  const bikeSlots = slots.filter((slot) => slot.type === 'bike');

  if (!isClient || isLoading) {
    return <Skeleton className="h-[450px] w-full max-w-4xl" />;
  }

  return (
    <>
      <Card>
        <CardContent className="p-4 md:p-6 flex justify-center">
          <div className={cn("relative inline-flex flex-col items-center border-2 border-gray-400 bg-gray-200 rounded-lg",
             size === 'large' ? 'p-4 gap-4' : 'p-2 gap-2'
          )}>
            <div className="flex flex-col items-center gap-2">
                <p className={cn("font-semibold text-muted-foreground", size === 'large' ? 'text-lg' : 'text-sm')}>Car Parking</p>
                <div className={cn("flex flex-row", size === 'large' ? 'gap-4' : 'gap-2.5')}>
                {carSlots.map((slot) => {
                    const { status, isUser } = getSlotStatus(slot.id);
                    const hasIcon = status === 'occupied' || status === 'reserved';

                    return (
                    <div
                        key={slot.id}
                        className={getSlotClasses(slot)}
                        onClick={() => handleSlotClick(slot)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Parking slot ${slot.id}, status: ${status}`}
                    >
                        {hasIcon && <VehicleIcon type={slot.type} size={size}/>}
                        {status === 'reserved' && isUser && (
                            <Badge variant="default" className="absolute -top-2 -right-2 text-[8px] px-1 py-0">You</Badge>
                        )}
                        <span className={cn("absolute bottom-0.5 right-0.5 font-bold", size === 'large' ? 'text-xs' : 'text-[8px]')}>
                        {slot.id}
                        </span>
                    </div>
                    )
                })}
                </div>
            </div>


            <Separator orientation="horizontal" className="bg-gray-400 my-2" />
            

            <div className="flex flex-col items-center gap-2">
                <p className={cn("font-semibold text-muted-foreground", size === 'large' ? 'text-lg' : 'text-sm')}>Bike Parking</p>
                <div className={cn("flex flex-col", size === 'large' ? 'gap-4' : 'gap-2')}>
                    <div className={cn("flex flex-row", size === 'large' ? 'gap-4' : 'gap-2.5')}>
                        {bikeSlots.slice(0, 6).map((slot) => {
                        const { status, isUser } = getSlotStatus(slot.id);
                        const hasIcon = status === 'occupied' || status === 'reserved';

                        return (
                            <div
                            key={slot.id}
                            className={getSlotClasses(slot)}
                            onClick={() => handleSlotClick(slot)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Parking slot ${slot.id}, status: ${status}`}
                            >
                            {hasIcon && <VehicleIcon type={slot.type} size={size} />}
                            {status === 'reserved' && isUser && (
                                <Badge variant="default" className="absolute -top-2 -right-2 text-[8px] px-1 py-0">You</Badge>
                            )}
                            <span className={cn("absolute bottom-0.5 right-0.5 font-bold", size === 'large' ? 'text-xs' : 'text-[8px]')}>
                                {slot.id}
                            </span>
                            </div>
                        )
                        })}
                    </div>
                    <div className={cn("flex flex-row", size === 'large' ? 'gap-4' : 'gap-2.5')}>
                        {bikeSlots.slice(6, 12).map((slot) => {
                        const { status, isUser } = getSlotStatus(slot.id);
                        const hasIcon = status === 'occupied' || status === 'reserved';
                        
                        return (
                            <div
                            key={slot.id}
                            className={getSlotClasses(slot)}
                            onClick={() => handleSlotClick(slot)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Parking slot ${slot.id}, status: ${status}`}
                            >
                            {hasIcon && <VehicleIcon type={slot.type} size={size} />}
                            {status === 'reserved' && isUser && (
                                <Badge variant="default" className="absolute -top-2 -right-2 text-[8px] px-1 py-0">You</Badge>
                            )}
                            <span className={cn("absolute bottom-0.5 right-0.5 font-bold", size === 'large' ? 'text-xs' : 'text-[8px]')}>
                                {slot.id}
                            </span>
                            </div>
                        )
                        })}
                    </div>
                </div>
            </div>
          </div>
          
        </CardContent>
          <CardFooter className="mt-2 flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm border-2 border-green-400 bg-green-100" />
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm border-2 border-yellow-400 bg-yellow-100" />
              <span className="text-sm text-muted-foreground">Your Reservation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm border-2 border-red-400 bg-red-100" />
              <span className="text-sm text-muted-foreground">Occupied</span>
            </div>
          </CardFooter>
      </Card>

      <AlertDialog
        open={!!selectedSlot}
        onOpenChange={(open) => {
          if (!open) setSelectedSlot(null);
        }}
        key={selectedSlot?.id}
      >
        <AlertDialogContent>
          {showSuccess ? (
             <div className="flex flex-col items-center justify-center p-4 gap-2">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ duration: 0.5, type: 'spring' }}>
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
              </motion.div>
              <AlertDialogTitle>Reservation Successful!</AlertDialogTitle>
              <AlertDialogDescription>
                Parking slot <span className="font-bold text-foreground">{selectedSlot?.id}</span> is now yours.
              </AlertDialogDescription>
            </div>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Reservation</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reserve parking slot{' '}
                  <span className="font-bold text-foreground">{selectedSlot?.id}</span>?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmReservation}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!reservationToCancel} onOpenChange={(open) => !open && setReservationToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your reservation for slot{' '}
              <span className="font-bold">{reservationToCancel?.slotId}</span>. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelReservation}
              asChild
            >
              <Button variant="destructive">Yes, Cancel</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
