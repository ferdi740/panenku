import * as SQLite from 'expo-sqlite';

// Open database connection
const db = SQLite.openDatabaseSync('panenku.db');

// Initialize database
export const initDatabase = async (): Promise<void> => {
  try {
    // Create plants table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS plants (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        daysLeft INTEGER NOT NULL,
        plantedDate TEXT NOT NULL,
        harvestDate TEXT NOT NULL,
        image TEXT NOT NULL,
        description TEXT,
        water TEXT NOT NULL,
        sun TEXT NOT NULL,
        soil TEXT NOT NULL,
        fertilizer TEXT NOT NULL,
        progress INTEGER NOT NULL,
        status TEXT NOT NULL
      );
    `);
    console.log('Plants table created successfully');
  } catch (error) {
    console.error('Error creating plants table:', error);
    throw error;
  }
};

// Plant service dengan SQLite
export const plantDatabaseService = {
  // CREATE - Tambah tanaman baru
  createPlant: async (plantData: any): Promise<any> => {
    try {
      await db.runAsync(
        `INSERT INTO plants (
          id, name, type, daysLeft, plantedDate, harvestDate, 
          image, description, water, sun, soil, fertilizer, progress, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plantData.id,
          plantData.name,
          plantData.type,
          plantData.daysLeft,
          plantData.plantedDate,
          plantData.harvestDate,
          plantData.image,
          plantData.description || '',
          plantData.care.water,
          plantData.care.sun,
          plantData.care.soil,
          plantData.care.fertilizer,
          plantData.progress,
          plantData.status,
        ]
      );
      console.log('Plant created in database:', plantData.id);
      return plantData;
    } catch (error) {
      console.error('Error creating plant:', error);
      throw error;
    }
  },

  // READ - Ambil semua tanaman
  getPlants: async (): Promise<any[]> => {
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM plants ORDER BY plantedDate DESC'
      ) as any[];
      
      const plants = result.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        daysLeft: row.daysLeft,
        plantedDate: row.plantedDate,
        harvestDate: row.harvestDate,
        image: row.image,
        description: row.description,
        care: {
          water: row.water,
          sun: row.sun,
          soil: row.soil,
          fertilizer: row.fertilizer,
        },
        progress: row.progress,
        status: row.status,
      }));
      
      console.log('Plants loaded from database:', plants.length);
      return plants;
    } catch (error) {
      console.error('Error loading plants:', error);
      throw error;
    }
  },

  // READ - Ambil tanaman by ID
  getPlantById: async (id: string): Promise<any | null> => {
    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM plants WHERE id = ?',
        [id]
      ) as any;
      
      if (result) {
        const plant = {
          id: result.id,
          name: result.name,
          type: result.type,
          daysLeft: result.daysLeft,
          plantedDate: result.plantedDate,
          harvestDate: result.harvestDate,
          image: result.image,
          description: result.description,
          care: {
            water: result.water,
            sun: result.sun,
            soil: result.soil,
            fertilizer: result.fertilizer,
          },
          progress: result.progress,
          status: result.status,
        };
        return plant;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error loading plant:', error);
      throw error;
    }
  },

  // READ - Ambil tanaman by status
  getPlantsByStatus: async (status: string): Promise<any[]> => {
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM plants WHERE status = ? ORDER BY plantedDate DESC',
        [status]
      ) as any[];
      
      const plants = result.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        daysLeft: row.daysLeft,
        plantedDate: row.plantedDate,
        harvestDate: row.harvestDate,
        image: row.image,
        description: row.description,
        care: {
          water: row.water,
          sun: row.sun,
          soil: row.soil,
          fertilizer: row.fertilizer,
        },
        progress: row.progress,
        status: row.status,
      }));
      
      return plants;
    } catch (error) {
      console.error('Error loading plants by status:', error);
      throw error;
    }
  },

  // UPDATE - Update tanaman
  updatePlant: async (id: string, plantData: any): Promise<any | null> => {
    try {
      const result = await db.runAsync(
        `UPDATE plants SET 
          name = ?, type = ?, daysLeft = ?, plantedDate = ?, harvestDate = ?,
          image = ?, description = ?, water = ?, sun = ?, soil = ?, 
          fertilizer = ?, progress = ?, status = ?
         WHERE id = ?`,
        [
          plantData.name,
          plantData.type,
          plantData.daysLeft,
          plantData.plantedDate,
          plantData.harvestDate,
          plantData.image,
          plantData.description || '',
          plantData.care.water,
          plantData.care.sun,
          plantData.care.soil,
          plantData.care.fertilizer,
          plantData.progress,
          plantData.status,
          id,
        ]
      );
      
      if (result.changes && result.changes > 0) {
        return plantData;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error updating plant:', error);
      throw error;
    }
  },

  // DELETE - Hapus tanaman
  deletePlant: async (id: string): Promise<boolean> => {
    try {
      const result = await db.runAsync('DELETE FROM plants WHERE id = ?', [id]);
      return result.changes ? result.changes > 0 : false;
    } catch (error) {
      console.error('Error deleting plant:', error);
      throw error;
    }
  },

  // Seed sample data jika database kosong
  seedSampleData: async (): Promise<void> => {
    try {
      const existingPlants = await plantDatabaseService.getPlants();
      
      if (existingPlants.length === 0) {
        const samplePlants = [
          {
            id: '1',
            name: 'Tomat Cherry',
            type: 'Buah',
            daysLeft: 15,
            plantedDate: '2024-10-01',
            harvestDate: '2024-11-15',
            image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop',
            description: 'Tomat cherry yang manis dan segar, cocok untuk salad',
            care: {
              water: '2 kali sehari',
              sun: '6-8 jam/hari',
              soil: 'Tanah gembur',
              fertilizer: 'Pupuk organik mingguan',
            },
            progress: 70,
            status: 'growing',
          },
          {
            id: '2',
            name: 'Cabai Rawit',
            type: 'Sayuran',
            daysLeft: 8,
            plantedDate: '2024-10-08',
            harvestDate: '2024-11-08',
            image: 'https://images.unsplash.com/photo-1596646532649-68b13648a50e?w=400&h=300&fit=crop',
            description: 'Cabai rawit pedas, perfect untuk sambal',
            care: {
              water: '1 kali sehari',
              sun: '8 jam/hari',
              soil: 'Tanah berdrainase baik',
              fertilizer: 'Pupuk NPK 2 minggu sekali',
            },
            progress: 85,
            status: 'growing',
          },
        ];

        for (const plant of samplePlants) {
          await plantDatabaseService.createPlant(plant);
        }
        
        console.log('Sample data seeded successfully');
      }
    } catch (error) {
      console.error('Error seeding sample data:', error);
    }
  },
};