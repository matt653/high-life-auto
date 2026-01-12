
export interface ReportCategory {
  name: string;
  score: number;
  grade: string; // A, B, C, D, F
  reasoning: string;
}

export interface GradeResult {
  overallScore: number;
  overallGrade: string;
  summary: string;
  categories: {
    body: ReportCategory;
    engine: ReportCategory;
    history: ReportCategory;
    mechanical: ReportCategory;
    demand: ReportCategory;
  };
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Vehicle {
  vin: string;
  stockNumber: string; // New field
  make: string;
  model: string;
  trim: string;
  year: string;
  mileage: string;
  retail: string;
  cost: string;
  youtubeUrl: string;
  imageUrls: string[];
  comments: string;
  options: string;
  type: string;
  
  // New fields for the backend tool
  websiteNotes?: string; // New field for manual website specific additions
  marketingDescription?: string;
  aiGrade?: GradeResult;
  groundingSources?: GroundingSource[];
  lastUpdated?: number;
}
