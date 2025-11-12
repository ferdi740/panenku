import { asyncStorageService } from './asyncStorageService';
import { Plant } from '@/types';

// Initialize app
export const initializeApp = async (): Promise<void> => {
  try {
    // Ensure storage is ready
    await asyncStorageService.getPlants();
    console.log('🚀 App initialized with AsyncStorage');
  } catch (error) {
    console.error('❌ App initialization error:', error);
  }
};

// Reset plants data
export const resetPlantsData = async (): Promise<void> => {
  try {
    const { AsyncStorage } = require('@react-native-async-storage/async-storage');
    await AsyncStorage.removeItem('@panenku_plants');
    await AsyncStorage.removeItem('@panenku_harvests');
    console.log('✅ Data plants dan harvests berhasil direset');
  } catch (error) {
    console.error('❌ Error resetting plants data:', error);
  }
};

// Get plant statistics
export const getPlantStats = async () => {
  try {
    const plants = await asyncStorageService.getPlants();
    const growingPlants = plants.filter(p => p.status === 'growing');
    const harvestedPlants = plants.filter(p => p.status === 'harvested');
    
    return {
      totalPlants: plants.length,
      growingPlants: growingPlants.length,
      harvestedPlants: harvestedPlants.length,
    };
  } catch (error) {
    console.error('❌ GET PLANT STATS - Error:', error);
    return {
      totalPlants: 0,
      growingPlants: 0,
      harvestedPlants: 0,
    };
  }
};

export const plantService = {
  // CREATE - Tambah tanaman baru
  createPlant: async (plantData: Partial<Plant>): Promise<Plant> => {
    try {
      const newPlant = await asyncStorageService.createPlant(plantData);
      console.log('✅ CREATE PLANT - Success:', newPlant.id, newPlant.name);
      return newPlant;
    } catch (error) {
      console.error('❌ CREATE PLANT - Error:', error);
      throw error;
    }
  },

  // READ - Ambil semua tanaman
  getPlants: async (): Promise<Plant[]> => {
    try {
      const plants = await asyncStorageService.getPlants();
      console.log('✅ GET PLANTS - Success, count:', plants.length);
      return plants;
    } catch (error) {
      console.error('❌ GET PLANTS - Error:', error);
      return [];
    }
  },

  // READ - Ambil tanaman by ID
  getPlantById: async (id: string): Promise<Plant | null> => {
    try {
      const plant = await asyncStorageService.getPlantById(id);
      console.log('✅ GET PLANT BY ID - Success:', plant ? plant.name : 'Not found');
      return plant;
    } catch (error) {
      console.error('❌ GET PLANT BY ID - Error:', error);
      return null;
    }
  },

  // READ - Ambil tanaman by status
  getPlantsByStatus: async (status: 'growing' | 'harvested'): Promise<Plant[]> => {
    try {
      const plants = await asyncStorageService.getPlantsByStatus(status);
      console.log('✅ GET PLANTS BY STATUS - Success, count:', plants.length);
      return plants;
    } catch (error) {
      console.error('❌ GET PLANTS BY STATUS - Error:', error);
      return [];
    }
  },

  // UPDATE - Update tanaman
  updatePlant: async (id: string, plantData: Partial<Plant>): Promise<Plant | null> => {
    try {
      const updatedPlant = await asyncStorageService.updatePlant(id, plantData);
      console.log('✅ UPDATE PLANT - Success:', updatedPlant ? updatedPlant.name : 'Not found');
      return updatedPlant;
    } catch (error) {
      console.error('❌ UPDATE PLANT - Error:', error);
      throw error;
    }
  },

  // DELETE - Hapus tanaman
  deletePlant: async (id: string): Promise<boolean> => {
    try {
      const result = await asyncStorageService.deletePlant(id);
      console.log('✅ DELETE PLANT - Success:', result ? 'Deleted' : 'Not found');
      return result;
    } catch (error) {
      console.error('❌ DELETE PLANT - Error:', error);
      throw error;
    }
  },

  // Get harvests (delegated to harvestService)
  getHarvests: async () => {
    const { harvestService } = require('./harvestService');
    return harvestService.getHarvests();
  },

  // Get plant statistics
  getPlantStats,

  // Initialize app
  initializeApp,
  
  // Reset function
  resetPlantsData,
};
