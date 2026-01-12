
import { GoogleGenAI, Type } from "@google/genai";
import { Vehicle, GradeResult, GroundingSource } from "../types";

interface AnalysisResult {
  grade: GradeResult;
  marketingDescription: string;
  groundingSources: GroundingSource[];
}

export const analyzeVehicle = async (vehicle: Vehicle): Promise<AnalysisResult> => {
  // Robust API Key retrieval: Checks build-time env var first, then runtime window shim (for drop-in builds)
  const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY || "";
  
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in .env or index.html");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    You are the Senior Inventory Manager for "HighLife Auto". 
    
    CRITICAL INSTRUCTION: "LISTEN" TO THE VIDEO.
    The YouTube Test Drive video is your primary source of truth. 
    You MUST use the 'googleSearch' tool to find the video content for this specific URL: ${vehicle.youtubeUrl}
    
    **SEARCH STRATEGY**: 
    1. Search for the specific YouTube URL to find the video title and description.
    2. Search for "transcript" or "review" text associated with this specific video ID.
    3. "Listen" to the host (Miriam). If she mentions a flaw that is not in the written notes, **DEDUCT POINTS**. If she praises the drive, **ADD POINTS**.

    Target Vehicle:
    - ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}
    - Stock #: ${vehicle.stockNumber}
    - VIN: ${vehicle.vin}
    - Mileage: ${vehicle.mileage}
    - Price: $${vehicle.retail}
    - INTERNAL DEALER COMMENTS: ${vehicle.comments}
    - WEBSITE NOTES: ${vehicle.websiteNotes || "None"}
    
    YOUR TASKS:
    1. **Audio/Video Analysis**: What did Miriam say? Did she say "It runs smooth"? Did she say "There is a small dent here"? 
       - If the video description/audio contradicts the CSV data, TRUST THE VIDEO.
    2. **Reliability Check**: Use your internal automotive knowledge to check this specific Year/Make/Model for common failure points (e.g., CVT transmission issues, timing chain guides).
    3. **Grade**: Generate the 5-point report card.
    4. **Write Copy**: Generate a "Marketing Description" for the website.
       - **Reference the video directly**: "In the test drive, Miriam noted..." or "As heard in the video..."
       - Tone: Professional, honest, upbeat.
       - Formatting: HTML tags <p>, <ul>, <li>, <strong>.

    OUTPUT JSON SCHEMA:
    Return a JSON object containing the 'grade' object and a 'marketingDescription' string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marketingDescription: { type: Type.STRING },
            grade: {
              type: Type.OBJECT,
              properties: {
                overallScore: { type: Type.NUMBER },
                overallGrade: { type: Type.STRING },
                summary: { type: Type.STRING },
                categories: {
                  type: Type.OBJECT,
                  properties: {
                    body: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        grade: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                      }
                    },
                    engine: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        grade: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                      }
                    },
                    history: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        grade: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                      }
                    },
                    mechanical: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        grade: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                      }
                    },
                    demand: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        grade: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                      }
                    }
                  },
                  required: ["body", "engine", "history", "mechanical", "demand"]
                }
              },
              required: ["overallScore", "overallGrade", "summary", "categories"]
            }
          },
          required: ["marketingDescription", "grade"]
        }
      }
    });

    if (response.text) {
        const result = JSON.parse(response.text);
        
        // Extract grounding sources from metadata
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: GroundingSource[] = groundingChunks
          .map((chunk: any) => chunk.web)
          .filter((web: any) => web && web.uri && web.title)
          .map((web: any) => ({
            uri: web.uri,
            title: web.title
          }));

        return {
          ...result,
          groundingSources: sources
        };
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
};
