import { GoogleGenAI, Type } from "@google/genai";
import { RawInventoryItem } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Helper to convert URL to base64 for Gemini
const urlToBase64 = async (url: string): Promise<string | null> => {
  const fetchImage = async (fetchUrl: string) => {
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    return await response.blob();
  };

  try {
    let blob: Blob;
    try {
      // Try direct fetch first
      blob = await fetchImage(url);
    } catch (e) {
      console.warn(`Direct fetch failed for ${url}, trying proxy...`);
      // Use a CORS proxy as fallback if direct access is blocked
      blob = await fetchImage(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Could not fetch image for analysis: ${url}`, error);
    return null;
  }
};

export const generateListingContent = async (item: RawInventoryItem, images: string[] = []) => {
  const ai = getClient();
  
  // Construct the text prompt
  const textPrompt = `
    You are a professional expert reseller on Facebook Marketplace. 
    Write a high-converting sales listing for the following item.
    
    Item Details:
    - Product: ${item.productName}
    - Condition: ${item.condition}
    - Base Price: ${item.price}
    - Notes: ${item.rawNotes}

    Rules:
    1. Create a CATCHY Title (max 60 chars) that includes key features (Year, Make, Model if vehicle).
    2. Write a DESCRIPTION that is persuasive, friendly, and formatted with emojis and bullet points. 
       If images are provided, analyze them to add visual details (color, condition, interior features, defects).
       Mention the condition clearly.
    3. Suggest 5-7 SEO tags (comma separated).
    4. Provide a price analysis: Is the base price fair? Give a quick range.
    5. Assign a "Value Grade" (A+ to F) for the customer.
       - IMPORTANT: This is PRICE-BASED grading. Judge a $50,000 car the same way as a $2,000 car based on VALUE potential.
       - A $10,000 car selling for $2,000 gets an "A+" (Massive Potential).
       - A $2,000 car that runs well is an "A" (Great Budget Buy).
       - A $50,000 car selling for $50,000 is a "B" (Fair Market).
       - Be generous if there is "sweat equity" potential.
  `;

  // Build the parts array.
  const parts: any[] = [];
  
  if (images && images.length > 0) {
    // We only process the first 3 images to save tokens/bandwidth and avoid timeouts
    const imagesToProcess = images.slice(0, 3);
    
    for (const imgStr of imagesToProcess) {
      let base64Data = imgStr;
      
      // If it's a URL, try to fetch it
      if (imgStr.startsWith('http')) {
        const converted = await urlToBase64(imgStr);
        if (converted) {
          base64Data = converted;
        } else {
          continue; // Skip if we can't download
        }
      }

      // Strip the data:image/xyz;base64, prefix
      const cleanBase64 = base64Data.split(',')[1];
      if (cleanBase64) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64
          }
        });
      }
    }
  }

  // Add the text prompt
  parts.push({ text: textPrompt });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            priceAnalysis: { type: Type.STRING },
            grade: { type: Type.STRING, description: "The Value Grade (e.g., A, B+, C)" }
          },
          required: ["title", "description", "tags", "priceAnalysis", "grade"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};