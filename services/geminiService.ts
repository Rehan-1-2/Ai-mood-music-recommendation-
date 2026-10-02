import { GoogleGenAI, Type } from "@google/genai";
import { RecommendationResponse, Mood, Song } from '../types';

const getMoodValues = (): string[] => {
    return Object.values(Mood);
};

const cleanSearchQuery = (text: string): string => {
  return text
    .replace(/\s*[[(][^)\]]*[)\]]/g, '') // Remove parentheses/brackets content (e.g. Yeh Jawaani Hai Deewani)
    .replace(/["']/g, '') // Remove quotes
    .trim();
};

export const fetchRealSongData = async (title: string, artist: string): Promise<{ albumArtUrl: string | null, previewUrl: string | null } | null> => {
  try {
    const cleanTitle = cleanSearchQuery(title);
    const cleanArtist = cleanSearchQuery(artist);
    const query = `${cleanTitle} ${cleanArtist}`;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=1&media=music`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const artworkUrl = result.artworkUrl100;
      let albumArtUrl = artworkUrl ? artworkUrl.replace('100x100bb.jpg', '600x600bb.jpg') : null;
      let previewUrl = result.previewUrl || null;
      return { albumArtUrl, previewUrl };
    }
  } catch (error) {
    console.warn("Failed to fetch real song data from iTunes:", error);
  }
  return null;
};

// Instantiates a shared, compliant server-side Gemini client with user-agent headers
const getGeminiClient = (): GoogleGenAI => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
};

export const getMoodAndRecommendations = async (text: string, imageData?: string): Promise<RecommendationResponse> => {
  try {
    const ai = getGeminiClient();

    const systemInstruction = `You are an elite music recommendations system specializing in Indian/Bollywood, Punjabi, Sufi, and iconic global music.
Your task is to analyze the user's input (which can be text description in English, Hindi, or Hinglish like "bohot khush hoon", "gym workout vibe", "sad mood", emojis, or facial expression description) to determine their primary mood.
The determined mood MUST be exactly one of these: ${getMoodValues().join(', ')}.

IMPORTANT PLAYBACK & INTEGRITY RULE:
To ensure 100% playable backends without dead playbacks, you MUST only assign "previewUrl" and "albumArtUrl" properties from the vetted asset pools matching the mapped moods of the songs. Do NOT make up random Spotify, Apple Music, or empty preview links. Choose randomly within the specified array for variety!

ASSET REGISTRY PER MOOD GROUP:
Group A: Happy, Energetic, Hopeful, Romantic, Nostalgic
  - previewUrls (choose one randomly per song):
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"
  - albumArtUrls (choose one randomly per song):
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop"

Group B: Sad, Lonely, Anxious, Stressed, Angry
  - previewUrls (choose one randomly per song):
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3"
  - albumArtUrls (choose one randomly per song):
    "https://images.unsplash.com/photo-1481238953635-527fe7902f13?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop"

Group C: Relaxed, Focused
  - previewUrls (choose one randomly per song):
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3"
  - albumArtUrls (choose one randomly per song):
    "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1487180142328-054b783fc471?w=300&h=300&fit=crop"

RECOMMENDATION MUSIC BANK (Prioritize legendary Indian/Bollywood songs for each mood):
- Happy: 'Kabira' (Yeh Jawaani Hai Deewani), 'Matargashti' (Tamasha), 'Udd Gaye' (Ritviz), 'Gallan Goodiyaan' (Dil Dhadakne Do), 'Ilahi', 'Char Kadam', 'Badri Ki Dulhania'.
- Sad: 'Channa Mereya' (Arijit Singh), 'Agar Tum Saath Ho' (Tamasha), 'Tujhe Kitna Chahne Lage' (Kabir Singh), 'Humari Adhuri Kahani', 'Tujhe Bhula Diya'.
- Angry: 'Apna Time Aayega' (Gully Boy), 'Bhaag D.K. Bose' (Delhi Belly), 'Sadda Haq' (Rockstar), 'Aarambh Hai Prachand', 'Kar Har Maidaan Fateh'.
- Relaxed: 'Kho Gaye Hum Kahan' (Jasleen Royal), 'Iktara' (Wake Up Sid), 'Sham' (Amit Trivedi), 'Kun Faya Kun' (A.R. Rahman), 'Der Se Chale'.
- Energetic: 'Mauja Hi Mauja' (Jab We Met), 'Malhari' (Bajirao Mastani), 'Mundian To Bach Ke' (Panjabi MC), 'Khalibali', 'Ghungroo', 'London Thumakda'.
- Lonely: 'Jag Ghoomeya' (Sultan), 'Kahiin To' (Jaane Tu Ya Jaane Na), 'Tanhaaye' (Dil Chahta Hai), 'Jiyein Kyun' (Papon), 'Aadat'.
- Hopeful: 'Love You Zindagi' (Dear Zindagi), 'Aashayein' (Iqbal), 'Kun Faya Kun', 'All Izz Well' (3 Idiots), 'Yun Hi Chala Chal'.
- Stressed: 'Tum Se Hi' (Jab We Met), 'Mast Magan' (2 States), 'Manwa Laage', 'Raabta', 'Heeriye' (Arijit Singh).
- Romantic: 'Kesariya' (Brahmastra), 'Tum Se Hi', 'Raatan Lambiyan' (Shershaah), 'Pehla Nasha' (Jo Jeeta Wohi Sikandar), 'Chura Liya Hai Tumne'.
- Focused: 'Sitar Chill Instrumentals', 'Indian Classical Flute Focus', 'Ektara Sitar Ambient Raga', 'Tabla Lo-Fi Study Beats'.
- Nostalgic: 'Lag Ja Gale' (Lata Mangeshkar), 'Chura Liya Hai', 'Kabhi Kabhie Mere Dil Mein', 'Yeh Dosti' (Sholay), 'Papa Kehte Hain'.
- Anxious: 'Sufi Peaceful Soul Meditation', 'Kun Faya Kun Instrumental Deep Calm', 'Soothing Sitar Om Meditation', 'Indian Bamboo Flute Soundscape'.

SPOTIFY SEARCH URL RULE:
For each song, construct the 'spotifyUrl' strictly using: https://open.spotify.com/search/[query-url-encoded] where query is "[Song Title] [Artist]". e.g., https://open.spotify.com/search/Kabira%20Arijit%20Singh

INPUT SENTIMENT DEPTH:
Carefully parse modern Hindi slang expressions and emotional nuances. (e.g., "dil bechain hai" = Anxious, "bohot bore ho rha hu" = Lonely, "aaj dosto se mila maza aa gya" = Happy, "gym ja rha hu" = Energetic, "exam stress" = Stressed, etc.)

Provide exactly 10 distinct, highly matching song recommendations. Return only a valid JSON conforming to the response schema.`;

    let parts: any[] = [];
    if (text) {
      parts.push({ text: `User input query: "${text}"` });
    }
    
    if (imageData) {
      const base64Data = imageData.split(',')[1] || imageData;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      });
      parts.push({ text: "Analyze the facial expression or user upload context to refine emotional vibe categorization." });
    }

    if (parts.length === 0) {
      throw new Error("No inputs provided for vibe curating.");
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        mood: {
          type: Type.STRING,
          enum: getMoodValues(),
          description: "The primary detected mood of the user."
        },
        songs: {
          type: Type.ARRAY,
          description: "A list of 10 customized song recommendations corresponding perfectly to the detected mood.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "The title of the song."
              },
              artist: {
                type: Type.STRING,
                description: "The main vocalist/artist of the song."
              },
              spotifyUrl: {
                type: Type.STRING,
                description: "A valid Spotify web search URL for easy full playback."
              },
              albumArtUrl: {
                type: Type.STRING,
                description: "An elegant corresponding album art image URL matching the mood from the Unsplash list."
              },
              previewUrl: {
                type: Type.STRING,
                description: "One of the highly reliable direct playback MP3 preview links specified for the mood group."
              }
            },
            required: ["title", "artist", "spotifyUrl", "albumArtUrl", "previewUrl"]
          }
        }
      },
      required: ["mood", "songs"]
    };

    // Use gemini-3.5-flash-lite for faster latency, high reliability, and optimal throughput
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    if (parsedResponse.mood && Array.isArray(parsedResponse.songs)) {
        // Parallelized real-time enrichment utilizing the free, CORS-supported iTunes Search API 
        parsedResponse.songs = await Promise.all(parsedResponse.songs.map(async (song: any) => {
          const realData = await fetchRealSongData(song.title, song.artist);
          if (realData) {
            if (realData.albumArtUrl) song.albumArtUrl = realData.albumArtUrl;
            if (realData.previewUrl) song.previewUrl = realData.previewUrl;
          }
          return song;
        }));
        return parsedResponse as RecommendationResponse;
    } else {
        throw new Error("Malformed JSON structure retrieved from recommendation engine.");
    }

  } catch (error) {
    console.error("Error fetching recommendations from Gemini API:", error);
    throw new Error("Failed to curate music recommendations. Please check your connectivity or try describing your feeling differently!");
  }
};

export const getSongOfTheDay = async (excludeTitles: string[] = []): Promise<Song> => {
  try {
    const ai = getGeminiClient();
    const today = new Date();
    const dateFormatted = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Curated day-of-week themes to guarantee daily variety
    const dayThemes: Record<number, string> = {
      0: "Sunday Soul & Serenity (soulful, peaceful acoustic gems, Coke Studio, timeless melodies)",
      1: "Monday Momentum (uplifting, energetic Bollywood anthems and motivating indie grooves to ignite the week)",
      2: "Tuesday Retro Gold (legendary vintage masterpieces, R.D. Burman, Kishore Kumar, Mohd Rafi, 70s-90s classics)",
      3: "Wednesday Waves (modern indie fusion, acoustic pop, Prateek Kuhad, Anuv Jain, contemporary singer-songwriter)",
      4: "Thursday Acoustic Romance (magical romantic melodies, Arijit Singh, Mohit Chauhan, Shreya Ghoshal, KK)",
      5: "Friday High Energy Fiesta (vibrant, dance, celebratory, Punjabi beats, high tempo party & festive bangers)",
      6: "Saturday Sonic Journey (grand cinematic film scores, A.R. Rahman masterpieces, rock and Sufi fusion)"
    };
    const currentTheme = dayThemes[today.getDay()] || "Legendary Melodies";

    const excludeClause = excludeTitles.length > 0
      ? `CRITICAL DIVERSITY RULE: Do NOT recommend any of these recently featured songs: ${excludeTitles.slice(-15).map(t => `"${t}"`).join(', ')}. Pick a completely different, fresh, iconic track.`
      : '';

    const systemInstruction = `You are an elite music curator recommending the daily "Song of the Day" for ${dateFormatted}.
Today's Theme: ${currentTheme}.
Your task is to select ONE legendary, celebrated Indian/Bollywood, Indie, Sufi, or South Asian song that fits today's vibe and is distinctly different every single day.

${excludeClause}

For the song, you must produce:
- title: The title of the song (e.g. "Chaiyya Chaiyya", "Kun Faya Kun", "Iktara", "Zara Sa", "Mera Safar", "Tum Se Hi", "Ilahi", "Baarishein", etc.)
- artist: The main vocalist/music director (e.g. Arijit Singh, A.R. Rahman, Mohit Chauhan, KK, Shreya Ghoshal, Kishore Kumar, Ritviz, Prateek Kuhad)
- spotifyUrl: A clean search link formatted as https://open.spotify.com/search/[url-encoded-query]
- albumArtUrl: A gorgeous music-themed Unsplash image URL
- previewUrl: A high-fidelity, verified preview track (choose one of:
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3")

Ensure perfect JSON formatting.`;

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
      model: "gemini-3.5-flash-lite",
      contents: `Query today's unique Song of the Day for ${dateFormatted}. Random seed: ${Math.random().toString(36).substring(7)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.95,
      },
    });

    const jsonText = response.text.trim();
    const song = JSON.parse(jsonText);
    
    // Enrich Song of the Day with iTunes real-time metadata (real album cover and real preview audio)
    const realData = await fetchRealSongData(song.title, song.artist);
    if (realData) {
      if (realData.albumArtUrl) song.albumArtUrl = realData.albumArtUrl;
      if (realData.previewUrl) song.previewUrl = realData.previewUrl;
    }
    return song as Song;

  } catch (error) {
    console.error("Error fetching Song of the Day:", error);
    const fallbackSongs: Song[] = [
      {
        title: "Iktara",
        artist: "Kavita Seth & Amitabh Bhattacharya",
        spotifyUrl: "https://open.spotify.com/search/Iktara%20Wake%20Up%20Sid",
        albumArtUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
      },
      {
        title: "Kun Faya Kun",
        artist: "A.R. Rahman, Javed Ali, Mohit Chauhan",
        spotifyUrl: "https://open.spotify.com/search/Kun%20Faya%20Kun%20Rockstar",
        albumArtUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3"
      },
      {
        title: "Chaiyya Chaiyya",
        artist: "Sukhwinder Singh, Sapna Awasthi",
        spotifyUrl: "https://open.spotify.com/search/Chaiyya%20Chaiyya%20Dil%20Se",
        albumArtUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      },
      {
        title: "Ilahi",
        artist: "Arijit Singh",
        spotifyUrl: "https://open.spotify.com/search/Ilahi%20Yeh%20Jawaani%20Hai%20Deewani",
        albumArtUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
      },
      {
        title: "Tum Se Hi",
        artist: "Mohit Chauhan",
        spotifyUrl: "https://open.spotify.com/search/Tum%20Se%20Hi%20Jab%20We%20Met",
        albumArtUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"
      }
    ];
    const randomIndex = Math.floor(Math.random() * fallbackSongs.length);
    return fallbackSongs[randomIndex];
  }
};
