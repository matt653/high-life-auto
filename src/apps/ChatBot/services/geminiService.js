
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
};

// --- CHAT WITH SEARCH GROUNDING ---

export const generateChatResponse = async (
    prompt,
    systemInstruction,
    history
) => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const contents = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        contents.push({ role: 'user', parts: [{ text: prompt }] });

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp', // Updated model name for better compat
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }]
            }
        });

        return {
            text: response.text || "I'm checking the logs...",
            sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
        };
    } catch (err) {
        console.error("Gemini Chat Error:", err);
        return { text: "Connection hiccup. Try asking that again." };
    }
};

// --- VEO VIDEO GENERATION ---

export const generateVeoVideo = async (
    imagePrompt,
    imageBase64,
    aspectRatio = '16:9'
) => {
    try {
        // Check for user-selected key for Veo
        if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
            await window.aistudio.openSelectKey();
        }

        const ai = new GoogleGenAI({ apiKey: getApiKey() });

        const config = {
            model: 'veo-2.0-generate-preview', // Updated model name
            prompt: imagePrompt,
            config: {
                numberOfVideos: 1,
                resolution: '1080p',
                aspectRatio: aspectRatio
            }
        };

        if (imageBase64) {
            config.image = {
                imageBytes: imageBase64.split(',')[1] || imageBase64,
                mimeType: 'image/png'
            };
        }

        let operation = await ai.models.generateVideos(config);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        return `${downloadLink}&key=${getApiKey()}`;
    } catch (err) {
        console.error("Veo Error:", err);
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
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp', // Updated to flash 2.0
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: cleanBase64 } },
                    { text: prompt }
                ]
            }
        });

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (err) {
        console.error("Gemini Image Edit Error:", err);
        throw err;
    }
};
