import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant, HarvestRecord } from '@/types';

const PLANTS_KEY = '@panenku_plants';
const HARVESTS_KEY = '@panenku_harvests';

// Helper function untuk validasi Plant
const validatePlant = (plant: any): plant is Plant => {
  return (
    plant &&
    typeof plant.id === 'string' &&
    typeof plant.name === 'string' &&
    typeof plant.type === 'string' &&
    typeof plant.daysLeft === 'number' &&
    typeof plant.plantedDate === 'string' &&
    typeof plant.harvestDate === 'string' &&
    typeof plant.image === 'string' &&
    typeof plant.progress === 'number' &&
    (plant.status === 'growing' || plant.status === 'harvested')
  );
};

// Helper function untuk repair corrupt data
const repairPlant = (plant: any, index: number): Plant => {
  const now = Date.now();
  const plantedDate = plant.plantedDate || new Date().toISOString().split('T')[0];
  const harvestDate = plant.harvestDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Calculate daysLeft
  const daysLeft = plant.daysLeft || Math.ceil((new Date(harvestDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    id: plant.id || `repaired-${now}-${index}`,
    name: plant.name || 'Tanaman Tanpa Nama',
    type: plant.type || 'Umum',
    daysLeft: Math.max(0, daysLeft),
    plantedDate,
    harvestDate,
    image: plant.image || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
    description: plant.description || '',
    location: plant.location || 'Cikole, Kota Sukabumi',
    weather: plant.weather || '',
    fertilizer: plant.fertilizer || '',
    care: plant.care || {
      water: '1 kali sehari',
      sun: '6-8 jam/hari',
      soil: 'Tanah gembur',
      fertilizer: 'Pupuk organik mingguan'
    },
    progress: Math.min(100, Math.max(0, plant.progress || 10)),
    status: plant.status === 'harvested' ? 'harvested' : 'growing',
    harvestDuration: plant.harvestDuration || '4 - 5 Bulan',
    createdAt: plant.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Helper untuk update daysLeft berdasarkan tanggal
const updateDaysLeft = (plant: Plant): Plant => {
  const now = new Date();
  const harvestDate = new Date(plant.harvestDate);
  const daysLeft = Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Update progress based on daysLeft
  const totalDays = Math.ceil((harvestDate.getTime() - new Date(plant.plantedDate).getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = totalDays - daysLeft;
  const progress = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100))) : plant.progress;
  
  return {
    ...plant,
    daysLeft: Math.max(0, daysLeft),
    progress,
    // Auto update status jika sudah waktunya panen
    status: daysLeft <= 0 && plant.status === 'growing' ? 'harvested' : plant.status,
  };
};

export const asyncStorageService = {
  // ========== PLANTS CRUD ==========
  
  // CREATE - Tambah tanaman baru
  createPlant: async (plantData: Partial<Plant>): Promise<Plant> => {
    try {
      const now = Date.now();
      const plantedDate = plantData.plantedDate || new Date().toISOString().split('T')[0];
      const harvestDate = plantData.harvestDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Calculate daysLeft
      const daysLeft = plantData.daysLeft || Math.ceil((new Date(harvestDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate progress
      const totalDays = Math.ceil((new Date(harvestDate).getTime() - new Date(plantedDate).getTime()) / (1000 * 60 * 60 * 24));
      const progress = totalDays > 0 ? Math.round(((totalDays - daysLeft) / totalDays) * 100) : 10;
      
      const newPlant: Plant = {
        id: String(now + Math.random()),
        name: plantData.name || 'Tanaman Baru',
        type: plantData.type || 'Umum',
        daysLeft: Math.max(0, daysLeft),
        plantedDate,
        harvestDate,
        image: plantData.image || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
        description: plantData.description || '',
        location: plantData.location || 'Cikole, Kota Sukabumi',
        weather: plantData.weather || '',
        fertilizer: plantData.fertilizer || '',
        care: plantData.care || {
          water: '1 kali sehari',
          sun: '6-8 jam/hari',
          soil: 'Tanah gembur',
          fertilizer: 'Pupuk organik mingguan'
        },
        progress: Math.min(100, Math.max(0, progress)),
        status: plantData.status || 'growing',
        harvestDuration: plantData.harvestDuration || '4 - 5 Bulan',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const plants = await asyncStorageService.getPlants();
      plants.push(newPlant);
      await AsyncStorage.setItem(PLANTS_KEY, JSON.stringify(plants));
      
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
      const plantsJSON = await AsyncStorage.getItem(PLANTS_KEY);
      
      if (!plantsJSON) {
        return [];
      }

      let plants = JSON.parse(plantsJSON);
      
      // Repair dan validasi semua plants
      let repaired = false;
      plants = plants.map((plant: any, index: number) => {
        if (!validatePlant(plant)) {
          repaired = true;
          return repairPlant(plant, index);
        }
        // Update daysLeft untuk semua plants
        return updateDaysLeft(plant);
      });

      // Save repaired data jika ada
      if (repaired) {
        await AsyncStorage.setItem(PLANTS_KEY, JSON.stringify(plants));
        console.log('🔧 PLANTS - Repaired corrupt data');
      }

      return plants;
    } catch (error) {
      console.error('❌ GET PLANTS - Error:', error);
      return [];
    }
  },

  // READ - Ambil tanaman by ID
  getPlantById: async (id: string): Promise<Plant | null> => {
    try {
      const plants = await asyncStorageService.getPlants();
      const plant = plants.find(p => String(p.id) === String(id));
      return plant ? updateDaysLeft(plant) : null;
    } catch (error) {
      console.error('❌ GET PLANT BY ID - Error:', error);
      return null;
    }
  },

  // READ - Ambil tanaman by status
  getPlantsByStatus: async (status: 'growing' | 'harvested'): Promise<Plant[]> => {
    try {
      const plants = await asyncStorageService.getPlants();
      return plants
        .filter(plant => plant.status === status)
        .map(plant => updateDaysLeft(plant));
    } catch (error) {
      console.error('❌ GET PLANTS BY STATUS - Error:', error);
      return [];
    }
  },

  // UPDATE - Update tanaman
  updatePlant: async (id: string, plantData: Partial<Plant>): Promise<Plant | null> => {
    try {
      const plants = await asyncStorageService.getPlants();
      const index = plants.findIndex(plant => String(plant.id) === String(id));
      
      if (index === -1) {
        console.log('⚠️ UPDATE PLANT - Plant not found:', id);
        return null;
      }

      // Recalculate daysLeft if dates changed
      let updatedPlant: Plant = {
        ...plants[index],
        ...plantData,
        id: plants[index].id, // Ensure ID tidak berubah
        updatedAt: new Date().toISOString(),
      };

      // If dates changed, recalculate daysLeft and progress
      if (plantData.plantedDate || plantData.harvestDate) {
        updatedPlant = updateDaysLeft(updatedPlant);
      }

      plants[index] = updatedPlant;
      await AsyncStorage.setItem(PLANTS_KEY, JSON.stringify(plants));
      
      console.log('✅ UPDATE PLANT - Success:', id);
      return updatedPlant;
    } catch (error) {
      console.error('❌ UPDATE PLANT - Error:', error);
      throw error;
    }
  },

  // DELETE - Hapus tanaman
  deletePlant: async (id: string): Promise<boolean> => {
    try {
      const targetId = String(id).trim();
      console.log('🔄 DELETE PLANT - Attempting to delete:', targetId);
      
      const plants = await asyncStorageService.getPlants();
      console.log('📊 DELETE PLANT - Total plants before:', plants.length);
      console.log('🔍 DELETE PLANT - Looking for ID:', targetId, 'Type:', typeof targetId);
      console.log('🔍 DELETE PLANT - Available IDs:', plants.map(p => ({ id: String(p.id).trim(), idType: typeof p.id, name: p.name })));
      
      // Filter out the plant with matching ID (case-insensitive and trimmed)
      const filteredPlants = plants.filter(plant => {
        const plantId = String(plant.id).trim();
        const matches = plantId !== targetId;
        if (!matches) {
          console.log('🎯 DELETE PLANT - Found matching plant:', plant.name, 'ID:', plantId);
        }
        return matches;
      });
      
      if (filteredPlants.length < plants.length) {
        await AsyncStorage.setItem(PLANTS_KEY, JSON.stringify(filteredPlants));
        console.log('✅ DELETE PLANT - Success! Removed:', plants.length - filteredPlants.length, 'plant(s)');
        console.log('📊 DELETE PLANT - Total plants after:', filteredPlants.length);
        
        // Verify deletion
        const verifyPlants = await asyncStorageService.getPlants();
        const stillExists = verifyPlants.some(p => String(p.id).trim() === targetId);
        if (stillExists) {
          console.error('❌ DELETE PLANT - Plant still exists after deletion!');
          return false;
        }
        
        return true;
      }
      
      console.log('⚠️ DELETE PLANT - Plant not found for deletion. No matching ID found.');
      return false;
    } catch (error) {
      console.error('❌ DELETE PLANT - Error:', error);
      throw error;
    }
  },

  // ========== HARVESTS CRUD ==========

  // CREATE - Tambah harvest record
  createHarvest: async (harvestData: Partial<HarvestRecord>): Promise<HarvestRecord> => {
    try {
      const now = Date.now();
      const newHarvest: HarvestRecord = {
        id: String(now + Math.random()),
        plantId: harvestData.plantId || '',
        plantName: harvestData.plantName || '',
        harvestDate: harvestData.harvestDate || new Date().toISOString().split('T')[0],
        quantity: harvestData.quantity || 0,
        unit: harvestData.unit || 'Kg',
        notes: harvestData.notes || '',
        image: harvestData.image || '',
        location: harvestData.location || '',
        createdAt: new Date().toISOString(),
      };

      const harvests = await asyncStorageService.getHarvests();
      harvests.push(newHarvest);
      await AsyncStorage.setItem(HARVESTS_KEY, JSON.stringify(harvests));
      
      console.log('✅ CREATE HARVEST - Success:', newHarvest.id);
      return newHarvest;
    } catch (error) {
      console.error('❌ CREATE HARVEST - Error:', error);
      throw error;
    }
  },

  // READ - Ambil semua harvests
  getHarvests: async (): Promise<HarvestRecord[]> => {
    try {
      const harvestsJSON = await AsyncStorage.getItem(HARVESTS_KEY);
      if (!harvestsJSON) {
        return [];
      }
      const harvests = JSON.parse(harvestsJSON);
      // Sort by date descending
      return harvests.sort((a: HarvestRecord, b: HarvestRecord) => 
        new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime()
      );
    } catch (error) {
      console.error('❌ GET HARVESTS - Error:', error);
      return [];
    }
  },

  // READ - Ambil harvest by ID
  getHarvestById: async (id: string): Promise<HarvestRecord | null> => {
    try {
      const harvests = await asyncStorageService.getHarvests();
      return harvests.find(h => String(h.id) === String(id)) || null;
    } catch (error) {
      console.error('❌ GET HARVEST BY ID - Error:', error);
      return null;
    }
  },

  // READ - Ambil harvests by plantId
  getHarvestsByPlantId: async (plantId: string): Promise<HarvestRecord[]> => {
    try {
      const harvests = await asyncStorageService.getHarvests();
      return harvests.filter(h => String(h.plantId) === String(plantId));
    } catch (error) {
      console.error('❌ GET HARVESTS BY PLANT ID - Error:', error);
      return [];
    }
  },

  // UPDATE - Update harvest
  updateHarvest: async (id: string, harvestData: Partial<HarvestRecord>): Promise<HarvestRecord | null> => {
    try {
      const harvests = await asyncStorageService.getHarvests();
      const index = harvests.findIndex(h => String(h.id) === String(id));
      
      if (index === -1) {
        return null;
      }

      harvests[index] = { ...harvests[index], ...harvestData };
      await AsyncStorage.setItem(HARVESTS_KEY, JSON.stringify(harvests));
      
      return harvests[index];
    } catch (error) {
      console.error('❌ UPDATE HARVEST - Error:', error);
      throw error;
    }
  },

  // DELETE - Hapus harvest
  deleteHarvest: async (id: string): Promise<boolean> => {
    try {
      const harvests = await asyncStorageService.getHarvests();
      const filteredHarvests = harvests.filter(h => String(h.id) !== String(id));
      
      if (filteredHarvests.length < harvests.length) {
        await AsyncStorage.setItem(HARVESTS_KEY, JSON.stringify(filteredHarvests));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ DELETE HARVEST - Error:', error);
      throw error;
    }
  },
};
