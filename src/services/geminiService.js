
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

    const weights = {
        age: "15%",
        body: price >= 2000 ? "20%" : "10%",
        rel: "25%",
        minor: "15%",
        int: price < 3000 ? "5%" : "10%",
        hist: price > 5000 ? "10%" : "5%",
        val: price < 3000 ? "25%" : "5%"
    };

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
    
    **GRADING RUBRIC (Strictly Weighted)**:
    Calculate the 'Overall Score' (0-100) based on these weighted categories.
    
    1. **Age/Demand (${weights.age})**: Market demand in our area. Is it a classic or just old? High demand = higher grade.
    2.  **Body Condition (${weights.body})**: Curb appeal. Dents/Rust/Paint. Video is source of truth.
    3.  **Reliability (Major) (${weights.rel})**: Proven engine/transmission/frame.
        -   **RESOURCE**: You MUST query your knowledge of 'dashboard-light.com' context for this model's powertrain reliability vs mileage.
        -   Example: 200k on a proven diesel is fine (B grade), but 200k on a weak 4-cyl is bad (D grade).
    4.  **Minor Mechanical (${weights.minor})**: Accessories, wipers, brakes, suspension, radio, windows, AC.
    5.  **Interior (${weights.int})**: Seats, carpet, headliner, panels.
        -   Video: Look for tears or stains mentioned by Miriam.
    6.  **History & Usage (${weights.hist})**:
        -   Mileage context + Title History (Salvage, Flood, Lemon).
        -   If Salvage was 10 years/100k miles ago, punishment is MINOR. If recent, punishment is MAJOR.
    7.  **Value (${weights.val})**:
        -   Compare Asking Price ($${vehicle.retail}) vs Typical Market Value for this specific VIN/Trim/Miles.
        -   If we are under market value -> High Grade (A). If over -> Low Grade.

    **TASKS**:
    1. **Analyze Video/Audio**: Extract honest positives and negatives.
    2. **Calculate Grades**: Fill the 7 categories above.
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
                                overallScore: { type: "NUMBER" },
                                overallGrade: { type: "STRING" },
                                summary: { type: "STRING" },
                                categories: {
                                    type: "OBJECT", // 7 Categories
                                    properties: {
                                        age_demand: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        },
                                        body_condition: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        },
                                        reliability: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        },
                                        minor_mechanical: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        },
                                        interior: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        },
                                        road_history: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        },
                                        value_grade: {
                                            type: "OBJECT",
                                            properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } }
                                        }
                                    },
                                    required: ["age_demand", "body_condition", "reliability", "minor_mechanical", "interior", "road_history", "value_grade"]
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
