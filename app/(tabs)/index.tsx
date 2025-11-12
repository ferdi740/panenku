import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { plantService } from '@/services/plantService';
import { harvestService } from '@/services/harvestService';

export default function HomeScreen() {
  const router = useRouter();
  const [myPlants, setMyPlants] = useState<any[]>([]);
  const [harvests, setHarvests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current date
  const getCurrentDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const day = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    return `${dayName}, ${day}-${month}-${year}`;
  };

  // Format harvest date for display
  const formatHarvestDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[date.getMonth()];
      return `${day} ${month}`;
    } catch {
      return dateString;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load plants (max 4 for home)
      const allPlants = await plantService.getPlants();
      const homePlants = allPlants
        .filter(p => p.status === 'growing')
        .slice(0, 4);
      setMyPlants(homePlants);
      
      // Load recent harvests (max 2 for home)
      const recentHarvests = await harvestService.getRecentHarvests(2);
      setHarvests(recentHarvests);
    } catch (error) {
      console.error('❌ HOME SCREEN - Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNote = () => {
    router.push('/add-plant');
  };

  const handleViewForecast = () => {
    router.push('/(tabs)/cuaca');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.screenLabel}>Home</Text>
          <Text style={styles.welcomeText}>Selamat Datang, Petani!</Text>
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
        </View>

        {/* Weather Section */}
        <View style={styles.weatherSection}>
          <Text style={styles.sectionTitle}>Bagaimana cuaca hari ini?</Text>
          
          <View style={styles.weatherCards}>
            <View style={styles.weatherCard}>
              <Ionicons name="rainy-outline" size={24} color={Colors.primary} />
              <Text style={styles.weatherValue}>212</Text>
              <Text style={styles.weatherLabel}>Curah Hujan</Text>
            </View>
            
            <View style={styles.weatherCard}>
              <Ionicons name="thermometer-outline" size={24} color={Colors.primary} />
              <Text style={styles.weatherValue}>0° 212</Text>
              <Text style={styles.weatherLabel}>Suhu Udara</Text>
            </View>
            
            <View style={styles.weatherCard}>
              <Ionicons name="water-outline" size={24} color={Colors.primary} />
              <Text style={styles.weatherValue}>212</Text>
              <Text style={styles.weatherLabel}>Humiditas</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.forecastButton}
            onPress={handleViewForecast}
            activeOpacity={0.8}
          >
            <Text style={styles.forecastButtonText}>Lihat Ramalan 7 Hari</Text>
          </TouchableOpacity>
        </View>

        {/* Average Price Section */}
        <View style={styles.priceSection}>
          <Text style={styles.sectionTitle}>Harga Rata-rata</Text>
          <View style={styles.priceCard}>
            <Ionicons name="leaf" size={20} color={Colors.primary} />
            <Text style={styles.priceText}>Rp 4.500/Kg</Text>
            <View style={styles.priceChange}>
              <Ionicons name="arrow-up" size={16} color={Colors.success} />
              <Text style={styles.priceChangeText}>5%</Text>
            </View>
          </View>
        </View>

        {/* Latest Harvest Notes Section */}
        <View style={styles.harvestSection}>
          <Text style={styles.sectionTitle}>Catatan Panen Terbaru</Text>
          
          {harvests.length > 0 ? (
            harvests.map((harvest, index) => (
              <View key={harvest.id || index} style={styles.harvestCard}>
                <Ionicons name="leaf" size={20} color={Colors.primary} />
                <Text style={styles.harvestText}>
                  {harvest.plantName}, {formatHarvestDate(harvest.harvestDate)} : {harvest.quantity} {harvest.unit}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.harvestCard}>
              <Ionicons name="leaf" size={20} color={Colors.primary} />
              <Text style={styles.harvestText}>Belum ada catatan panen</Text>
            </View>
          )}
        </View>

        {/* Spacing for FAB */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddNote}
        activeOpacity={0.8}
      >
        <Ionicons name="leaf" size={20} color={Colors.white} />
        <Text style={styles.fabText}>Tambah catatan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
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
  headerSection: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.white,
  },
  screenLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  weatherSection: {
    padding: 20,
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  weatherCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weatherCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  weatherValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  weatherLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  forecastButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  forecastButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  priceSection: {
    padding: 20,
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceChangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 4,
  },
  harvestSection: {
    padding: 20,
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  harvestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  harvestText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
