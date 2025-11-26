
'use server';

import fs from 'fs/promises';
import path from 'path';

type Violation = {
  id: string;
  slotNumber: string;
  violationType: string;
  licensePlate: string;
  imageUrl?: string | null;
  userId: string;
  createdAt: string;
};

// Use a permanent location within the project
const dataDir = path.join(process.cwd(), 'data');
const violationsFilePath = path.join(dataDir, 'User_Violations.json');

async function ensureDirectoryExists() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

async function readViolationsFile(): Promise<Violation[]> {
  try {
    await fs.access(violationsFilePath);
    const fileContent = await fs.readFile(violationsFilePath, 'utf-8');
    if (!fileContent) {
        return [];
    }
    return JSON.parse(fileContent);
  } catch (error) {
    return [];
  }
}

async function writeViolationsFile(data: Violation[]): Promise<void> {
  await ensureDirectoryExists();
  await fs.writeFile(violationsFilePath, JSON.stringify(data, null, 2));
}

export async function getViolations(): Promise<Violation[]> {
    return await readViolationsFile();
}

export async function saveViolation(violation: Omit<Violation, 'id' | 'createdAt'>): Promise<Violation> {
  const allViolations = await readViolationsFile();
  const newViolation: Violation = {
    ...violation,
    id: `violation_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    createdAt: new Date().toISOString(),
  };
  allViolations.push(newViolation);
  await writeViolationsFile(allViolations);
  return newViolation;
}

export async function deleteViolation(violationId: string): Promise<{ success: boolean }> {
    let allViolations = await readViolationsFile();
    const initialLength = allViolations.length;
    allViolations = allViolations.filter(v => v.id !== violationId);

    if (allViolations.length < initialLength) {
        await writeViolationsFile(allViolations);
        return { success: true };
    } else {
        return { success: false };
    }
}
