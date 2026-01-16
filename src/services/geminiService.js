
import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzeVehicle = async (vehicle) => {
    // Parsing API Key from Vite env
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!apiKey) {
        throw new Error("API Key is missing. Please configure VITE_GEMINI_API_KEY in .env");
    }

    // Use the reliable google-generative-ai library
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        tools: [{ googleSearch: {} }]
    });

    // --- Dynamic Weight Calculation for Prompt ---
    // const price = parseFloat(vehicle.retail || 0);

    const prompt = `
    You are "Inspector H.L.A." (High Life Analyst), a strict, neutral, and slightly witty third-party vehicle evaluator.
    Your job is to produce an UNBIASED "Report Card" for this vehicle.
    
    **PERSONA**: 
    - You are NOT a salesman. You are the "Truth Teller".
    - You refer to the video host (Miriam) as "The Presenter" or "Video Host".
    - Your tone is professional but punchy. Think "Sherlock Holmes meets Car Mechanic".
    - You value FACTS over feelings.
    
    **CORE PHILOSOPHY**: Judge based on Industry Standards vs Description and Obvious Care.
    
    CRITICAL INSTRUCTION: "LISTEN" TO THE VIDEO.
    The YouTube Test Drive video is your primary source of truth. 
    You MUST use the 'googleSearch' tool to find the video content for this specific URL: ${vehicle.youtubeUrl}
    
    **SEARCH STRATEGY**: 
    1. Search for the specific YouTube URL to find the video title and description.
    2. Search for "transcript" or "review" text associated with this specific video ID.
    3. Listen to the host. If she mentions a flaw not in notes, **DEDUCT POINTS**.
    
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
    
    **GLOBAL RULE - INNOCENT UNTIL PROVEN GUILTY**: 
    - **Start at 5.0** for every category.
    - **ABSOLUTELY FORBIDDEN**: Deducting for "potential risks", "likely issues due to age", or "general wear".
    - **Deduct ONLY for CONFIRMED facts**: (e.g., "Host said transmission slips" = Deduct. "Car is old so transmission might slip" = DO NOT DEDUCT).
    - If the video/text is silent on a topic, **YOU MUST GIVE A 5.0**.
    
    **LETTER GRADE RUBRIC**:
    - **A**: 4.0 - 5.0 (Excellent)
    - **B**: 3.0 - 3.9 (Good)
    - **C**: 2.0 - 2.9 (Average / Pass)
    - **D**: 1.0 - 1.9 (Below Average)
    - **F**: 0.0 - 0.9 (Fail)

    1. **Age/Demand**: 
       - JUDGE SOLELY BASED ON Year/Make/Model. 
       - Do NOT consider miles here.
       - High demand/Modern = 5.0. Old/Obscure = Lower.
       
    2. **Body Condition**: 
       - Start at 5.0. Deduct ONLY for specific visible flaws (dents, rust, tears) seen in video/photos.
       
    3. **Reliability**:
       - Start at 5.0 (Assume Engine/Trans/Frame are perfect).
       - If video/notes do NOT mention a mechanical issue, **SCORE 5.0**.
       - Deduct **ONLY** if the host explicitly mentions a mechanical flaw.
       
    4. **Minor Mechanical**: 
       - Start at 5.0.
       - If silent on AC/Windows/Radio -> **SCORE 5.0**.
       - Deduct ONLY if explicitly stated as broken.
       
    5. **Miles**:
       - **THIS** is the only place to grade mileage.
       - Low miles for year = 5.0. High miles = Lower grade.
       
    6. **Title & History**:
       - Clean Title = 5.0.
       - Deduct for Salvage/Rebuilt/Lemon.
    
    7. **Value**:
       - Compare Price ($${vehicle.retail}) vs Approx Market Value.
       - Great Deal = 5.0.

    **TASKS**:
    1. **Analyze Video/Audio**: Extract honest positives and negatives.
    2. **Calculate Grades**: Fill the 7 categories above.
       - **EXPLAIN DEDUCTIONS**: If grade < 5.0, explicitly state WHY in the reasoning.
       - Start reasoning with phrases like: "Inspector H.L.A. notes...", "Deduction for...", "Perfect score retained because...".
       - Example: "Deducted 0.5 for visible door scratch", "Deducted 1.0 for 210k miles".
    3. **Write Copy**: Generate a 'Marketing Description' for the website.
       - **Reference the video directly**: "In the test drive, the presenter noted..." 
       - Tone: Objective, helpful, and honest. Avoid direct sales hype.
       - Formatting: HTML tags <p>, <ul>, <li>, <strong>.
    4. **Honest Blemishes**: List specific flaws (e.g. "Scratch on bumper", "Tear in seat").

    OUTPUT JSON SCHEMA:
    Return a JSON object containing the 'grade' object, a 'marketingDescription' string, and a 'blemishes' array.
  `;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            // Enable Google Search so it can watch the video
            tools: [{ googleSearch: {} }],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        marketingDescription: { type: "STRING" },
                        blemishes: {
                            type: "ARRAY",
                            items: { type: "STRING" },
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
                                        body_condition: { type: "OBJECT", properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } } },
                                        reliability: { type: "OBJECT", properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } } },
                                        age_demand: { type: "OBJECT", properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } } },
                                        minor_mechanical: { type: "OBJECT", properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } } },
                                        miles: { type: "OBJECT", properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } } },
                                        title_history: { type: "OBJECT", properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } } },
                                        value: { type: "OBJECT", properties: { name: { type: "STRING" }, score: { type: "NUMBER" }, grade: { type: "STRING" }, reasoning: { type: "STRING" } } },
                                    },
                                    required: ["body_condition", "reliability", "age_demand", "minor_mechanical", "miles", "title_history", "value"]
                                },
                            },
                            required: ["overallScore", "overallGrade", "summary", "categories"]
                        },
                    },
                    required: ["marketingDescription", "grade", "blemishes"]
                },
            },
        });

        const response = await result.response;
        const text = response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini AI API Error details:", error);
        throw new Error(`AI Service Failed: ${error.message || error}`);
    }
};
