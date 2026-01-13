export interface RawInventoryItem {
  id: string;
  productName: string;
  condition: string;
  price: string;
  rawNotes: string; // The messy input from CSV
  imageUrls?: string[]; // URLs parsed from CSV
  category?: string;
}

export interface EnhancedListing {
  id: string;
  originalData: RawInventoryItem;
  
  // User uploaded images (Base64) or URLs
  images: string[];

  // AI Generated fields
  optimizedTitle: string;
  optimizedDescription: string;
  suggestedTags: string[];
  suggestedPriceRange: string;
  grade: string; // New Value-based Grade (A+, B, etc.)
  
  status: 'pending' | 'generating' | 'completed' | 'error';
  isPublished: boolean; // Local tracking state
}

export interface CsvParseResult {
  data: RawInventoryItem[];
  errors: string[];
}

export enum AppView {
  UPLOAD = 'UPLOAD',
  DASHBOARD = 'DASHBOARD'
}