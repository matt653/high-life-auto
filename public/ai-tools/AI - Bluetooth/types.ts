
export interface OBDData {
  rpm: number;
  speed: number;
  coolantTemp: number;
  load: number;
  fuelPressure: number;
  timestamp: number;
}

export interface DiagnosticCode {
  code: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SensorAssessment {
  smell?: string;
  sound?: string;
  vibration?: string;
  visual?: string;
}

export enum DiagnosticMode {
  IDLE = 'IDLE',
  LIVE_MONITOR = 'LIVE_MONITOR',
  SENSORY_INPUT = 'SENSORY_INPUT',
  RESULTS = 'RESULTS'
}
