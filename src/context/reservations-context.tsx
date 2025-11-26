
'use client';

import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Reservation, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getReservations, saveReservation, deleteReservation } from '@/app/actions/reservations';
import { addHours, parseISO } from 'date-fns';


interface ReservationsContextType {
  reservations: Reservation[];
  addReservation: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'status' | 'userName' | 'email'> & { startTime: Date, endTime: Date }) => Promise<void>;
  removeReservation: (reservationId: string) => Promise<void>;
  isLoading: boolean;
  isClient: boolean;
}

export const ReservationsContext = createContext<ReservationsContextType | undefined>(undefined);

export const ReservationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      const fetchedReservations = await getReservations();
      setReservations(fetchedReservations as Reservation[]);
    } catch (error) {
      console.error("Error fetching reservations: ", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch reservation data.',
      });
    } finally {
      if (isLoading) {
        setIsLoading(false);
      }
    }
  }, [toast, isLoading]);

  useEffect(() => {
    if (isClient) {
      fetchReservations(); // Initial fetch

      const intervalId = setInterval(() => {
        fetchReservations();
      }, 1000); // Poll every 1 second

      return () => clearInterval(intervalId); // Cleanup interval on unmount
    }
  }, [isClient, fetchReservations]);


  const addReservation = async (reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'status' | 'userName' | 'email'> & { startTime: Date, endTime: Date }) => {
    if (!user || !user.username || !user.email) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to make a reservation.',
      });
      return;
    }
    
    const existingReservation = reservations.find(
      (r) => r.slotId === reservation.slotId && r.userId === user.id
    );

    if (existingReservation) {
       try {
        await deleteReservation(existingReservation.id);
      } catch (error) {
         console.error("Error deleting existing reservation: ", error);
      }
    }
    
    try {
      await saveReservation({
        ...reservation,
        startTime: reservation.startTime.toISOString(),
        endTime: reservation.endTime.toISOString(),
        userId: user.id,
        userName: user.username,
        email: user.email,
      });
      await fetchReservations(); // Refetch after adding
    } catch (error) {
       console.error("Error adding reservation: ", error);
       toast({
        variant: 'destructive',
        title: 'Reservation Error',
        description: 'Could not save your reservation. Please try again.',
      });
    }
  };

  const removeReservation = async (reservationId: string) => {
    const originalReservations = [...reservations];
    // Optimistic UI update for instant feedback
    setReservations(prev => prev.filter(r => r.id !== reservationId));
    
    try {
      const result = await deleteReservation(reservationId);
      if (!result.success) {
        // If server deletion fails, revert the optimistic update
        setReservations(originalReservations);
        toast({
          variant: 'destructive',
          title: 'Cancellation Error',
          description: 'Could not cancel your reservation on the server. Please try again.',
        });
      }
      // No refetch needed, revalidation is handled by the server action
    } catch (error) {
      console.error("Error deleting reservation: ", error);
      // Revert optimistic update on failure
      setReservations(originalReservations);
      toast({
        variant: 'destructive',
        title: 'Cancellation Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  return (
    <ReservationsContext.Provider value={{ reservations, addReservation, removeReservation, isLoading, isClient }}>
      {children}
    </ReservationsContext.Provider>
  );
};
