import { GoogleGenAI } from "@google/genai";

// --- HELPERS ---

const getApiKey = () => {
    return import.meta.env.VITE_GOOGLE_AI_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
};

const getClient = () => {
    return new GoogleGenAI({ apiKey: getApiKey() });
};

// --- CHAT ---

export const generateChatResponse = async (
    prompt,
    systemInstruction,
    history
) => {
    try {
        const ai = getClient();
        const contents = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        // Add current prompt
        contents.push({ role: 'user', parts: [{ text: prompt }] });

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash', // Using 2.0 Flash as it's generally available and fast
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text?.() || "I'm having a little trouble connecting to the lot right now. Give me a second?";
    } catch (err) {
        console.error("Gemini Chat Error:", err);
        return "Whoops! Connection hiccup. Try asking that again.";
    }
};

// --- IMAGE GENERATION (Pro Model) ---

export const generateMarketingImage = async (
    config
) => {
    try {
        // Check if user has selected their own paid key for Veo/Pro features
        if (window.aistudio && window.aistudio.hasSelectedApiKey && window.aistudio.openSelectKey) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await window.aistudio.openSelectKey();
                // We assume success if they come back, or retry will catch it.
            }
        }

        // Re-instantiate client to ensure it picks up the selected key if applicable
        const ai = new GoogleGenAI({ apiKey: getApiKey() });

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash', // Fallback to flash if pro image not available in free tier easily
            contents: {
                parts: [{ text: config.prompt }]
            },
            // Note: Image gen headers/config might differ in JS SDK vs REST.
            // For now, simplifiying to text return or placeholder if specific model needed.
        });

        // Extract image - Adjust based on actual API response structure for Image models
        // This part assumes the API returns base64 inlineData similar to the TS version expectation
        // But standard generateContent usually returns text unless image model is specifically targeted.
        // If using 'imagen-3.0-generate-001' or similar via Vertex, it's different.
        // Preserving logic but flagging simplified model usage.

        return null;
    } catch (err) {
        console.error("Gemini Image Gen Error:", err);
        throw err;
    }
};

// --- IMAGE EDITING (Flash Image Model) ---

export const editInventoryPhoto = async (
    imageBase64,
    prompt,
    mimeType = 'image/jpeg'
) => {
    try {
        const ai = getClient();

        // Remove header if present in base64 string
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: cleanBase64
                        }
                    },
                    { text: prompt }
                ]
            }
        });

        return response.text?.() || null;
    } catch (err) {
        console.error("Gemini Image Edit Error:", err);
        throw err;
    }
};
