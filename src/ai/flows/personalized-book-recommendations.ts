'use server';
/**
 * @fileOverview Personalized book recommendations flow.
 *
 * This flow takes user's reading level, interests, and past activity as input and returns personalized book recommendations.
 *
 * @interface PersonalizedBookRecommendationsInput - Input for the personalized book recommendations flow.
 * @interface PersonalizedBookRecommendationsOutput - Output of the personalized book recommendations flow.
 * @function getPersonalizedBookRecommendations - Main function to trigger the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedBookRecommendationsInputSchema = z.object({
  readingLevel: z.string().describe('The user reading level.'),
  interests: z.string().describe('The user interests.'),
  pastActivity: z.string().describe('The user past activity (reading history).'),
});
export type PersonalizedBookRecommendationsInput = z.infer<typeof PersonalizedBookRecommendationsInputSchema>;

const PersonalizedBookRecommendationsOutputSchema = z.object({
  bookRecommendations: z.array(z.string()).describe('A list of personalized book recommendations.'),
});
export type PersonalizedBookRecommendationsOutput = z.infer<typeof PersonalizedBookRecommendationsOutputSchema>;

export async function getPersonalizedBookRecommendations(
  input: PersonalizedBookRecommendationsInput
): Promise<PersonalizedBookRecommendationsOutput> {
  return personalizedBookRecommendationsFlow(input);
}

const personalizedBookRecommendationsPrompt = ai.definePrompt({
  name: 'personalizedBookRecommendationsPrompt',
  input: {schema: PersonalizedBookRecommendationsInputSchema},
  output: {schema: PersonalizedBookRecommendationsOutputSchema},
  prompt: `You are a personal book recommender. Based on the user's reading level, interests, and past activity, recommend a list of books that they might enjoy.

Reading Level: {{{readingLevel}}}
Interests: {{{interests}}}
Past Activity: {{{pastActivity}}}

Book Recommendations:`,}
);

const personalizedBookRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedBookRecommendationsFlow',
    inputSchema: PersonalizedBookRecommendationsInputSchema,
    outputSchema: PersonalizedBookRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await personalizedBookRecommendationsPrompt(input);
    return output!;
  }
);
