
'use server';

import fs from 'fs/promises';
import path from 'path';

type Feedback = {
  id: string;
  name: string;
  email: string;
  rating: number;
  feedback: string;
  createdAt: string;
};

// Use a permanent location within the project
const dataDir = path.join(process.cwd(), 'data');
const feedbackFilePath = path.join(dataDir, 'User_Feedback.json');

async function ensureDirectoryExists() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

async function readFeedbackFile(): Promise<Feedback[]> {
  try {
    await fs.access(feedbackFilePath);
    const fileContent = await fs.readFile(feedbackFilePath, 'utf-8');
    if (!fileContent) {
        return [];
    }
    return JSON.parse(fileContent);
  } catch (error) {
    // If the file doesn't exist, return an empty array
    return [];
  }
}

async function writeFeedbackFile(data: Feedback[]): Promise<void> {
  await ensureDirectoryExists();
  await fs.writeFile(feedbackFilePath, JSON.stringify(data, null, 2));
}

export async function getFeedback(): Promise<Feedback[]> {
  return await readFeedbackFile();
}

export async function saveFeedback(feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
  const allFeedback = await readFeedbackFile();
  const newFeedback: Feedback = {
    ...feedback,
    id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    createdAt: new Date().toISOString(),
  };
  allFeedback.push(newFeedback);
  await writeFeedbackFile(allFeedback);
  return newFeedback;
}

export async function deleteFeedback(feedbackId: string): Promise<{ success: boolean }> {
    let allFeedback = await readFeedbackFile();
    const initialLength = allFeedback.length;
    allFeedback = allFeedback.filter(f => f.id !== feedbackId);

    if (allFeedback.length < initialLength) {
        await writeFeedbackFile(allFeedback);
        return { success: true };
    } else {
        return { success: false };
    }
}
