import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ImageSize, ImageGenConfig } from "../types";

// --- HELPERS ---

const getApiKey = (): string => {
  // In this environment, we expect process.env.API_KEY
  return process.env.API_KEY || '';
};

const getClient = () => {
  return new GoogleGenAI({ apiKey: getApiKey() });
};

// --- CHAT ---

export const generateChatResponse = async (
  prompt: string,
  systemInstruction: string,
  history: { role: string; text: string }[]
): Promise<string> => {
  try {
    const ai = getClient();
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    
    // Add current prompt
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Good balance of speed and smarts for chat
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I'm having a little trouble connecting to the lot right now. Give me a second?";
  } catch (err) {
    console.error("Gemini Chat Error:", err);
    return "Whoops! Connection hiccup. Try asking that again.";
  }
};

// --- IMAGE GENERATION (Pro Model) ---

export const generateMarketingImage = async (
  config: ImageGenConfig
): Promise<string | null> => {
  try {
    // Check if user has selected their own paid key for Veo/Pro features
    // @ts-ignore - window.aistudio is injected in this specific runtime environment
    if (window.aistudio && window.aistudio.hasSelectedApiKey && window.aistudio.openSelectKey) {
       // @ts-ignore
       const hasKey = await window.aistudio.hasSelectedApiKey();
       if (!hasKey) {
         // @ts-ignore
         await window.aistudio.openSelectKey();
         // We assume success if they come back, or retry will catch it.
       }
    }

    // Re-instantiate client to ensure it picks up the selected key if applicable
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: config.prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio,
          imageSize: config.size
        }
      }
    });

    // Extract image
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (err) {
    console.error("Gemini Image Gen Error:", err);
    throw err;
  }
};

// --- IMAGE EDITING (Flash Image Model) ---

export const editInventoryPhoto = async (
  imageBase64: string,
  prompt: string,
  mimeType: string = 'image/jpeg'
): Promise<string | null> => {
  try {
    const ai = getClient();
    
    // Remove header if present in base64 string
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
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

    // Extract image
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
