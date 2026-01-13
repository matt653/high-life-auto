export interface Vehicle {
  id: string;
  year: string;
  make: string;
  model: string;
  trim?: string;
  vin: string;
  miles: number;
  price: number;
  color?: string;
  stockNumber?: string;
  description?: string; // Sales comments from CSV
  imageUrls: string[];  // List of all image URLs from CSV
  imageUrl?: string;    // Primary image (first one) for backward compatibility
  youtubeUrl?: string;  // YouTube URL from CSV
  location?: string;
}

export interface GradingInput {
  vehicle: Vehicle;
  youtubeLink?: string;
  salesComments?: string; // Original CSV comments
  additionalNotes?: string; // New user notes
  obdCodes?: string[];
  visualConditionNotes?: string;
  images: string[]; // Base64 strings from uploads OR fetched CSV images
}

export interface CategoryScore {
  score: number; // 0-100 based on the specific category logic
  reason: string;
}

export interface GradingResult {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  totalScore: number; // 0-100
  
  // Financials / "Sweat Equity"
  estimatedRetailValue: number;
  estimatedRepairs: number;
  sweatEquity: number; // Retail - Price - Repairs
  repairNotes: string; // Detail on the Estimated Repairs (e.g. "$500 for Tires")
  
  // Categorized Scores (Weights: Mech 40%, Cosm 20%, Value 30%, Safety 10%)
  mechanical: CategoryScore;
  cosmetics: CategoryScore;
  value: CategoryScore;
  safety: CategoryScore;
  
  // Metadata
  recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'AVOID';
  summary: string;
  pros: string[];
  cons: string[];
}

export enum AppState {
  INVENTORY = 'INVENTORY',
  GRADING = 'GRADING',
  RESULTS = 'RESULTS'
}