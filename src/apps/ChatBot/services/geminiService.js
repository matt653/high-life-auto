import { GoogleGenAI } from "@google/generative-ai";

// --- HELPERS ---

const getApiKey = () => {
    // Check multiple env vars for robustness
    const key = import.meta.env.VITE_GOOGLE_AI_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!key) console.warn("Gemini API Key is missing");
    return key;
};

const getClient = () => {
    return new GoogleGenAI(getApiKey());
};

// --- CHAT ---

export const generateChatResponse = async (
    prompt,
    systemInstruction,
    history
) => {
    try {
        const genAI = getClient();
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: systemInstruction
        });

        // Convert history to Gemini format (role: 'user' | 'model')
        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }))
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        return response.text();

    } catch (err) {
        console.error("Gemini Chat Error Details:", {
            message: err.message,
            stack: err.stack,
            name: err.name
        });

        // Friendly error messages based on common codes
        if (err.message && err.message.includes("API key")) {
            return "My connection key seems to be missing. Please tell the manager to check the settings.";
        }
        return `Whoops! Connection hiccup. (Error: ${err.message || "Unknown"}). Try asking that again.`;
    }
};

// --- IMAGE GENERATION (Placeholder / Not fully implemented in this simplified service) ---
export const generateMarketingImage = async (config) => {
    return null;
};

// --- IMAGE EDITING (Placeholder) ---
export const editInventoryPhoto = async (imageBase64, prompt) => {
    return null;
};
