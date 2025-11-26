
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay } from 'date-fns';
import { useState, useContext, useEffect, useMemo } from 'react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import type { Reservation, User } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { ReservationsContext } from '@/context/reservations-context';
import { Button } from '../ui/button';
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
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Activity, CalendarClock, CheckCircle2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Status = 'Active' | 'Completed' | 'Upcoming';

const StatusIcon = ({ status }: { status: Status }) => {
  const iconMap: Record<Status, React.ReactElement> = {
    Active: <Activity className="h-5 w-5 text-blue-500" />,
    Completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    Upcoming: <CalendarClock className="h-5 w-5 text-yellow-500" />,
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{iconMap[status]}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{status}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


export function ReservationsTable() {
  const context = useContext(ReservationsContext);
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();
  
  const { reservations, removeReservation, isLoading, isClient } = context || {};

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
  }, []);

  const displayReservations = useMemo(() => {
    if (!reservations) return [];
    
    return reservations;
  }, [reservations]);


  if (!context) {
    return null; 
  }


  const getStatusVariant = (status: Status) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Completed':
        return 'secondary';
      case 'Upcoming':
        return 'outline';
      default:
        return 'default';
    }
  };

  const handleCancelReservation = (e: React.MouseEvent, reservation: Reservation) => {
    e.stopPropagation();
    if (reservation.status === 'Completed') {
      toast({
        variant: 'destructive',
        title: 'Action Not Allowed',
        description: `Completed reservations cannot be cancelled.`,
        duration: 3000,
      });
      return;
    }
    setReservationToCancel(reservation);
  };
  
  const confirmCancelReservation = () => {
    if (!reservationToCancel || !removeReservation) return;
    removeReservation(reservationToCancel.id);
    toast({
      title: 'Reservation Cancelled',
      description: `Your booking for slot ${reservationToCancel.slotId} has been cancelled.`,
      duration: 2000,
    });
    setReservationToCancel(null);
  };

  const handleRowClick = (reservation: Reservation) => {
    if (!user || reservation.userId !== user.id) return;

    if (reservation.status === 'Completed') {
      toast({
        variant: 'destructive',
        title: 'Action Not Allowed',
        description: 'This reservation is already completed and cannot be modified.',
        duration: 3000,
      });
      return;
    }
    
    // Allow modification for both 'Upcoming' and 'Active' reservations
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);
    const durationInMs = endTime.getTime() - startTime.getTime();
    const durationInHours = Math.round(durationInMs / (1000 * 60 * 60));

    const params = new URLSearchParams({
      vehiclePlate: reservation.vehiclePlate,
      date: startTime.toISOString(),
      startTime: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
      duration: String(durationInHours),
    });
    router.push(`/select-spot?${params.toString()}`);
  }

  const getDateFormat = () => {
    return isMobile ? 'MMM d, h:mm a' : 'MMM d, yyyy, h:mm a';
  };

  const formatLicensePlate = (plate: string | null) => {
    if (!plate) return null;
    const cleaned = plate.replace(/\s/g, '').toUpperCase();
    const match = /^([A-Z]{2})(\d{1,2})([A-Z]{1,2})(\d{1,4})$/;
    if (match.test(cleaned)) {
        const parts = cleaned.match(match);
        if (parts) {
            return parts.slice(1).filter(Boolean).join(' ');
        }
    }
    return plate;
  }

  const userReservations = displayReservations?.filter(res => res.userId === user?.id);

  const filteredReservations = userReservations?.filter((res) => {
    if (filter === 'all') return true;
    return res.status === filter;
  }).sort((a, b) => {
    if (filter === 'all') {
      const statusOrder: Record<Status, number> = { 'Upcoming': 1, 'Active': 2, 'Completed': 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
    }
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
  
  const renderSkeletons = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <TableRow key={`skel-${i}`}>
        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
        <TableCell><Skeleton className="h-6 w-40" /></TableCell>
        <TableCell><Skeleton className="h-6 w-40" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full">
            <div className="flex items-center justify-center p-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="Active">Active</TabsTrigger>
                <TabsTrigger value="Upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="Completed">Completed</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value={filter}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slot ID</TableHead>
                    <TableHead>Vehicle Plate</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!isClient || isLoading) && renderSkeletons()}
                  {isClient && !isLoading && filteredReservations?.map((reservation) => (
                    <TableRow 
                      key={reservation.id}
                      onClick={() => handleRowClick(reservation)}
                      className={cn({
                        'cursor-pointer hover:bg-muted/50': reservation.status === 'Upcoming' || reservation.status === 'Active',
                        'cursor-not-allowed opacity-60': reservation.status === 'Completed'
                      })}
                    >
                      <TableCell className="font-medium">
                        {reservation.slotId}
                      </TableCell>
                      <TableCell>{formatLicensePlate(reservation.vehiclePlate)}</TableCell>
                      <TableCell>
                        {format(new Date(reservation.startTime), getDateFormat())}
                      </TableCell>
                      <TableCell>
                        {format(new Date(reservation.endTime), getDateFormat())}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-2">
                           <StatusIcon status={reservation.status} />
                           {(reservation.status === 'Upcoming' || reservation.status === 'Active') && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => handleCancelReservation(e, reservation)}
                              className="h-auto px-2 py-1 text-xs"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {isClient && !isLoading && (!filteredReservations || filteredReservations.length === 0) && (
                <div className="text-center p-8 text-muted-foreground">
                  No {filter !== 'all' ? filter.toLowerCase() : ''} reservations found.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <AlertDialog open={!!reservationToCancel} onOpenChange={(open) => !open && setReservationToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently cancel your reservation for slot{' '}
              <span className="font-bold">{reservationToCancel?.slotId}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelReservation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
