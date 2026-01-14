
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
    - Asking Price: $${vehicle.retail}
    - INTERNAL DEALER COMMENTS: ${vehicle.comments}
    - WEBSITE NOTES: ${vehicle.websiteNotes || "None"}
    
    **NEW GRADING SYSTEM (5.0 GPA SCALE)**:
    - Score each category from **0.0 to 5.0**.
    - **Overall Grade** is the **AVERAGE** of the 7 category scores.
    
    **LETTER GRADE RUBRIC**:
    - **A+**: 4.8 - 5.0
    - **A** : 4.4 - 4.7
    - **A-**: 4.0 - 4.3
    - **B+**: 3.8 - 3.9
    - **B** : 3.4 - 3.7
    - **B-**: 3.0 - 3.3
    - **C+**: 2.8 - 2.9
    - **C** : 2.4 - 2.7
    - **C-**: 2.0 - 2.3
    - **D** : 1.0 - 1.9
    - **F** : 0.0 - 0.9

    **THE 7 GRADING CATEGORIES**:
    1. **Body Condition**: Overall appearance, paint, dents, rust (AI Graded based on video).
    2. **Reliability**: Average of 3 components: Engine, Transmission, Frame. Use "Dashboard-Light" logic.
    3. **Age & Demand**: Curb appeal. Is it a classic? A fast seller? Or just old and crusty?
    4. **Minor Mechanical**: Brakes, suspension, radio, windows, AC, wipers.
    5. **Miles**: Longevity context. Does this engine run forever? Or is 80k miles the limit?
    6. **Title & History**: Context of events. Old salvage vs new salvage. Lemon buyback?
    7. **Value**: Risk vs Reward. compare asking price to market value.

    **TASKS**:
    1. **Analyze Video/Audio**: Extract honest positives and negatives.
    2. **Calculate Grades**: Fill the 7 categories (0-5 scale). Calculate Average for overall.
    3. **Write Copy**: Generate a 'Marketing Description' for the website.
       - **Reference the video directly**: "In the test drive, Miriam noted..." 
       - **CONSTRAINT**: Do NOT mention the Stock Number.
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
