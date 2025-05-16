// This is a server-side file.
'use server';

/**
 * @fileOverview Provides AI-powered room assignment suggestions based on guest preferences and historical data.
 *
 * - roomAssignmentSuggestions - A function that suggests optimal room assignments.
 * - RoomAssignmentInput - The input type for the roomAssignmentSuggestions function.
 * - RoomAssignmentOutput - The return type for the roomAssignmentSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RoomAssignmentInputSchema = z.object({
  guestPreferences: z
    .string()
    .describe('A description of the guest\s preferences, including past stays.'),
  roomAvailability: z.string().describe('Information about the current room availability.'),
  historicalData: z.string().describe('Historical booking data for the hotel.'),
});
export type RoomAssignmentInput = z.infer<typeof RoomAssignmentInputSchema>;

const RoomAssignmentOutputSchema = z.object({
  suggestedRoom: z.string().describe('The suggested room number for the guest.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the room assignment suggestion.'),
});
export type RoomAssignmentOutput = z.infer<typeof RoomAssignmentOutputSchema>;

export async function roomAssignmentSuggestions(input: RoomAssignmentInput): Promise<RoomAssignmentOutput> {
  return roomAssignmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'roomAssignmentPrompt',
  input: {schema: RoomAssignmentInputSchema},
  output: {schema: RoomAssignmentOutputSchema},
  prompt: `You are an AI assistant designed to suggest the best room assignment for hotel guests.

  Consider the guest's preferences, room availability, and historical booking data to make the best suggestion.

  Guest Preferences: {{{guestPreferences}}}
  Room Availability: {{{roomAvailability}}}
  Historical Data: {{{historicalData}}}

  Based on this information, which room would you suggest and why?
  Please provide the suggested room number and your reasoning.
  Ensure the output is valid JSON.`,
});

const roomAssignmentFlow = ai.defineFlow(
  {
    name: 'roomAssignmentFlow',
    inputSchema: RoomAssignmentInputSchema,
    outputSchema: RoomAssignmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
