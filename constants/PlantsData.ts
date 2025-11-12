export interface Plant {
  id: string;
  name: string;
  type: string;
  daysLeft: number;
  plantedDate: string;
  harvestDate: string;
  image: string;
  description: string;
  care: {
    water: string;
    sun: string;
    soil: string;
    fertilizer: string;
  };
  progress: number;
  status: 'growing' | 'ready' | 'harvested';
}

export const plantsData: Plant[] = [
  {
    id: '1',
    name: 'Tomat Cherry',
    type: 'Buah',
    daysLeft: 15,
    plantedDate: '2024-10-01',
    harvestDate: '2024-11-15',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
    description: 'Tomat cherry yang manis dan segar, cocok untuk salad',
    care: {
      water: '2 kali sehari',
      sun: '6-8 jam/hari',
      soil: 'Tanah gembur',
      fertilizer: 'Pupuk organik mingguan'
    },
    progress: 70,
    status: 'growing'
  },
  {
    id: '2',
    name: 'Cabai Rawit',
    type: 'Sayuran',
    daysLeft: 8,
    plantedDate: '2024-10-08',
    harvestDate: '2024-11-08',
    image: 'https://images.unsplash.com/photo-1596646532649-68b13648a50e?w=400',
    description: 'Cabai rawit pedas, perfect untuk sambal',
    care: {
      water: '1 kali sehari',
      sun: '8 jam/hari',
      soil: 'Tanah berdrainase baik',
      fertilizer: 'Pupuk NPK 2 minggu sekali'
    },
    progress: 85,
    status: 'growing'
  },
  {
    id: '3',
    name: 'Selada',
    type: 'Daun',
    daysLeft: 22,
    plantedDate: '2024-09-20',
    harvestDate: '2024-11-20',
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400',
    description: 'Selada segar untuk salad dan burger',
    care: {
      water: '2 kali sehari',
      sun: '4-6 jam/hari',
      soil: 'Tanah lembab',
      fertilizer: 'Pupuk nitrogen mingguan'
    },
    progress: 45,
    status: 'growing'
  },
  {
    id: '4',
    name: 'Wortel',
    type: 'Umbi',
    daysLeft: 30,
    plantedDate: '2024-09-15',
    harvestDate: '2024-11-30',
    image: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400',
    description: 'Wortel organik kaya vitamin A',
    care: {
      water: '1 kali sehari',
      sun: '6 jam/hari',
      soil: 'Tanah berpasir',
      fertilizer: 'Pupuk fosfor 2 minggu sekali'
    },
    progress: 35,
    status: 'growing'
  }
];

export const harvestedPlants: Plant[] = [
  {
    id: '5',
    name: 'Bayam',
    type: 'Daun',
    daysLeft: 0,
    plantedDate: '2024-08-01',
    harvestDate: '2024-09-15',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
    description: 'Bayam organik segar',
    care: {
      water: '2 kali sehari',
      sun: '4-6 jam/hari',
      soil: 'Tanah lembab',
      fertilizer: 'Pupuk nitrogen'
    },
    progress: 100,
    status: 'harvested'
  }
];