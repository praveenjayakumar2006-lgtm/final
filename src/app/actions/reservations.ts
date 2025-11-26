
'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

type Reservation = {
    id: string;
    userId: string;
    userName: string;
    email: string;
    slotId: string;
    vehiclePlate: string;
    startTime: string;
    endTime: string;
    status: 'Upcoming' | 'Active' | 'Completed';
    createdAt: string;
};

// Use a permanent location within the project
const dataDir = path.join(process.cwd(), 'data');
const reservationsFilePath = path.join(dataDir, 'User_Reservations.json');

async function ensureDirectoryExists() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

async function readReservationsFile(): Promise<Reservation[]> {
  try {
    // By using fs.readFile without fs.access, we ensure we get the latest file content.
    const fileContent = await fs.readFile(reservationsFilePath, 'utf-8');
    if (!fileContent) { // Handle empty file case
        return [];
    }
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
        // If the file doesn't exist, return an empty array
        return [];
    }
    console.error("Error reading reservations file:", error);
    throw error; // Re-throw other errors
  }
}

async function writeReservationsFile(data: Reservation[]): Promise<void> {
  await ensureDirectoryExists();
  await fs.writeFile(reservationsFilePath, JSON.stringify(data, null, 2));
  revalidatePath('/owner'); // Revalidate the cache for the owner page
  revalidatePath('/reservations'); // Revalidate for user reservations
}

export async function getReservations(): Promise<Reservation[]> {
  const reservations = await readReservationsFile();
  const now = new Date();
  
  if (!reservations) return [];

  let hasChanges = false;
  // This is where we will dynamically update the status
  const updatedReservations = reservations.map(res => {
    const startTime = new Date(res.startTime);
    const endTime = new Date(res.endTime);
    let currentStatus: 'Upcoming' | 'Active' | 'Completed' = res.status;
    let newStatus: 'Upcoming' | 'Active' | 'Completed';

    if (now > endTime) {
      newStatus = 'Completed';
    } else if (now >= startTime && now <= endTime) {
      newStatus = 'Active';
    } else {
      newStatus = 'Upcoming';
    }
    
    if (newStatus !== currentStatus) {
      hasChanges = true;
    }

    return { ...res, status: newStatus };
  });
  
  // If any status has changed, write the whole updated file back
  if (hasChanges) {
    await writeReservationsFile(updatedReservations);
  }

  return updatedReservations;
}

export async function saveReservation(reservation: Omit<Reservation, 'id' | 'createdAt' | 'status'>): Promise<Reservation> {
  const allReservations = await readReservationsFile();
  const newReservation: Reservation = {
    ...reservation,
    id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    status: 'Upcoming',
  };
  allReservations.push(newReservation);
  await writeReservationsFile(allReservations);
  return newReservation;
}

export async function deleteReservation(reservationId: string): Promise<{ success: boolean }> {
    let allReservations = await readReservationsFile();
    const initialLength = allReservations.length;
    allReservations = allReservations.filter(res => res.id !== reservationId);

    if (allReservations.length < initialLength) {
        await writeReservationsFile(allReservations);
        return { success: true };
    } else {
        return { success: false };
    }
}
