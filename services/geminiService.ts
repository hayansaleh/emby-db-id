
import { GoogleGenAI, Type } from '@google/genai';
import type { MovieData } from '../types';

const DATABASE_INFO: { [key: string]: { name: string; format: string } } = {
  imdb: { name: 'IMDb ID', format: 'a unique identifier that starts with "tt" followed by digits (e.g., tt0111161)' },
  tmdb: { name: 'The Movie Database (TMDb) ID', format: 'a numerical identifier (e.g., 550)' },
  rotten_tomatoes: { name: 'Rotten Tomatoes URL', format: 'the full URL to the movie page (e.g., https://www.rottentomatoes.com/m/the_godfather)' },
};

const geminiService = {
  async extractMovieIds(movieList: string, database: string): Promise<MovieData[]> {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const dbInfo = DATABASE_INFO[database] || DATABASE_INFO.imdb;

    const prompt = `
      From the following list of movie titles, extract the corresponding ${dbInfo.name} for each movie.
      The ${dbInfo.name} is ${dbInfo.format}.
      
      Rules:
      1. For each movie title, provide the movie title and its ${dbInfo.name}.
      2. If you cannot find a valid ID or URL for a specific movie, use "N/A" as the value for 'databaseId'.
      3. Ensure the output is a valid JSON array of objects.

      Movie List:
      ---
      ${movieList}
      ---
    `;

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          movieTitle: {
            type: Type.STRING,
            description: "The original title of the movie from the provided list.",
          },
          databaseId: {
            type: Type.STRING,
            description: `The ${dbInfo.name} for the movie or 'N/A' if not found.`,
          },
        },
        required: ["movieTitle", "databaseId"],
      },
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0,
        },
      });

      const jsonString = response.text;
      if (!jsonString) {
          throw new Error("Received an empty response from the API.");
      }

      // Clean the response string in case it's wrapped in markdown
      const cleanedJsonString = jsonString.replace(/^```json\s*|```\s*$/g, '').trim();
      
      const parsedData: MovieData[] = JSON.parse(cleanedJsonString);
      return parsedData;

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new Error("Failed to communicate with the Gemini API.");
    }
  },
};

export const { extractMovieIds } = geminiService;
