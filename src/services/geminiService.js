
import { GoogleGenAI } from "@google/genai";

export const analyzeVehicle = async (vehicle) => {
    // Parsing API Key from Vite env
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!apiKey) {
        throw new Error("API Key is missing. Please configure VITE_GEMINI_API_KEY in .env");
    }

    // Use the google-genai library as intended
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
       - **CONSTRAINT**: Do NOT mention the Stock Number in this text.
       - Tone: Informative, objective, helpful, and honest. Avoid "salesy" language or hype. Just facts and observations.
       - Formatting: HTML tags <p>, <ul>, <li>, <strong>.
    5. **Honest Blemishes**: List specific cosmetic or mechanical flaws mentioned in the video or notes (e.g., "Scratch on rear bumper", "Tear in driver seat"). Be specific. If none, return an empty list.

    OUTPUT JSON SCHEMA:
    Return a JSON object containing the 'grade' object, a 'marketingDescription' string, and a 'blemishes' array.
  `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp", // Updated to a known valid model or use gemini-1.5-flash
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        marketingDescription: { type: "STRING" },
                        blemishes: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        },
                        grade: {
                            type: "OBJECT",
                            properties: {
                                overallScore: { type: "NUMBER" },
                                overallGrade: { type: "STRING" },
                                summary: { type: "STRING" },
                                categories: {
                                    type: "OBJECT",
                                    properties: {
                                        body: {
                                            type: "OBJECT",
                                            properties: {
                                                name: { type: "STRING" },
                                                score: { type: "NUMBER" },
                                                grade: { type: "STRING" },
                                                reasoning: { type: "STRING" }
                                            }
                                        },
                                        engine: {
                                            type: "OBJECT",
                                            properties: {
                                                name: { type: "STRING" },
                                                score: { type: "NUMBER" },
                                                grade: { type: "STRING" },
                                                reasoning: { type: "STRING" }
                                            }
                                        },
                                        history: {
                                            type: "OBJECT",
                                            properties: {
                                                name: { type: "STRING" },
                                                score: { type: "NUMBER" },
                                                grade: { type: "STRING" },
                                                reasoning: { type: "STRING" }
                                            }
                                        },
                                        mechanical: {
                                            type: "OBJECT",
                                            properties: {
                                                name: { type: "STRING" },
                                                score: { type: "NUMBER" },
                                                grade: { type: "STRING" },
                                                reasoning: { type: "STRING" }
                                            }
                                        },
                                        demand: {
                                            type: "OBJECT",
                                            properties: {
                                                name: { type: "STRING" },
                                                score: { type: "NUMBER" },
                                                grade: { type: "STRING" },
                                                reasoning: { type: "STRING" }
                                            }
                                        }
                                    },
                                    required: ["body", "engine", "history", "mechanical", "demand"]
                                }
                            },
                            required: ["overallScore", "overallGrade", "summary", "categories"]
                        }
                    },
                    required: ["marketingDescription", "grade", "blemishes"]
                }
            }
        });

        if (response.text) {
            const result = JSON.parse(response.text);

            // Extract grounding sources from metadata
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const sources = groundingChunks
                .map((chunk) => chunk.web)
                .filter((web) => web && web.uri && web.title)
                .map((web) => ({
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
