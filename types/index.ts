// types/index.ts
// Type definitions for PanenKu application

export type PlantStatus = 'growing' | 'harvested';

export interface Plant {
  id: string;
  name: string;
  type: string;
  daysLeft: number;
  plantedDate: string;
  harvestDate: string;
  image: string;
  description?: string;
  location?: string;
  weather?: string;
  weatherLabel?: string;
  weatherNotes?: string;
  area?: number | null;
  fertilizer?: string;
  care?: {
    water: string;
    sun: string;
    soil: string;
    fertilizer: string;
  };
  progress: number;
  status: PlantStatus;
  harvestDuration?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HarvestRecord {
  id: string;
  plantId: string;
  plantName: string;
  harvestDate: string;
  quantity: number;
  unit: string;
  notes?: string;
  image?: string;
  location?: string;
  createdAt?: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  location: string;
  icon: string;
  forecast: DailyForecast[];
}

export interface DailyForecast {
  day: string;
  condition: string;
  icon: string;
  highTemp: number;
  lowTemp: number;
}

export interface PlantStats {
  totalPlants: number;
  growingPlants: number;
  harvestedPlants: number;
  totalHarvests: number;
  totalQuantity: number;
}

export interface PriceData {
  plantName: string;
  price: number;
  unit: string;
  change: number; // percentage change
  lastUpdated: string;
}