import { GoogleGenAI, Type } from "@google/genai";
import { Sale } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to sanitize JSON strings if the model returns markdown code blocks
const cleanJsonString = (str: string) => {
  return str.replace(/```json\n?|\n?```/g, '').trim();
};

export const generateTaskMessage = async (
  taskType: string,
  customerName: string,
  vehicleName: string,
  notes: string,
  customIdea?: string,
  channel: 'email' | 'sms' = 'email'
): Promise<string> => {
  try {
    const prompt = `
      Write a professional yet warm, personalized customer relationship message for an automotive dealership.
      
      Channel: ${channel.toUpperCase()}
      Task Context: ${taskType}
      ${customIdea ? `Specific Goal/Idea: ${customIdea}` : ''}
      
      Customer: ${customerName}
      Vehicle Purchased: ${vehicleName}
      Sales Notes: ${notes}

      Constraints:
      ${channel === 'sms' 
        ? '- STRICTLY under 160 characters.\n- No subject lines.\n- Casual, direct tone.' 
        : '- Keep it under 100 words.\n- Include a call to action.\n- Tone: Friendly, appreciative.'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate message.";
  } catch (error) {
    console.error("Error generating message:", error);
    return "Error generating message. Please check your API key.";
  }
};

export const generateInventoryReport = async (sales: Sale[]): Promise<string> => {
  try {
    // Summarize data to avoid sending too much text
    const summary = sales.map(s => 
      `${s.vehicle.type} (${s.vehicle.year} ${s.vehicle.make}): Sold for $${s.vehicle.price}, Profit $${s.profit}, Days on Lot: ${s.daysOnLot}`
    ).slice(0, 100).join('\n'); 

    const prompt = `
      You are an expert Automotive Sales Manager. Analyze this recent sales data:
      ${summary}

      Write a concise, strategic 2-paragraph report for the Dealer Principal.
      
      Paragraph 1: Trends. Which vehicle types are generating the most profit? Which are selling the fastest (lowest days on lot)?
      Paragraph 2: Recommendations. What should we buy more of at auction? What should we avoid or price lower?
      
      Keep it professional, data-driven, and direct.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "Analysis currently unavailable.";

  } catch (error) {
    console.error("Error generating report:", error);
    return "Could not generate report at this time.";
  }
};

export const generateStrategicAnalysis = async (sales: Sale[]) => {
  try {
    const salesDataString = JSON.stringify(sales.map(s => ({
      vehicle: `${s.vehicle.year} ${s.vehicle.make} ${s.vehicle.model}`,
      type: s.vehicle.type,
      price: s.vehicle.price,
      customerAgeGroup: calculateAgeGroup(s.customer.birthDate),
      notes: s.notes
    })).slice(0, 50)); 

    const prompt = `
      Act as a senior automotive sales analyst. Analyze the following raw sales data:
      ${salesDataString}

      Provide a JSON response with 3 strategic insights. 
      Each insight must have a 'title', 'content' (analysis), and 'recommendation' (actionable advice).
      
      Focus on:
      1. Who is buying what (Demographics vs Vehicle Type).
      2. Inventory gaps or opportunities.
      3. Marketing angles based on customer notes.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            },
            required: ['title', 'content', 'recommendation']
          }
        }
      }
    });

    const jsonStr = cleanJsonString(response.text || '[]');
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Error generating analysis:", error);
    return [];
  }
};

export const generateBuyerPersona = async (sales: Sale[]) => {
  try {
    const salesDataString = JSON.stringify(sales.map(s => ({
      vehicle: `${s.vehicle.year} ${s.vehicle.make}`,
      price: s.vehicle.price,
      age: calculateAgeGroup(s.customer.birthDate),
      notes: s.notes
    })).slice(0, 40));

    const prompt = `
      Based on this sales data, create a "Target Buyer Persona" that represents our most common/valuable customer.
      Data: ${salesDataString}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            archetype: { type: Type.STRING, description: "A catchy name e.g. 'The Family Adventurer'" },
            ageRange: { type: Type.STRING },
            incomeLevel: { type: Type.STRING },
            interests: { type: Type.ARRAY, items: { type: Type.STRING } },
            bio: { type: Type.STRING, description: "A short paragraph describing their lifestyle." }
          },
          required: ['archetype', 'ageRange', 'incomeLevel', 'interests', 'bio']
        }
      }
    });

    const jsonStr = cleanJsonString(response.text || '{}');
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating persona:", error);
    return null;
  }
};

function calculateAgeGroup(birthDate: string): string {
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
  if (age < 30) return 'Under 30';
  if (age < 45) return '30-45';
  if (age < 60) return '45-60';
  return '60+';
}