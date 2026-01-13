export enum VehicleType {
  SUV = 'SUV',
  SEDAN = 'Sedan',
  TRUCK = 'Truck',
  SPORTS = 'Sports Car',
  EV = 'Electric',
  VAN = 'Minivan/Van',
  OTHER = 'Other'
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string; // ISO date string
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  price: number;
  vin: string;
}

export interface Sale {
  id: string;
  customer: Customer;
  vehicle: Vehicle;
  saleDate: string; // ISO date string
  profit: number;
  daysOnLot: number;
  notes?: string;
}

export interface SalesInsight {
  title: string;
  content: string;
  recommendation: string;
}

export interface SalesPersona {
  archetype: string;
  ageRange: string;
  incomeLevel: string;
  interests: string[];
  bio: string;
}

export type ViewState = 'dashboard' | 'import' | 'automation' | 'analytics' | 'trends';

export interface AutomationRule {
  id: string;
  name: string;
  triggerDelay: number; // days
  promptIdea: string;
  isActive: boolean;
}

export interface Task {
  id: string;
  ruleId: string;
  ruleName: string; // e.g. "Birthday" or "Post Sale 3-Day"
  customerName: string;
  vehicleName: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED';
  contextData: any;
  customPrompt?: string;
}