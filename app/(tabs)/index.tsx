import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { plantService } from '@/services/plantService';
import { getCurrentWeather, WeatherData } from '@/services/weatherService';

export default function HomeScreen() {
  const router = useRouter();
  const [plants, setPlants] = useState<any[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
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
    return `${dayName}, ${day} ${month} ${year}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
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

  // Helper untuk mendapatkan status tanaman
// Helper untuk mendapatkan status tanaman
const getPlantStatusInfo = (plant: any) => {
  if (plant.status === 'harvested') {
    // Jika tanaman sudah dipanen, gunakan tanggal hari ini
    const today = new Date();
    const day = today.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = months[today.getMonth()];
    const todayFormatted = `${day} ${month}`;
    
    return {
      label: 'Sudah Panen',
      color: '#2E7D32',
      bgColor: 'rgba(76, 175, 80, 0.1)',
      icon: 'basket' as const,
      detailText: `Panen: ${todayFormatted}`
    };
  } else {
    return {
      label: 'Proses Panen',
      color: '#FF9800',
      bgColor: 'rgba(255, 152, 0, 0.1)',
      icon: 'time' as const,
      detailText: `${Math.max(0, plant.daysLeft)} Hari Menuju Panen`
    };
  }
};

  // Load Data (Weather & Plants)
  const loadData = async () => {
    try {
      setLoading(true);
      
      const weatherData = await getCurrentWeather();
      setWeather(weatherData);

      const allPlants = await plantService.getPlants();
      const sortedPlants = allPlants.sort((a, b) => {
         const dateA = new Date(a.plantedDate).getTime();
         const dateB = new Date(b.plantedDate).getTime();
         return dateB - dateA;
      });
      
      setPlants(sortedPlants.slice(0, 5));
      
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

  const handleAddNote = () => {
    router.push('/add-plant');
  };

  const handleViewForecast = () => {
    router.push('/(tabs)/cuaca');
  };
  
  const handlePlantPress = (plantId: string) => {
    router.push(`/plant-detail-modal?id=${plantId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingContent}>
            <Ionicons name="leaf-outline" size={64} color="#2E7D32" />
            <ActivityIndicator size="large" color="#2E7D32" style={{marginVertical: 20}} />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Fallback weather jika null
  const currentWeather = weather || {
    temperature: 28,
    condition: 'berawan',
    label: 'Berawan',
    humidity: 60,
    windSpeed: 10,
    precipitation: 0,
    location: 'Memuat...',
    icon: 'partly-sunny',
    forecast: []
  };

  const precipitationPercent = Math.min(100, Math.round(currentWeather.precipitation * 10)); 
  const displayPrecipitation = currentWeather.precipitation > 0 ? `${precipitationPercent}%` : '0%';

  return (
    <View style={styles.container}>
      {/* Background dengan tema alam */}
      <LinearGradient
        colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
        style={styles.backgroundGradient}
      >
        
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Ionicons name="home" size={28} color="#2E7D32" />
                <View>
                  <Text style={styles.welcomeText}>Selamat Datang, Petani!</Text>
                  <Text style={styles.dateText}>{getCurrentDate()}</Text>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {/* Weather Section */}
          <View style={styles.weatherCard}>
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.weatherCardGradient}
            >
              <View style={styles.weatherCardHeader}>
                <View>
                  <Text style={styles.weatherTitle}>Cuaca Hari Ini</Text>
                  <Text style={styles.locationText}>
                    <Ionicons name="location" size={14} color="#FFFFFF" /> {currentWeather.location}
                  </Text>
                </View>
                <Ionicons 
                  name={currentWeather.icon as any} 
                  size={40} 
                  color="#FFFFFF" 
                />
              </View>

              <View style={styles.weatherCards}>
                {/* Suhu Udara */}
                <View style={styles.weatherDetailCard}>
                  <View style={styles.weatherIconContainer}>
                    <Ionicons name="thermometer-outline" size={20} color="#2E7D32" />
                  </View>
                  <Text style={styles.weatherValue}>{currentWeather.temperature}°C</Text>
                  <Text style={styles.weatherLabel}>Suhu Udara</Text>
                </View>

                {/* Curah Hujan */}
                <View style={styles.weatherDetailCard}>
                  <View style={styles.weatherIconContainer}>
                    <Ionicons name="rainy-outline" size={20} color="#2E7D32" />
                  </View>
                  <Text style={styles.weatherValue}>{displayPrecipitation}</Text>
                  <Text style={styles.weatherLabel}>Curah Hujan</Text>
                </View>
                
                {/* Kelembaban */}
                <View style={styles.weatherDetailCard}>
                  <View style={styles.weatherIconContainer}>
                    <Ionicons name="water-outline" size={20} color="#2E7D32" />
                  </View>
                  <Text style={styles.weatherValue}>{currentWeather.humidity}%</Text>
                  <Text style={styles.weatherLabel}>Lembab</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.forecastButton}
                onPress={handleViewForecast}
                activeOpacity={0.8}
              >
                <View style={styles.forecastButtonContent}>
                  <Ionicons name="calendar-outline" size={18} color="#2E7D32" />
                  <Text style={styles.forecastButtonText}>Lihat Ramalan 7 Hari</Text>
                  <Ionicons name="chevron-forward" size={18} color="#2E7D32" />
                </View>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Latest Plants Section */}
          <View style={styles.plantsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="leaf-outline" size={24} color="#2E7D32" />
                <Text style={styles.sectionTitle}>Aktivitas Tanaman</Text>
              </View>
              {plants.length > 0 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => router.push('/(tabs)/ditanam')}
                >
                  <Text style={styles.viewAllText}>Lihat Semua</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {plants.length > 0 ? (
              <View style={styles.plantsList}>
                {plants.map((plant, index) => {
                  const statusInfo = getPlantStatusInfo(plant);

                  return (
                    <TouchableOpacity 
                      key={plant.id || index} 
                      style={styles.plantCard}
                      onPress={() => handlePlantPress(plant.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.plantCardContent}>
                        {/* Icon Status */}
                        <View style={[styles.iconContainer, { backgroundColor: statusInfo.bgColor }]}>
                          <Ionicons 
                            name={statusInfo.icon} 
                            size={20} 
                            color={statusInfo.color} 
                          />
                        </View>

                        <View style={styles.plantInfo}>
                          <Text style={styles.plantName}>{plant.name}</Text>
                          <Text style={[styles.plantStatusLabel, { color: statusInfo.color }]}>
                            {statusInfo.label}
                          </Text>
                          <Text style={styles.plantDetailText}>
                            {statusInfo.detailText}
                          </Text>
                        </View>
                        
                        <Ionicons name="chevron-forward" size={18} color="#81C784" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="leaf-outline" size={60} color="#81C784" />
                <Text style={styles.emptyStateTitle}>Belum Ada Aktivitas</Text>
                <Text style={styles.emptyStateText}>
                  Tambah tanaman pertama Anda untuk memulai
                </Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={handleAddNote}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyStateButtonText}>Tambah Tanaman</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Quote Section */}
          <View style={styles.quoteCard}>
            <Ionicons name="flower-outline" size={24} color="#2E7D32" />
            <Text style={styles.quoteText}>
              "Tanamlah dengan kesabaran, panenlah dengan rasa syukur"
            </Text>
          </View>

          {/* Spacing for FAB */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Floating Action Button */}
        {plants.length > 0 && (
          <TouchableOpacity 
            style={styles.fab}
            onPress={handleAddNote}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <View style={styles.fabContent}>
                <Ionicons name="add" size={22} color="#FFFFFF" />
                <Text style={styles.fabText}>Tambah Tanaman</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1B5E20',
    fontWeight: '500',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  dateText: {
    fontSize: 14,
    color: '#2E7D32',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  weatherCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  weatherCardGradient: {
    padding: 24,
  },
  weatherCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  weatherTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weatherDetailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    textAlign: 'center',
  },
  weatherLabel: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 4,
    textAlign: 'center',
  },
  forecastButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  forecastButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  forecastButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  plantsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  plantsList: {
    gap: 12,
  },
  plantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  plantCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 2,
  },
  plantStatusLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  plantDetailText: {
    fontSize: 12,
    color: '#2E7D32',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quoteText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
    color: '#2E7D32',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});