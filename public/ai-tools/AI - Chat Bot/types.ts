export interface Lead {
  id: string;
  name: string;
  contactInfo?: string; // Phone or Email
  notes?: string; // Internal notes
  // Updated statuses to match the 7 Phases
  status: 'phase_1_contact' | 'phase_2_interest' | 'phase_3_needs' | 'phase_4_budget' | 'phase_5_timeline' | 'phase_6_video' | 'phase_7_ready' | 'sold' | 'lost';
  lastMessage: string;
  source: string;
  hwVideo?: boolean;
  hwDescription?: boolean;
  hwIssues?: boolean;
  createdAt?: any;
  updatedAt?: any;
  
  // New CRM Fields
  vehicleInterest?: string;
  budget?: string;
  timeline?: string;
}

export interface InventoryItem {
  id: string;
  vin: string;
  name: string;
  price: string;
  miles: string;
  comments: string;
  youtube?: string;
  lastSynced: string;
}

export interface KnowledgeItem {
  id: string;
  content: string;
  createdAt: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  createdAt: any;
  image?: string; // Base64 or URL
}

export enum ImageSize {
  OneK = "1K",
  TwoK = "2K",
  FourK = "4K"
}

export interface ImageGenConfig {
  prompt: string;
  aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" | "9:16";
  size: ImageSize;
}

export interface ChatSession {
  id: string;
  messages: Message[];
}