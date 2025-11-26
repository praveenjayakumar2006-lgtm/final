'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/detect-parking-violations.ts';
import '@/ai/flows/extract-vehicle-info.ts';
