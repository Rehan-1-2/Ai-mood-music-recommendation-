
import { GoogleGenAI, Type } from "@google/genai";
import { RecommendationResponse, Mood, Song } from '../types';

const getMoodValues = (): string[] => {
    return Object.values(Mood);
};

export const getMoodAndRecommendations = async (text: string, imageData?: string): Promise<RecommendationResponse> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = `You are a music recommendation expert. Your task is to analyze the user's input (text and/or image of their face) to determine their primary mood and recommend 10 songs that perfectly match it.
The input might be a text description, a voice transcript, emojis, or an image of the user's facial expression.
If an image is provided, carefully analyze the facial expression to detect emotion.
The mood must be one of the following: ${getMoodValues().join(', ')}.
The user prefers Indian songs, so you must prioritize recommendations from Indian artists and movies.
For each song, you must provide the title, artist, a valid Spotify search URL (e.g., https://open.spotify.com/search/...), a URL for the album art, and a URL for a short audio preview (e.g., an MP3 link), if available.
You must return the result as a JSON object with the determined mood and the list of songs.`;
    
    let parts: any[] = [];
    if (text) {
      parts.push({ text: `User text input: "${text}"` });
    }
    
    if (imageData) {
      // Remove data:image/...;base64, prefix if present
      const base64Data = imageData.split(',')[1] || imageData;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      });
      parts.push({ text: "Analyze the facial expression in this image to help determine the mood." });
    }

    if (parts.length === 0) {
      throw new Error("No input provided (text or image).");
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        mood: {
          type: Type.STRING,
          enum: getMoodValues(),
          description: "The user's primary mood."
        },
        songs: {
          type: Type.ARRAY,
          description: "A list of 10 song recommendations.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "The title of the song."
              },
              artist: {
                type: Type.STRING,
                description: "The artist of the song."
              },
              spotifyUrl: {
                type: Type.STRING,
                description: "A valid Spotify search URL for the song."
              },
              albumArtUrl: {
                type: Type.STRING,
                description: "URL for the song's album art."
              },
              previewUrl: {
                type: Type.STRING,
                description: "URL for a short audio preview of the song (e.g., an MP3 link), if available."
              }
            },
            required: ["title", "artist", "spotifyUrl", "albumArtUrl", "previewUrl"]
          }
        }
      },
      required: ["mood", "songs"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    // Validate the structure of the parsed response
    // FIX: Relaxed validation to allow for an empty list of songs, making the handling more robust.
    if (parsedResponse.mood && Array.isArray(parsedResponse.songs)) {
        return parsedResponse as RecommendationResponse;
    } else {
        throw new Error("Invalid response structure from AI model.");
    }

  } catch (error) {
    console.error("Error fetching recommendations from Gemini API:", error);
    throw new Error("Failed to get recommendations. The AI might be feeling a bit off-key right now.");
  }
};

export const getSongOfTheDay = async (): Promise<Song> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const dateStr = new Date().toLocaleDateString();

    const systemInstruction = `You are a music curator. Your task is to recommend one specific, unique, and excellent song as the "Song of the Day" for today (${dateStr}).
The song should be distinct, high-quality, and generally appealing.
The user prefers Indian songs, so prioritizing Indian artists or fusion is good, but feel free to pick a global hit if it fits the vibe of the day.
For the song, you must provide the title, artist, a valid Spotify search URL, a URL for the album art, and a URL for a short audio preview (e.g., an MP3 link) if available.
Return a JSON object with the song details.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        artist: { type: Type.STRING },
        spotifyUrl: { type: Type.STRING },
        albumArtUrl: { type: Type.STRING },
        previewUrl: { type: Type.STRING },
      },
      required: ["title", "artist", "spotifyUrl", "albumArtUrl", "previewUrl"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Recommend the Song of the Day.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const song = JSON.parse(jsonText);
    return song as Song;

  } catch (error) {
    console.error("Error fetching Song of the Day:", error);
    throw new Error("Could not fetch the song of the day.");
  }
};