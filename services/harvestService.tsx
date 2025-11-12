import { asyncStorageService } from './asyncStorageService';
import { HarvestRecord, Plant } from '@/types';
import { plantService } from './plantService';

// CREATE - Harvest a plant
export const harvestPlant = async (
  plantId: string, 
  quantity: number, 
  unit: string = 'Kg', 
  notes?: string,
  location?: string
): Promise<HarvestRecord> => {
  try {
    // Get plant data
    const plant = await plantService.getPlantById(plantId);
    if (!plant) {
      throw new Error('Plant not found');
    }

    // Create harvest record
    const harvestRecord = await asyncStorageService.createHarvest({
      plantId,
      plantName: plant.name,
      harvestDate: new Date().toISOString().split('T')[0],
      quantity,
      unit,
      notes,
      image: plant.image,
      location: location || plant.location,
    });

    // Update plant status to harvested
    await plantService.updatePlant(plantId, {
      status: 'harvested',
      daysLeft: 0,
      progress: 100,
    });

    console.log('✅ HARVEST PLANT - Success:', harvestRecord.id);
    return harvestRecord;
  } catch (error) {
    console.error('❌ HARVEST PLANT - Error:', error);
    throw error;
  }
};

// READ - Get harvest statistics
export const getHarvestStats = async () => {
  try {
    const harvests = await asyncStorageService.getHarvests();
    const totalHarvests = harvests.length;
    const totalQuantity = harvests.reduce((sum, record) => sum + record.quantity, 0);
    const uniquePlants = new Set(harvests.map(record => record.plantId)).size;

    return {
      totalHarvests,
      totalQuantity: Math.round(totalQuantity * 100) / 100,
      uniquePlants,
    };
  } catch (error) {
    console.error('❌ GET HARVEST STATS - Error:', error);
    return {
      totalHarvests: 0,
      totalQuantity: 0,
      uniquePlants: 0,
    };
  }
};

// READ - Get harvest history (sorted by date, newest first)
export const getHarvestHistory = async (): Promise<HarvestRecord[]> => {
  try {
    const harvests = await asyncStorageService.getHarvests();
    return harvests.sort((a, b) => 
      new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime()
    );
  } catch (error) {
    console.error('❌ GET HARVEST HISTORY - Error:', error);
    return [];
  }
};

// READ - Get recent harvests (last N records)
export const getRecentHarvests = async (limit: number = 5): Promise<HarvestRecord[]> => {
  try {
    const harvests = await getHarvestHistory();
    return harvests.slice(0, limit);
  } catch (error) {
    console.error('❌ GET RECENT HARVESTS - Error:', error);
    return [];
  }
};

export const harvestService = {
  // CREATE
  harvestPlant,
  createHarvest: async (harvestData: Partial<HarvestRecord>): Promise<HarvestRecord> => {
    return asyncStorageService.createHarvest(harvestData);
  },

  // READ
  getHarvests: async (): Promise<HarvestRecord[]> => {
    return asyncStorageService.getHarvests();
  },
  getHarvestById: async (id: string): Promise<HarvestRecord | null> => {
    return asyncStorageService.getHarvestById(id);
  },
  getHarvestsByPlantId: async (plantId: string): Promise<HarvestRecord[]> => {
    return asyncStorageService.getHarvestsByPlantId(plantId);
  },
  getHarvestStats,
  getHarvestHistory,
  getRecentHarvests,

  // UPDATE
  updateHarvest: async (id: string, harvestData: Partial<HarvestRecord>): Promise<HarvestRecord | null> => {
    return asyncStorageService.updateHarvest(id, harvestData);
  },

  // DELETE
  deleteHarvest: async (id: string): Promise<boolean> => {
    return asyncStorageService.deleteHarvest(id);
  },
};

// Export types
export type { HarvestRecord };
