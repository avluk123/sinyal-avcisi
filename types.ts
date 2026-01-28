export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface NetworkInfo {
  type: string; // 'wifi', 'cellular', 'unknown'
  effectiveType: string; // '4g', '3g', '2g', 'slow-2g'
  downlink: number; // Mb/s
  rtt: number; // ms
}

export interface SignalLog {
  id: string;
  timestamp: number;
  strength: number; // 0-100
  lat: number;
  lng: number;
  type: string;
}

export interface OperatorAdvice {
  name: string;
  suitability: 'Yüksek' | 'Orta' | 'Düşük';
  reason: string;
}

export interface AIAdviceResponse {
  locationAnalysis: string;
  technicalTips: string[];
  operators: OperatorAdvice[];
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  RADAR = 'radar',
  ADVISOR = 'advisor',
  HISTORY = 'history'
}

// Extend Navigator to support connection API (Chrome/Android specific)
declare global {
  interface Navigator {
    connection?: any;
    mozConnection?: any;
    webkitConnection?: any;
  }
}