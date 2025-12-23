import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getCurrentWeather, WeatherData } from '@/services/weatherService';

export default function CuacaScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWeather = async () => {
    try {
      // Mengambil data cuaca + ramalan 7 hari dari service
      const weatherData = await getCurrentWeather();
      setWeather(weatherData);
    } catch (error) {
      console.error('Error loading weather:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWeather();
  };

  // Helper untuk mendapatkan icon yang sesuai (UPDATED)
  const getWeatherIcon = (condition: string) => {
    // Normalisasi kondisi ke lowercase untuk matching
    const cond = condition ? condition.toLowerCase() : '';

    // Mapping yang lebih komprehensif
    if (cond.includes('cerah') || cond.includes('sunny') || cond === 'clear') return 'sunny';
    if (cond.includes('hujan') || cond.includes('rain')) return 'rainy';
    if (cond.includes('berawan') || cond.includes('cloud')) return 'cloudy';
    if (cond.includes('partly') || cond.includes('sebagian')) return 'partly-sunny';
    if (cond.includes('badai') || cond.includes('storm') || cond.includes('petir')) return 'thunderstorm';
    if (cond.includes('panas') || cond.includes('hot')) return 'thermometer'; // Ikon termometer untuk panas
    if (cond.includes('dingin') || cond.includes('cold') || cond.includes('snow')) return 'snow';
    
    // Khusus icon malam (digunakan di hourly)
    if (cond === 'moon') return 'moon';
    if (cond === 'cloudy-night') return 'cloudy-night';

    return 'partly-sunny'; // Default fallback
  };

  // Generate dynamic hourly forecast based on current time
  const getHourlyForecast = (currentTemp: number, currentCondition: string) => {
    const now = new Date();
    const currentHour = now.getHours();
    const forecast = [];

    // Generate current hour + next 3 hours (Total 4 jam)
    for (let i = 0; i < 4; i++) {
      let nextHour = (currentHour + i) % 24; // Gunakan modulo untuk handle jam > 23
      
      // Format time (e.g., "14.00")
      const timeString = `${nextHour.toString().padStart(2, '0')}.00`;
      
      let hourlyTemp;
      let icon = 'cloudy'; // Default icon for hour
      
      // Kondisi dasar untuk jam ini (bisa berubah jika malam)
      let baseCondition = currentCondition.toLowerCase();

      // Cek apakah malam hari (18.00 - 05.00)
      const isNight = nextHour >= 18 || nextHour <= 5;

      if (i === 0) {
        // Jam saat ini (index 0) harus sama persis dengan suhu utama
        hourlyTemp = currentTemp;
        
        // Sesuaikan icon saat ini dengan waktu (siang/malam)
        if (isNight && (baseCondition.includes('cerah') || baseCondition.includes('sunny'))) {
            icon = 'moon';
        } else if (isNight && (baseCondition.includes('berawan') || baseCondition.includes('cloud'))) {
            icon = 'cloudy-night';
        } else {
            icon = getWeatherIcon(baseCondition); // Gunakan icon normal
        }

      } else {
        // Jam berikutnya: variasi suhu & icon
        let tempChange = 0;
        if (nextHour >= 10 && nextHour <= 14) tempChange = 1; 
        else if (isNight) tempChange = -2;
        
        hourlyTemp = Math.round(currentTemp + (Math.random() * 1.5 - 0.5) + (tempChange * 0.5));

        // Logic icon hourly
        if (baseCondition.includes('hujan') || baseCondition.includes('rain')) {
           icon = 'rainy'; // Hujan tetap hujan (siang/malam)
        } else if (baseCondition.includes('panas')) {
           icon = isNight ? 'moon' : 'sunny'; // Panas malamnya cerah/bulan
        } else if (baseCondition.includes('dingin') || baseCondition.includes('snow')) {
           icon = 'snow';
        } else if (baseCondition.includes('cerah') || baseCondition.includes('sunny')) {
           icon = isNight ? 'moon' : 'sunny';
        } else {
           // Berawan / Default
           icon = isNight ? 'cloudy-night' : 'partly-sunny';
        }
      }

      forecast.push({
        time: timeString,
        temp: `${hourlyTemp}°`,
        icon: icon, // Icon string yang sudah disesuaikan (moon, sunny, rainy, etc)
        active: i === 0 
      });
    }
    return forecast;
  };

  const getCurrentDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
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
            <Text style={styles.loadingText}>Memuat data cuaca...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Fallback data jika weather null
  const currentWeather = weather || {
    temperature: 28,
    condition: 'berawan',
    label: 'Berawan',
    humidity: 60,
    windSpeed: 10,
    precipitation: 10,
    location: 'Memuat...',
    icon: 'partly-sunny',
    forecast: []
  };

  // Generate dynamic hourly data
  const hourlyData = getHourlyForecast(currentWeather.temperature, currentWeather.condition);

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
                <View style={styles.iconContainer}>
                  <Ionicons name="leaf-outline" size={20} color="#1B5E20" style={styles.leafIcon} />
                </View>
                <Text style={styles.screenLabel}>Cuaca Lokal</Text>
              </View>
              <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                <Ionicons name="refresh-circle" size={32} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={20} color="#1B5E20" />
              <Text style={styles.locationText} numberOfLines={1}>
                {currentWeather.location}
              </Text>
            </View>
          </View>
        </SafeAreaView>

        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#2E7D32"
              colors={['#2E7D32']}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Current Weather Card */}
          <View style={styles.currentWeatherCard}>
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.currentWeatherGradient}
            >
              <View style={styles.currentWeatherContent}>
                <View style={styles.weatherMainInfo}>
                  <View>
                    <Text style={styles.currentDate}>{getCurrentDate()}</Text>
                    <Text style={styles.temperature}>{currentWeather.temperature}°</Text>
                    <Text style={styles.weatherCondition}>
                      {(currentWeather as any).label || currentWeather.condition}
                    </Text>
                  </View>
                  <Ionicons 
                    name={currentWeather.icon as any} 
                    size={80} 
                    color="#FFFFFF" 
                  />
                </View>
                
                <View style={styles.tempRangeContainer}>
                  <View style={styles.tempRangeItem}>
                    {/* Ganti dengan icon yang tersedia */}
                    <Ionicons name="chevron-up" size={16} color="#FFFFFF" />
                    <Text style={styles.tempRangeText}>Max: {currentWeather.temperature + 3}°</Text>
                  </View>
                  <View style={styles.tempRangeItem}>
                    {/* Ganti dengan icon yang tersedia */}
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                    <Text style={styles.tempRangeText}>Min: {currentWeather.temperature - 2}°</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Weather Details Cards */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailCard}>
              <View style={styles.detailCardIconContainer}>
                <Ionicons name="thermometer-outline" size={24} color="#2E7D32" />
              </View>
              <Text style={styles.detailCardValue}>{currentWeather.temperature}°C</Text>
              <Text style={styles.detailCardLabel}>Suhu Udara</Text>
            </View>
            
            <View style={styles.detailCard}>
              <View style={styles.detailCardIconContainer}>
                <Ionicons name="rainy-outline" size={24} color="#2E7D32" />
              </View>
              <Text style={styles.detailCardValue}>{currentWeather.precipitation}%</Text>
              <Text style={styles.detailCardLabel}>Curah Hujan</Text>
            </View>
            
            <View style={styles.detailCard}>
              <View style={styles.detailCardIconContainer}>
                <Ionicons name="water-outline" size={24} color="#2E7D32" />
              </View>
              <Text style={styles.detailCardValue}>{currentWeather.humidity}%</Text>
              <Text style={styles.detailCardLabel}>Kelembaban</Text>
            </View>
          </View>

          {/* Today's Hourly Forecast */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="time-outline" size={20} color="#2E7D32" />
                <Text style={styles.sectionTitle}>Hari Ini</Text>
              </View>
              <Text style={styles.sectionDate}>{getCurrentDate()}</Text>
            </View>
            
            <View style={styles.hourlyForecast}>
              {hourlyData.map((hour, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.hourlyItem,
                    hour.active && styles.hourlyItemActive
                  ]}
                >
                  <Text style={[
                    styles.hourlyTime,
                    hour.active && styles.hourlyTimeActive
                  ]}>
                    {hour.time}
                  </Text>
                  <View style={[
                    styles.hourlyIconContainer,
                    hour.active && styles.hourlyIconContainerActive
                  ]}>
                    <Ionicons 
                      name={getWeatherIcon(hour.icon) as any} 
                      size={28} 
                      color={hour.active ? "#2E7D32" : "#4CAF50"} 
                    />
                  </View>
                  <Text style={[
                    styles.hourlyTemp,
                    hour.active && styles.hourlyTempActive
                  ]}>
                    {hour.temp}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Next 7 Days Forecast */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
                <Text style={styles.sectionTitle}>7 Hari Kedepan</Text>
              </View>
            </View>
            
            {currentWeather.forecast && currentWeather.forecast.length > 0 ? (
              currentWeather.forecast.map((day: any, index: number) => (
                <View key={index} style={styles.forecastDayItem}>
                  <Text style={styles.forecastDay}>{day.day}</Text>
                  
                  <View style={styles.forecastCondition}>
                    <Ionicons 
                      name={day.icon as any} 
                      size={24} 
                      color="#4CAF50" 
                      style={{marginRight: 8}}
                    />
                    <Text style={styles.forecastConditionText}>
                      {day.condition.charAt(0).toUpperCase() + day.condition.slice(1)}
                    </Text>
                  </View>

                  <View style={styles.forecastTemps}>
                    <Text style={styles.forecastHigh}>{day.high}</Text>
                    <Text style={styles.forecastLow}>{day.low}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="cloud-offline-outline" size={48} color="#81C784" />
                <Text style={styles.noDataText}>
                  Tidak ada data ramalan cuaca
                </Text>
              </View>
            )}
          </View>

          {/* Footer Spacing dengan tema alam */}
          <View style={styles.footerSpacing}>
            <Ionicons name="leaf" size={24} color="#81C784" />
            <Text style={styles.footerText}>Tetaplah terhubung dengan alam</Text>
          </View>
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  leafIcon: {
    marginRight: 0,
  },
  screenLabel: {
    fontSize: 20,
    color: '#1B5E20',
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  refreshButton: {
    padding: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  currentWeatherCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  currentWeatherGradient: {
    padding: 24,
  },
  currentWeatherContent: {
    alignItems: 'center',
  },
  weatherMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  currentDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  temperature: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  weatherCondition: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  tempRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  tempRangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tempRangeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  detailCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 20,
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailCardValue: {
    fontSize: 18,
    color: '#1B5E20',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailCardLabel: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 125, 50, 0.1)',
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
  sectionDate: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  hourlyForecast: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  hourlyItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    minWidth: 70,
  },
  hourlyItemActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  hourlyTime: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 8,
  },
  hourlyTimeActive: {
    color: '#1B5E20',
    fontWeight: '600',
  },
  hourlyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  hourlyIconContainerActive: {
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
  },
  hourlyTemp: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 4,
  },
  hourlyTempActive: {
    color: '#1B5E20',
    fontWeight: 'bold',
  },
  forecastDayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 125, 50, 0.1)',
  },
  forecastDay: {
    fontSize: 15,
    color: '#1B5E20',
    fontWeight: '500',
    width: 80,
  },
  forecastCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingLeft: 10,
  },
  forecastConditionText: {
    fontSize: 13,
    color: '#2E7D32',
  },
  forecastTemps: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    width: 80,
    justifyContent: 'flex-end',
  },
  forecastHigh: {
    fontSize: 15,
    color: '#1B5E20',
    fontWeight: 'bold',
  },
  forecastLow: {
    fontSize: 15,
    color: '#4CAF50',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noDataText: {
    marginTop: 12,
    fontSize: 14,
    color: '#81C784',
    textAlign: 'center',
  },
  footerSpacing: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 8,
    fontStyle: 'italic',
  },
});