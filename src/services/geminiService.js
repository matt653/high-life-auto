
import { GoogleGenAI } from "@google/genai";

export const analyzeVehicle = async (vehicle) => {
    // Parsing API Key from Vite env
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!apiKey) {
        throw new Error("API Key is missing. Please configure VITE_GEMINI_API_KEY in .env");
    }

    // Use the google-genai library as intended
    const ai = new GoogleGenAI({ apiKey });

    // --- Dynamic Weight Calculation for Prompt ---
    const price = parseFloat(vehicle.retail || 0);

    const prompt = `
    You are the Senior Inventory Manager for "HighLife Auto". 
    Your job is to produce a strict, honest, and multi-dimensional "Report Card" for this vehicle.
    
    **CORE PHILOSOPHY**: Judge based on Industry Standards vs Description and Obvious Care of the vehicle.
    
    CRITICAL INSTRUCTION: "LISTEN" TO THE VIDEO.
    The YouTube Test Drive video is your primary source of truth. 
    You MUST use the 'googleSearch' tool to find the video content for this specific URL: ${vehicle.youtubeUrl}
    
    **SEARCH STRATEGY**: 
    1. Search for the specific YouTube URL to find the video title and description.
    2. Search for "transcript" or "review" text associated with this specific video ID.
    3. Listen to the host (Miriam). If she mentions a flaw not in notes, **DEDUCT POINTS**.
    
    Target Vehicle:
    - ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}
    - Stock #: ${vehicle.stockNumber}
    - VIN: ${vehicle.vin}
    - Mileage: ${vehicle.mileage}
    - Asking Price: $${vehicle.retail}
    - INTERNAL DEALER COMMENTS: ${vehicle.comments}
    - WEBSITE NOTES: ${vehicle.websiteNotes || "None"}
    
    **GRADING RUBRIC (0.0 - 5.0 GPA Scale)**:
    Calculate the 'Overall Score' as an AVERAGE of these 7 categories.
    
    1. **Age/Demand**: 
       - JUDGE SOLELY BASED ON Year/Make/Model. 
       - DO NOT consider miles here.
       - High demand/Modern = High Grade (5.0). Old/Obscure = Lower.
       
    2. **Body Condition**: 
       - Use VIDEO or PICTURES (via description) to best judge.
       - Curb appeal, dents, rust, paint quality.
       
    3. **Reliability**:
       - Judge 3 Components: Engine, Transmission, Frame.
       - Source: Video audio or text description.
       - **CRITICAL**: If unknown/silent, grade at 2.5 (Average).
       
    4. **Minor Mechanical**: 
       - Accessories, wipers, brakes, suspension, AC, windows.
       - If NOT mentioned in video/notes, grade at 2.5 (Neutral).
       
    5. **Miles**:
       - Rate based on mileage for this specific year/engine logic.
       - Low miles for age = High Grade.
       
    6. **Title & History**:
       - If assumes clean based on lack of "Salvage" tags -> High Grade.
       - If "Rebuilt" or "Salvage" -> Low Grade (unless old car).
    
    7. **Value**:
       - Highlight this to help the customer spot a good deal.
       - Compare Price ($${vehicle.retail}) vs Approx Market Value.
       - Great Deal = 5.0.

    **TASKS**:
    1. **Analyze Video/Audio**: Extract honest positives and negatives.
    2. **Calculate Grades**: Fill the 7 categories above.
    3. **Write Copy**: Generate a 'Marketing Description' for the website.
       - **Reference the video directly**: "In the test drive, Miriam noted..." 
       - Tone: Informative, objective, helpful, and honest. No "hype".
       - Formatting: HTML tags <p>, <ul>, <li>, <strong>.
    4. **Honest Blemishes**: List specific flaws (e.g. "Scratch on bumper", "Tear in seat").

    OUTPUT JSON SCHEMA:
    Return a JSON object containing the 'grade' object, a 'marketingDescription' string, and a 'blemishes' array.
  `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
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
                                overallScore: { type: "NUMBER" }, // 0.0 to 5.0
                                overallGrade: { type: "STRING" }, // A+, A, etc.
                                summary: { type: "STRING" },
                                categories: {
                                    type: "OBJECT",
                                    properties: {
                                        body_condition: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        },
                                        reliability: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        },
                                        age_demand: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        },
                                        minor_mechanical: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        },
                                        miles: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        },
                                        title_history: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        },
                                        value: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        }
                                    },
                                    required: ["body_condition", "reliability", "age_demand", "minor_mechanical", "miles", "title_history", "value"]
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
