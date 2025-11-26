'use server';
/**
 * @fileOverview An AI flow for extracting vehicle information from an image.
 *
 * - extractVehicleInfo - A function that handles the vehicle information extraction process.
 * - ExtractVehicleInfoInput - The input type for the extractVehicleInfo function.
 * - ExtractVehicleInfoOutput - The return type for the extractVehicleInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractVehicleInfoInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a vehicle, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractVehicleInfoInput = z.infer<typeof ExtractVehicleInfoInputSchema>;

const ExtractVehicleInfoOutputSchema = z.object({
  licensePlate: z.string().describe("The license plate number of the vehicle. If not found, return 'NO_LICENSE_PLATE_DETECTED'."),
  owner: z.object({
    name: z.string().describe("The fictional owner's full name."),
    address: z.string().describe("The fictional owner's address."),
    phone: z.string().describe("The fictional owner's phone number."),
  }).describe("Generated fictional information about the vehicle's owner."),
});
export type ExtractVehicleInfoOutput = z.infer<typeof ExtractVehicleInfoOutputSchema>;

export async function extractVehicleInfo(input: ExtractVehicleInfoInput): Promise<ExtractVehicleInfoOutput> {
  return extractVehicleInfoFlow(input);
}

const extractVehicleInfoPrompt = ai.definePrompt({
  name: 'extractVehicleInfoPrompt',
  input: {schema: ExtractVehicleInfoInputSchema},
  output: {schema: ExtractVehicleInfoOutputSchema},
  prompt: `You are an expert vehicle recognition system. Your task is to analyze the provided image of a vehicle and extract the following information using OCR and image analysis:
1. The license plate number. If you cannot find a license plate in the image, you MUST return 'NO_LICENSE_PLATE_DETECTED' for the licensePlate field.
2. Generate plausible but CLEARLY FICTIONAL information for the vehicle's owner, including a name, address, and phone number. This is for demonstration purposes only.

Analyze the image provided and return the information in the specified JSON format.

Image: {{media url=imageDataUri}}`,
});

const extractVehicleInfoFlow = ai.defineFlow(
  {
    name: 'extractVehicleInfoFlow',
    inputSchema: ExtractVehicleInfoInputSchema,
    outputSchema: ExtractVehicleInfoOutputSchema,
  },
  async input => {
    const {output} = await extractVehicleInfoPrompt(input);
    return output!;
  }
);
