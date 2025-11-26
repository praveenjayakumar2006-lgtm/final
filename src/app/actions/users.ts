
'use server';

import fs from 'fs/promises';
import path from 'path';

// Define types directly in this file to avoid dependency issues
type User = {
  id: string;
  username: string;
  email: string;
  phone?: string;
  password?: string; // Add password field
};

type Reservation = {
  id: string;
  userId: string;
  // other reservation properties
};

type Feedback = {
  id: string;
  email: string;
  // other feedback properties
};

type Violation = {
  id: string;
  userId: string;
  // other violation properties
};

const dataDir = path.join(process.cwd(), 'data');
const usersFilePath = path.join(dataDir, 'User_Data.json');
const reservationsFilePath = path.join(dataDir, 'User_Reservations.json');
const feedbackFilePath = path.join(dataDir, 'User_Feedback.json');
const violationsFilePath = path.join(dataDir, 'User_Violations.json');


async function ensureDirectoryExists() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

// Generic file reader
async function readFile<T>(filePath: string): Promise<T[]> {
  try {
    await fs.access(filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return fileContent ? JSON.parse(fileContent) : [];
  } catch (error) {
    return [];
  }
}

// Generic file writer
async function writeFile<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDirectoryExists();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}


export async function getUsers(): Promise<User[]> {
    return await readFile<User>(usersFilePath);
}

export async function saveUserToFile(user: User): Promise<void> {
  const users = await readFile<User>(usersFilePath);
  const existingUser = users.find(u => u.id === user.id || u.email === user.email);
  if (!existingUser) {
    users.push(user);
    await writeFile(usersFilePath, users);
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean }> {
    let allUsers = await readFile<User>(usersFilePath);
    const userToDelete = allUsers.find(u => u.id === userId);

    if (!userToDelete) {
        return { success: false };
    }

    const initialUserLength = allUsers.length;
    allUsers = allUsers.filter(u => u.id !== userId);
    
    if (allUsers.length < initialUserLength) {
        await writeFile(usersFilePath, allUsers);
        
        // Delete reservations associated with the user
        const allReservations = await readFile<Reservation>(reservationsFilePath);
        const filteredReservations = allReservations.filter(res => res.userId !== userId);
        await writeFile(reservationsFilePath, filteredReservations);

        // Delete feedback associated with the user (matching by email)
        const allFeedback = await readFile<Feedback>(feedbackFilePath);
        const filteredFeedback = allFeedback.filter(f => f.email !== userToDelete.email);
        await writeFile(feedbackFilePath, filteredFeedback);

        // Delete violations associated with the user
        const allViolations = await readFile<Violation>(violationsFilePath);
        const filteredViolations = allViolations.filter(v => v.userId !== userId);
        await writeFile(violationsFilePath, filteredViolations);

        return { success: true };
    } else {
        return { success: false };
    }
}
