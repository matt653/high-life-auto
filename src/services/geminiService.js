
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
    
    **GLOBAL RULE - NO DOUBLE JEOPARDY**: 
    - Do NOT deduct for Mileage in 'Reliability', 'Body', or 'Minor Mechanical'. 
    - Mileage is judged ONLY in the 'Miles' category.
    - Start every category at **5.0** and deduct **ONLY** for proven facts (video evidence, dealer notes).
    - If information is missing, **ASSUME PERFECTION (5.0)**.
    
    1. **Age/Demand**: 
       - JUDGE SOLELY BASED ON Year/Make/Model. 
       - Do NOT consider miles here.
       - High demand/Modern = 5.0.
       
    2. **Body Condition**: 
       - Start at 5.0. Deduct ONLY for specific visible flaws (dents, rust, tears) seen in video/photos.
       
    3. **Reliability**:
       - Start at 5.0 (Assume Engine/Trans/Frame are perfect).
       - Deduct **ONLY** if the host explicitly mentions a mechanical flaw (e.g. "transmission slips", "check engine light").
       - **Do NOT speculate**. If the video is silent on mechanics, assume it runs perfectly.
       
    4. **Minor Mechanical**: 
       - Start at 5.0.
       - Deduct ONLY if specific items are broken (e.g. "AC doesn't work", "cracked windshield").
       - If not mentioned, assume 5.0.
       
    5. **Miles**:
       - **THIS** is the only place to grade mileage.
       - Low miles for year = 5.0. High miles = Lower grade.
       
    6. **Title & History**:
       - Clean Title = 5.0.
       - Deduct for Salvage/Rebuilt/Lemon (unless very old vehicle where it matters less).
    
    7. **Value**:
       - Compare Price ($${vehicle.retail}) vs Approx Market Value.
       - Great Deal = 5.0.

    **TASKS**:
    1. **Analyze Video/Audio**: Extract honest positives and negatives.
    2. **Calculate Grades**: Fill the 7 categories above.
       - **EXPLAIN DEDUCTIONS**: If grade < 5.0, explicitly state WHY in the reasoning.
       - Example: "Deducted 0.5 for visible door scratch", "Deducted 1.0 for 210k miles".
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
