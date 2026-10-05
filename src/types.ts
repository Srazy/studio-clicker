export interface FloatingTextItem {
  id: number;
  text: string;
  x: number;
  y: number;
  scale: number;
  color: string;
  type: 'point' | 'combo' | 'mega-combo' | 'money';
  angle?: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export interface ComboTier {
  multiplier: number;
  title: string;
  color: string;
  particleSpeed: number;
  badge: string;
}

export type EmployeeType = 'developer' | 'analyst' | 'backend' | 'manager';

export interface EmployeeInfo {
  type: EmployeeType;
  label: string;
  baseCost: number;
  description: string;
  icon: string;
}

export interface PerkInfo {
  id: string;
  label: string;
  baseCost: number;
  description: string;
  icon: string;
  free?: boolean;
}
