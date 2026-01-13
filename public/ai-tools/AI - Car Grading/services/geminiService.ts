import { GoogleGenAI, Type } from "@google/genai";
import { GradingInput, GradingResult } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Use String.fromCharCode(44) for comma to avoid parser issues with regex strings
const COMMA = String.fromCharCode(44);
const DATA_URL_REGEX = new RegExp('^data:(.+);base64' + COMMA + '(.+)$');

export const gradeVehicle = async (input: GradingInput): Promise<GradingResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });

  const vehicleContext = `
    VEHICLE DETAILS:
    Year: ${input.vehicle.year}
    Make: ${input.vehicle.make}
    Model: ${input.vehicle.model}
    Trim: ${input.vehicle.trim}
    VIN: ${input.vehicle.vin}
    Mileage: ${input.vehicle.miles.toLocaleString()}
    Listing Price: $${input.vehicle.price.toLocaleString()}
    Stock #: ${input.vehicle.stockNumber}
    
    DATA SOURCES:
    CSV Images Available: ${input.vehicle.imageUrls?.length || 0}
    User Included Images for Analysis: ${input.images?.length || 0}
    CSV YouTube URL: ${input.vehicle.youtubeUrl || "N/A"}
    User YouTube Input: ${input.youtubeLink || "N/A"}
    
    CONDITION NOTES:
    Sales Comments (CSV): ${input.salesComments || "N/A"}
    Additional Grader Notes: ${input.additionalNotes || "N/A"}
    OBD2 Codes: ${input.obdCodes?.join(COMMA + ' ') || "None reported"}
    Visual Notes: ${input.visualConditionNotes || "N/A"}
  `;

  // Prepare parts
  const parts: any[] = [{ text: vehicleContext }];

  // Add images if available (User uploaded or Fetched from CSV)
  if (input.images && input.images.length > 0) {
    input.images.forEach(img => {
      // img is a data URL: "data:image/png;base64,....."
      const matches = img.match(DATA_URL_REGEX);
      if (matches) {
        const mimeType = matches[1];
        const data = matches[2];
        parts.push({
          inlineData: {
            mimeType: mimeType, 
            data: data
          }
        });
      }
    });
  }

  // Define Schema - Ensure NO trailing commas in object properties
  const schema = {
    type: Type.OBJECT,
    properties: {
      grade: { type: Type.STRING, enum: ["A", "B", "C", "D", "F"] },
      totalScore: { type: Type.INTEGER },
      estimatedRetailValue: { type: Type.NUMBER },
      estimatedRepairs: { type: Type.NUMBER },
      sweatEquity: { type: Type.NUMBER },
      repairNotes: { type: Type.STRING },
      
      mechanical: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          reason: { type: Type.STRING }
        }
      },
      cosmetics: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          reason: { type: Type.STRING }
        }
      },
      value: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          reason: { type: Type.STRING }
        }
      },
      safety: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          reason: { type: Type.STRING }
        }
      },
      
      recommendation: { type: Type.STRING, enum: ["STRONG BUY", "BUY", "HOLD", "AVOID"] },
      summary: { type: Type.STRING },
      pros: { type: Type.ARRAY, items: { type: Type.STRING } },
      cons: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["grade", "totalScore", "estimatedRetailValue", "estimatedRepairs", "sweatEquity", "mechanical", "cosmetics", "value", "safety", "recommendation"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        role: "user",
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as GradingResult;
  } catch (error: any) {
    console.error("Gemini Grading Error:", error);
    // Provide a more helpful error message if possible
    if (error.message && error.message.includes('500')) {
       throw new Error("AI Service temporary error. Please verify image format and try again.");
    }
    throw new Error("Failed to grade vehicle. " + (error.message || "Unknown error"));
  }
};