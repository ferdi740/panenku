import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { harvestService } from '@/services/harvestService';
import { plantService } from '@/services/plantService';
import { HarvestRecord } from '@/types';

export default function PanenScreen() {
  const router = useRouter();
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [stats, setStats] = useState({ totalHarvests: 0, totalQuantity: 0, uniquePlants: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHarvestData = async () => {
    try {
      console.log('🔄 PANEN SCREEN - Loading harvest data...');
      const harvestData = await harvestService.getHarvestHistory();
      const harvestStats = await harvestService.getHarvestStats();
      
      console.log('✅ PANEN SCREEN - Loaded harvests:', harvestData.length);
      setHarvests(harvestData);
      setStats(harvestStats);
    } catch (error) {
      console.error('❌ PANEN SCREEN - Error loading harvest data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadHarvestData();
    }, [])
  );

  useEffect(() => {
    loadHarvestData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHarvestData();
  };

  const handleAddHarvest = async () => {
    // Get plants that are ready to harvest
    const allPlants = await plantService.getPlants();
    const readyPlants = allPlants.filter(plant => plant.status === 'growing' && plant.daysLeft <= 7);
    
    if (readyPlants.length === 0) {
      Alert.alert(
        'Tidak Ada Tanaman Siap Panen',
        'Semua tanaman masih dalam masa tumbuh. Periksa kembali dalam beberapa hari.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to first ready plant or show selection
    if (readyPlants.length === 1) {
      router.push(`/harvest-plant/${readyPlants[0].id}`);
    } else {
      Alert.alert(
        'Pilih Tanaman',
        `Ada ${readyPlants.length} tanaman yang siap dipanen. Pilih dari daftar tanaman.`,
        [{ text: 'OK', onPress: () => router.push('/(tabs)/ditanam') }]
      );
    }
  };

  const handleHarvestDetail = (harvest: HarvestRecord) => {
    Alert.alert(
      'Detail Panen',
      `${harvest.plantName}\n${harvest.quantity} ${harvest.unit}\n${harvest.harvestDate}`,
      [{ text: 'OK' }]
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat data panen...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hasil Panen</Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics */}
        <Text style={styles.sectionTitle}>Statistik Panen</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalHarvests}</Text>
            <Text style={styles.statLabel}>Total Panen</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalQuantity}</Text>
            <Text style={styles.statLabel}>Kg Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.uniquePlants}</Text>
            <Text style={styles.statLabel}>Jenis Tanaman</Text>
          </View>
        </View>

        {/* Recent Harvests */}
        <Text style={styles.sectionTitle}>Panen Terbaru</Text>
        
        {harvests.length > 0 ? (
          harvests.slice(0, 5).map((harvest) => (
            <TouchableOpacity 
              key={harvest.id} 
              style={styles.harvestCard}
              onPress={() => handleHarvestDetail(harvest)}
              activeOpacity={0.8}
            >
              {harvest.image ? (
                <Image 
                  source={{ uri: harvest.image }} 
                  style={styles.harvestImage}
                />
              ) : (
                <View style={styles.harvestImagePlaceholder}>
                  <Ionicons name="leaf" size={24} color={Colors.textLight} />
                </View>
              )}
              <View style={styles.harvestInfo}>
                <Text style={styles.plantName}>{harvest.plantName}</Text>
                <Text style={styles.harvestDate}>Dipanen: {formatDate(harvest.harvestDate)}</Text>
                <Text style={styles.harvestWeight}>
                  {harvest.quantity} {harvest.unit}
                </Text>
                {harvest.notes && (
                  <Text style={styles.harvestNotes}>{harvest.notes}</Text>
                )}
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Berhasil</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyStateText}>Belum Ada Hasil Panen</Text>
            <Text style={styles.emptyStateSubtext}>
              Tanaman Anda masih dalam masa pertumbuhan. Pantau perkembangan di halaman "Ditanam"
            </Text>
          </View>
        )}

        {/* Harvest History */}
        {harvests.length > 5 && (
          <>
            <Text style={styles.sectionTitle}>Riwayat Panen</Text>
            <View style={styles.historyContainer}>
              {harvests.slice(5).map((harvest) => (
                <View key={harvest.id} style={styles.historyItem}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyPlant}>{harvest.plantName}</Text>
                    <Text style={styles.historyDate}>{formatDate(harvest.harvestDate)}</Text>
                  </View>
                  <Text style={styles.historyQuantity}>
                    {harvest.quantity} {harvest.unit}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  harvestCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  harvestImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  harvestImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  harvestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  plantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  harvestDate: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  harvestWeight: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  harvestNotes: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusBadge: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  historyContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyInfo: {
    flex: 1,
  },
  historyPlant: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  historyQuantity: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});
