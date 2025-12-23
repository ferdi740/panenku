import { Colors } from '@/constants/Colors';
import { plantService } from '@/services/plantService';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '@/contexts/NotificationContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Impor service cuaca Anda
import { getCurrentWeather, WeatherData } from '@/services/weatherService';

// Helper untuk mendapatkan info perawatan berdasarkan kondisi cuaca
// Helper untuk mendapatkan info perawatan berdasarkan kondisi cuaca
const getWeatherCareInfo = (weatherData: WeatherData | null) => {
  // Fallback jika tidak ada data cuaca
  if (!weatherData) {
    return {
      condition: 'Tidak Diketahui',
      icon: 'help-circle' as const,
      color: '#757575',
      bgColor: 'rgba(117, 117, 117, 0.1)',
      tips: [
        'Data cuaca tidak tersedia saat ini.',
        'Pastikan tanaman mendapat cahaya yang cukup.',
        'Siram tanaman sesuai kebutuhan, periksa kelembapan tanah terlebih dahulu.',
        'Periksa tanaman secara rutin untuk tanda-tanda hama atau penyakit.'
      ]
    };
  }

  const temp = weatherData.temperature;
  const condition = weatherData.condition; // Sudah pasti salah satu dari 5 kondisi
  const rainChance = weatherData.precipitation || 0;
  const windSpeed = weatherData.windSpeed || 0;

  // Berdasarkan 5 kondisi dari weatherService.ts:
  switch (condition) {
    // 1. CERAH
    case 'cerah':
      return {
        condition: 'Cerah',
        icon: 'sunny' as const,
        color: '#FFC107',
        bgColor: 'rgba(255, 193, 7, 0.1)',
        tips: [
          'Siram tanaman pagi hari sebelum matahari terik.',
          'Pastikan tanaman mendapat sinar matahari langsung 4-6 jam sehari.',
          'Lakukan penyemprotan daun untuk mencegah dehidrasi.',
          'Ideal untuk pertumbuhan bunga dan buah.',
          'Tanaman seperti Tomat, Cabai, atau Mawar akan tumbuh subur.'
        ]
      };
    
    // 2. PANAS/TERIK
    case 'panas':
      return {
        condition: 'Terik',
        icon: 'thermometer' as const,
        color: '#F44336',
        bgColor: 'rgba(244, 67, 54, 0.1)',
        tips: [
          'Siram pagi (sebelum jam 8) dan sore (setelah jam 5).',
          'Berikan naungan sementara untuk tanaman sensitif.',
          'Gunakan sistem irigasi tetes untuk efisiensi air.',
          'Pantau tanda dehidrasi: daun layu, menguning, atau menggulung.',
          'Tanaman kaktus, lidah buaya, bougenville tahan kondisi panas.'
        ]
      };
    
    // 3. BERAWAN
    case 'berawan':
      return {
        condition: 'Berawan',
        icon: 'partly-sunny' as const,
        color: '#607D8B',
        bgColor: 'rgba(96, 125, 139, 0.1)',
        tips: [
          'Kurangi frekuensi penyiraman karena penguapan rendah.',
          'Pastikan tanaman tetap mendapat cahaya tidak langsung yang cukup.',
          'Waktu ideal untuk pemupukan dan pemangkasan.',
          'Periksa kelembapan tanah sebelum menyiram.',
          'Tanaman daun hias seperti Aglaonema, Sirih Gading tumbuh optimal.'
        ]
      };
    
    // 4. HUJAN
    case 'hujan':
      return {
        condition: 'Hujan',
        icon: 'rainy' as const,
        color: '#2196F3',
        bgColor: 'rgba(33, 150, 243, 0.1)',
        tips: [
          'Kurangi intensitas penyiraman karena tanah sudah lembap.',
          'Pastikan drainase pot/tanah baik untuk hindari genangan air.',
          'Periksa tanda-tanda jamur atau hama yang berkembang dalam kelembapan tinggi.',
          'Jika memungkinkan, pindahkan tanaman ke tempat yang tidak langsung terkena hujan.',
          'Tanaman seperti Bougenville, Calendula, atau Geranium tahan terhadap cuaca hujan.'
        ]
      };
    
    // 5. DINGIN/SEJUK
    case 'dingin':
      return {
        condition: 'Sejuk/Dingin',
        icon: 'snow' as const,
        color: '#3F51B5',
        bgColor: 'rgba(63, 81, 181, 0.1)',
        tips: [
          'Siram lebih jarang (2-3 hari sekali).',
          'Lindungi tanaman sensitif dari embun beku.',
          'Gunakan rumah kaca mini untuk tanaman tropis.',
          'Tanaman subtropis seperti Wortel, Kol, Stroberi tumbuh baik.',
          'Hindari pemupukan nitrogen tinggi.'
        ]
      };
    
    // DEFAULT (seharusnya tidak terjadi karena sudah ada 5 kondisi di service)
    default:
      return {
        condition: weatherData.label || 'Cuaca Normal',
        icon: 'partly-sunny' as const,
        color: '#4CAF50',
        bgColor: 'rgba(76, 175, 80, 0.1)',
        tips: [
          'Lanjutkan perawatan rutin sesuai kebutuhan tanaman.',
          'Siram saat tanah bagian atas terasa kering.',
          'Pastikan tanaman mendapat sinar matahari yang cukup.',
          'Lakukan pemantauan rutin untuk kesehatan tanaman.',
          'Gunakan media tanam yang berpori untuk sirkulasi udara yang baik.'
        ]
      };
  }
};

export default function PlantDetailModal() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [plant, setPlant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  
  // State untuk Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [isDeleting, setIsDeleting] = useState(false);

  const plantId = typeof params.id === 'string' ? params.id : 
                  Array.isArray(params.id) ? params.id[0] : 
                  (params as any).id;

  const loadPlant = useCallback(async () => {
    try {
      const plantData = await plantService.getPlantById(plantId);
      if (plantData) {
        setPlant(plantData);
      } else {
        showNotification('Tanaman tidak ditemukan.', 'error');
        router.back();
      }
    } catch (error) {
      console.error('Error loading plant:', error);
      showNotification('Gagal memuat data tanaman.', 'error');
    } finally {
      setLoading(false);
    }
  }, [plantId, router, showNotification]);

  // Fungsi untuk mengambil data cuaca
  const loadWeatherData = useCallback(async () => {
    try {
      setWeatherLoading(true);
      const weather = await getCurrentWeather();
      setCurrentWeather(weather);
    } catch (error) {
      console.error('Error loading weather:', error);
      // Fallback weather data
      setCurrentWeather({
        temperature: 28,
        condition: 'berawan',
        label: 'Berawan',
        humidity: 60,
        windSpeed: 10,
        precipitation: 0,
        location: 'Lokasi Tidak Diketahui',
        icon: 'partly-sunny',
        harvestDurationDays: 90,
        harvestDurationText: '3 Bulan',
        forecast: []
      });
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    if (plantId && plantId !== 'undefined') {
      loadPlant();
      loadWeatherData();
    } else {
      showNotification('ID tanaman tidak valid.', 'error');
      router.back();
    }
  }, [plantId, loadPlant, loadWeatherData, router, showNotification]);

  // Fungsi untuk menghitung progress tumbuh
  const calculateGrowthProgress = () => {
    if (!plant || !plant.plantedDate) return 0;

    // Jika sudah dipanen, progress selalu 100%
    if (plant.status === 'harvested') {
      return 100;
    }

    // Jika sedang tumbuh, hitung progress berdasarkan hari
    if (plant.status === 'growing' && plant.harvestDate) {
      try {
        const plantedDate = new Date(plant.plantedDate);
        const harvestDate = new Date(plant.harvestDate);
        const currentDate = new Date();
        
        // Pastikan tanggal valid
        if (isNaN(plantedDate.getTime()) || isNaN(harvestDate.getTime())) {
          return plant.progress || 0;
        }

        const totalDuration = harvestDate.getTime() - plantedDate.getTime();
        const elapsedDuration = currentDate.getTime() - plantedDate.getTime();
        
        if (totalDuration <= 0 || elapsedDuration <= 0) return 0;
        if (elapsedDuration >= totalDuration) return 100;
        
        const progress = Math.min(Math.max((elapsedDuration / totalDuration) * 100, 0), 100);
        return Math.round(progress);
      } catch {
        return plant.progress || 0;
      }
    }
    
    return plant?.progress || 0;
  };

  // Fungsi untuk menghitung hari menuju panen
  const calculateDaysToHarvest = () => {
    if (!plant || !plant.harvestDate || plant.status === 'harvested') return 0;
    
    try {
      const currentDate = new Date();
      const harvestDate = new Date(plant.harvestDate);
      
      if (isNaN(harvestDate.getTime())) return 0;
      
      const diffTime = harvestDate.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(diffDays, 0);
    } catch {
      return 0;
    }
  };

  // Fungsi untuk mendapatkan teks status progress
  const getProgressStatusText = () => {
    if (!plant) return '';
    
    if (plant.status === 'harvested') {
      return 'Sudah dipanen';
    }
    
    const daysLeft = calculateDaysToHarvest();
    const progress = calculateGrowthProgress();
    
    if (progress === 100) {
      return 'Siap dipanen!';
    } else if (daysLeft > 0) {
      return `${daysLeft} hari menuju panen`;
    } else {
      return `${progress}% tumbuh`;
    }
  };

  const handleEdit = () => {
    if (plant && plant.id) {
      router.push(`/edit-plant/${plant.id}`);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleDeletePress = () => {
    if (!plant || !plant.id) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await plantService.deletePlant(plant.id);
      if (success) {
        setShowDeleteModal(false);
        showNotification('Tanaman berhasil dihapus.', 'success');
        
        setTimeout(() => {
          router.back();
        }, 300);
      } else {
        showNotification('Gagal menghapus tanaman.', 'error');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting plant:', error);
      showNotification('Gagal menghapus tanaman. Coba lagi.', 'error');
      setIsDeleting(false);
    }
  };
  
  const handleHarvest = () => {
    if (!plant) return;
    setShowHarvestModal(true);
  };

  const calculateHarvestDuration = () => {
    if (!plant || !plant.plantedDate || !plant.harvestDate) {
      return plant?.harvestDuration || '4 - 5 Bulan';
    }

    try {
      const planted = new Date(plant.plantedDate);
      const harvest = new Date(plant.harvestDate);
      const diffTime = Math.abs(harvest.getTime() - planted.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = Math.ceil(diffDays / 30);

      if (diffMonths <= 1) return '1 Bulan';
      else if (diffMonths <= 2) return '1 - 2 Bulan';
      else if (diffMonths <= 3) return '2 - 3 Bulan';
      else if (diffMonths <= 4) return '3 - 4 Bulan';
      else if (diffMonths <= 5) return '4 - 5 Bulan';
      else return `${diffMonths - 1} - ${diffMonths} Bulan`;
    } catch {
      return plant?.harvestDuration || '4 - 5 Bulan';
    }
  };

  const getConditionsList = () => {
    if (!plant) return [];

    if (plant.status === 'growing') {
      return [];
    }

    if (plant.status === 'harvested') {
      const start = new Date(plant.plantedDate);
      const end = new Date(plant.harvestDate);
      const list = [];
      
      let current = new Date(start);
      let safeGuard = 0;
      
      while (current <= end || (current.getMonth() === end.getMonth() && current.getFullYear() === end.getFullYear())) {
        if (safeGuard > 12) break;

        const monthName = current.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        
        const uniqueSeed = current.getFullYear() * 12 + current.getMonth();
        const rnd = ((Math.sin(uniqueSeed) * 10000) % 1 + 1) % 1;

        const temp = Math.floor(26 + (rnd * 5));
        const rndRain = ((Math.cos(uniqueSeed) * 10000) % 1 + 1) % 1;
        const rainChance = Math.floor(30 + (rndRain * 60));
        const hum = Math.floor(65 + (rnd * 20));
        
        let status = 'suitable';
        let statusText = 'Sesuai';
        
        if (rainChance > 90 || temp > 35) {
           status = 'warning';
           statusText = 'Kurang Ideal';
        } else if (rainChance < 10) {
           status = 'not-suitable';
           statusText = 'Kekeringan';
        }

        list.push({
           month: monthName,
           status,
           statusText,
           rain: `${rainChance}%`,
           temp: `${temp}°C`,
           humidity: `${hum}%`
        });

        current.setMonth(current.getMonth() + 1);
        safeGuard++;
      }
      return list;
    }
    
    return [];
  };

  const environmentalConditions = getConditionsList();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'suitable': return '#2E7D32';
      case 'warning': return '#FF9800';
      case 'not-suitable': return '#F44336';
      default: return '#81C784';
    }
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
            <Text style={styles.loadingText}>Memuat detail tanaman...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!plant) {
    return null;
  }

  // Hitung nilai yang dibutuhkan
  const growthProgress = calculateGrowthProgress();
  const progressStatusText = getProgressStatusText();
  const daysToHarvest = calculateDaysToHarvest();

  // Cek apakah tanaman sudah dipanen
  const isHarvested = plant.status === 'harvested';

  // Dapatkan info perawatan berdasarkan cuaca
  const weatherInfo = getWeatherCareInfo(currentWeather);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
        style={styles.backgroundGradient}
      >
        {/* Header Image Section */}
        <View style={styles.headerImageContainer}>
          <Image source={{ uri: plant.image }} style={styles.headerImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
            style={styles.imageOverlay}
          />

          {/* Back Button */}
          <TouchableOpacity
            onPress={handleClose}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="arrow-back" size={24} color="#1B5E20" />
            </View>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {/* Hanya tampilkan tombol edit jika tanaman belum dipanen */}
            {!isHarvested && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEdit}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.editButtonGradient}
                >
                  <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeletePress}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#FF5252', '#F44336']}
                style={styles.deleteButtonGradient}
              >
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Plant Title */}
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{plant.name}</Text>
            <View style={styles.statusBadge}>
              <Ionicons name="leaf" size={16} color="#FFFFFF" />
              <Text style={styles.statusBadgeText}>
                {plant.status === 'growing' ? 'Sedang Tumbuh' : 'Sudah Panen'}
              </Text>
            </View>
          </View>

          {/* Progress Badge */}
          <View style={styles.progressBadge}>
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.progressBadgeGradient}
            >
              <Text style={styles.progressText}>{growthProgress}%</Text>
              <Text style={styles.progressLabel}>Progress</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Content ScrollView */}
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {/* Plant Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={24} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Informasi Tanaman</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="leaf-outline" size={20} color="#2E7D32" />
                </View>
                <Text style={styles.infoLabel}>Jenis Tanaman</Text>
                <Text style={styles.infoValue}>{plant.name}</Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="location" size={20} color="#2E7D32" />
                </View>
                <Text style={styles.infoLabel}>Lokasi</Text>
                <Text style={styles.infoValue}>{plant.location || 'Tidak tersedia'}</Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="time-outline" size={20} color="#2E7D32" />
                </View>
                <Text style={styles.infoLabel}>Durasi Panen</Text>
                <Text style={styles.infoValue}>{calculateHarvestDuration()}</Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
                </View>
                <Text style={styles.infoLabel}>Tanggal Tanam</Text>
                <Text style={styles.infoValue}>
                  {new Date(plant.plantedDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progress Tumbuh</Text>
                <Text style={styles.progressPercentage}>{growthProgress}%</Text>
              </View>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={[styles.progressBarFill, { width: `${growthProgress}%` }]}
                />
              </View>
              <Text style={styles.progressStatus}>
                {progressStatusText}
              </Text>
            </View>
          </View>

          {/* Weather Care Tips Card - Hanya untuk tanaman yang sedang tumbuh */}
{plant.status === 'growing' && (
  <View style={styles.weatherCareCard}>
    {/* GANTI ICON DAN TEKS DI SINI */}
    <View style={styles.sectionHeader}>
      {/* GANTI IONICONS NAME MENJADI "water-outline" ATAU "leaf-outline" */}
      <Ionicons name="leaf-outline" size={24} color="#2E7D32" />
      {/* GANTI TEKS MENJADI "Tips Merawat Tanaman" */}
      <Text style={styles.sectionTitle}>Tips Merawat Tanaman</Text>
    </View>
    
    {weatherLoading ? (
      <View style={styles.weatherLoading}>
        <ActivityIndicator size="small" color="#2E7D32" />
        <Text style={styles.weatherLoadingText}>Memuat data cuaca...</Text>
      </View>
    ) : (
      <>
        <View style={styles.weatherConditionHeader}>
          <View style={[styles.weatherIconContainer, { backgroundColor: weatherInfo.bgColor }]}>
            {/* Icon kondisi cuaca tetap sama (dinamis) */}
            <Ionicons name={weatherInfo.icon} size={24} color={weatherInfo.color} />
          </View>
          <View style={styles.weatherConditionText}>
            <Text style={styles.weatherConditionTitle}>
              {weatherInfo.condition}
            </Text>
            <Text style={styles.weatherConditionSubtitle}>
              {currentWeather ? 
                `${currentWeather.location} • Suhu: ${currentWeather.temperature}°C • Curah Hujan: ${Math.round((currentWeather.precipitation || 0) * 100)}%` : 
                'Data cuaca tidak tersedia'}
            </Text>
          </View>
        </View>
        
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips Perawatan:</Text>
          {weatherInfo.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: weatherInfo.color }]} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.generalTips}>
          <Text style={styles.generalTipsTitle}>💡 Tips Umum untuk Semua Cuaca:</Text>
          <Text style={styles.generalTipsText}>
            • Gunakan media tanam berpori baik (campuran tanah, sekam, pasir)
            • Beri jarak antar tanaman untuk sirkulasi udara
            • Lakukan pemangkasan rutin untuk kesehatan tanaman
            • Periksa tanda-tanda hama dan penyakit secara berkala
          </Text>
        </View>
      </>
    )}
  </View>
)}

          {/* Environmental Conditions Card */}
          {environmentalConditions.length > 0 && (
            <View style={styles.conditionsCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="analytics-outline" size={24} color="#2E7D32" />
                  <Text style={styles.sectionTitle}>Riwayat Lingkungan</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowInfoModal(true)}
                  style={styles.infoButton}
                >
                  <Ionicons name="information-circle" size={20} color="#81C784" />
                </TouchableOpacity>
              </View>

              <Text style={styles.conditionsSubtitle}>
                Kondisi lingkungan selama periode tanam
              </Text>

              {environmentalConditions.map((condition, index) => (
                <View key={index} style={styles.conditionItem}>
                  <View style={styles.conditionHeader}>
                    <Text style={styles.conditionMonth}>{condition.month}</Text>
                    <View style={[styles.statusBadgeSmall, { backgroundColor: `${getStatusColor(condition.status)}20` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(condition.status) }]}>
                        {condition.statusText}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.metricsContainer}>
                    <View style={styles.metricItem}>
                      <View style={[styles.metricIcon, { backgroundColor: `${getStatusColor(condition.status)}15` }]}>
                        <Ionicons name="rainy-outline" size={16} color={getStatusColor(condition.status)} />
                      </View>
                      <Text style={styles.metricLabel}>Hujan</Text>
                      <Text style={[styles.metricValue, { color: getStatusColor(condition.status) }]}>
                        {condition.rain}
                      </Text>
                    </View>

                    <View style={styles.metricItem}>
                      <View style={[styles.metricIcon, { backgroundColor: `${getStatusColor(condition.status)}15` }]}>
                        <Ionicons name="thermometer-outline" size={16} color={getStatusColor(condition.status)} />
                      </View>
                      <Text style={styles.metricLabel}>Suhu</Text>
                      <Text style={[styles.metricValue, { color: getStatusColor(condition.status) }]}>
                        {condition.temp}
                      </Text>
                    </View>

                    <View style={styles.metricItem}>
                      <View style={[styles.metricIcon, { backgroundColor: `${getStatusColor(condition.status)}15` }]}>
                        <Ionicons name="water-outline" size={16} color={getStatusColor(condition.status)} />
                      </View>
                      <Text style={styles.metricLabel}>Kelembaban</Text>
                      <Text style={[styles.metricValue, { color: getStatusColor(condition.status) }]}>
                        {condition.humidity}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Harvest Button (Hanya untuk tanaman yang sedang tumbuh) */}
        {plant.status === 'growing' && (
          <TouchableOpacity style={styles.harvestButton} onPress={handleHarvest} activeOpacity={0.8}>
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.harvestButtonGradient}
            >
              <View style={styles.harvestButtonContent}>
                <Ionicons name="basket-outline" size={22} color="#FFFFFF" />
                <Text style={styles.harvestButtonText}>Panen Sekarang</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>

{/* Delete Confirmation Modal - COMPACT THEMED */}
<Modal
  transparent={true}
  visible={showDeleteModal}
  animationType="fade"
  onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.themedCompactModal}>
      
      {/* Small leaf decorations */}
      <View style={styles.smallLeafTop}>
        <Ionicons name="leaf-outline" size={20} color="#F44336" opacity={0.2} />
      </View>
      
      {/* Icon with small glow */}
      <View style={styles.compactIconContainer}>
        <View style={styles.compactIconCircle}>
          <Ionicons name="trash-outline" size={36} color="#D32F2F" />
        </View>
      </View>
      
      {/* Title */}
      <Text style={styles.compactTitle}>Hapus Tanaman?</Text>
      
      {/* Message */}
      <View style={styles.compactMessageBox}>
        <Ionicons name="warning" size={16} color="#D32F2F" style={styles.compactWarningIcon} />
        <Text style={styles.compactMessage}>
          <Text style={styles.compactPlantName}>{plant.name}</Text> akan dihapus permanen.
        </Text>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.compactButtonRow}>
        <TouchableOpacity
          style={styles.compactCancelBtn}
          onPress={() => setShowDeleteModal(false)}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#E8F5E9', '#C8E6C9']}
            style={styles.compactBtnGradient}
          >
            <Ionicons name="close-circle" size={16} color="#2E7D32" />
            <Text style={styles.compactCancelText}>Batal</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.compactDeleteBtn}
          onPress={confirmDelete}
          disabled={isDeleting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF5252', '#F44336']}
            style={styles.compactBtnGradient}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="trash" size={16} color="#FFFFFF" />
                <Text style={styles.compactDeleteText}>Hapus</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Small note */}
      <Text style={styles.compactNote}>
        <Ionicons name="information-circle-outline" size={12} color="#757575" /> Aksi permanen
      </Text>
      
    </View>
  </View>
</Modal>

      {/* Info Modal */}
      <Modal transparent visible={showInfoModal} animationType="fade" onRequestClose={() => setShowInfoModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="information-circle" size={48} color="#2E7D32" />
            </View>
            <Text style={styles.modalTitle}>Info Data Lingkungan</Text>
            <Text style={styles.modalText}>
              Data ini adalah catatan historis kondisi lingkungan selama periode tanam Anda, mulai dari penanaman hingga panen.
            </Text>
            <TouchableOpacity style={styles.okButton} onPress={() => setShowInfoModal(false)}>
              <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                style={styles.okButtonGradient}
              >
                <Text style={styles.okButtonText}>Mengerti</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Harvest Confirmation Modal */}
      <Modal transparent visible={showHarvestModal} animationType="fade" onRequestClose={() => setShowHarvestModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="basket" size={48} color="#2E7D32" />
            </View>
            <Text style={styles.modalTitle}>Siap Panen?</Text>
            <Text style={styles.modalText}>
              Apakah tanaman <Text style={{fontWeight:'bold', color: '#1B5E20'}}>{plant.name}</Text> sudah siap dipanen? Status tanaman akan berubah menjadi "Sudah Panen".
            </Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowHarvestModal(false)}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmHarvestButton}
                onPress={() => {
                  setShowHarvestModal(false);
                  router.push(`/harvest-plant/${plant.id}`);
                }}
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.confirmHarvestButtonGradient}
                >
                  <Text style={styles.confirmHarvestButtonText}>Ya, Panen</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerImageContainer: {
    height: 280,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonsContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  editButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  editButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressBadge: {
    position: 'absolute',
    bottom: -30,
    right: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  progressBadgeGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  progressText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoItem: {
    width: '48%',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1B5E20',
    fontWeight: '500',
  },
  progressContainer: {
    backgroundColor: 'rgba(200, 230, 201, 0.3)',
    borderRadius: 16,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    color: '#1B5E20',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStatus: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  weatherCareCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  weatherLoading: {
    alignItems: 'center',
    padding: 20,
  },
  weatherLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#2E7D32',
  },
  weatherConditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(200, 230, 201, 0.3)',
    borderRadius: 16,
    padding: 16,
  },
  weatherIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  weatherConditionText: {
    flex: 1,
  },
  weatherConditionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  weatherConditionSubtitle: {
    fontSize: 12,
    color: '#2E7D32',
  },
  tipsContainer: {
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 18,
  },
  generalTips: {
    backgroundColor: 'rgba(129, 199, 132, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  generalTipsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 8,
  },
  generalTipsText: {
    fontSize: 11,
    color: '#2E7D32',
    lineHeight: 18,
  },
  conditionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  conditionsSubtitle: {
    fontSize: 12,
    color: '#81C784',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  infoButton: {
    padding: 4,
  },
  conditionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 201, 0.5)',
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  conditionMonth: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 10,
    color: '#2E7D32',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 40,
  },
  harvestButton: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  harvestButtonGradient: {
    paddingVertical: 16,
  },
  harvestButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  harvestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalIconContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 50,
    backgroundColor: 'rgba(200, 230, 201, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalTextCenter: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(200, 230, 201, 0.5)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmDeleteButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  confirmHarvestButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmHarvestButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmHarvestButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  okButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  okButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  okButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Tambahkan setelah modalOverlay atau di bagian styles modal:
deleteModalGradient: {
  borderRadius: 24,
  padding: 32,
  width: '100%',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
},
deleteLeafTopLeft: {
  position: 'absolute',
  top: 16,
  left: 16,
  transform: [{ rotate: '-25deg' }],
},
deleteLeafBottomRight: {
  position: 'absolute',
  bottom: 16,
  right: 16,
  transform: [{ rotate: '45deg' }],
},
trashIconCircle: {
  width: 90,
  height: 90,
  borderRadius: 45,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 6,
},
deleteModalTitle: {
  fontSize: 24,
  fontWeight: '800',
  color: '#D32F2F',
  marginTop: 20,
  marginBottom: 16,
  textAlign: 'center',
},
deleteMessageContainer: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  borderRadius: 16,
  padding: 20,
  marginBottom: 24,
  width: '100%',
},
warningIcon: {
  marginRight: 12,
  marginTop: 2,
},
deleteModalText: {
  flex: 1,
  fontSize: 15,
  color: '#1B5E20',
  lineHeight: 22,
  fontWeight: '500',
},
plantNameHighlight: {
  fontWeight: '700',
  color: '#2E7D32',
  fontStyle: 'italic',
},
warningText: {
  color: '#F44336',
  fontWeight: '700',
},
cancelDeleteButton: {
  flex: 1,
  borderRadius: 18,
  overflow: 'hidden',
  marginRight: 8,
},
cancelDeleteButtonGradient: {
  paddingVertical: 16,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
},
cancelDeleteButtonText: {
  color: '#2E7D32',
  fontSize: 16,
  fontWeight: '600',
},
deleteButtonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
},
deletingContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
},
deletingText: {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '600',
},
deleteNote: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 20,
  padding: 12,
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  borderRadius: 12,
  gap: 8,
},
deleteNoteText: {
  flex: 1,
  fontSize: 12,
  color: '#757575',
  fontStyle: 'italic',
},
glowRing: {
  position: 'absolute',
  width: 110,
  height: 110,
  borderRadius: 55,
  borderWidth: 2,
},
themedCompactModal: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 20,
  width: '85%',
  maxWidth: 300,
  alignItems: 'center',
  position: 'relative',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.2,
  shadowRadius: 10,
  elevation: 8,
},
smallLeafTop: {
  position: 'absolute',
  top: 8,
  right: 8,
  transform: [{ rotate: '25deg' }],
},
compactIconContainer: {
  marginBottom: 12,
},
compactIconCircle: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: 'rgba(244, 67, 54, 0.1)',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: 'rgba(244, 67, 54, 0.2)',
},
compactTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#D32F2F',
  marginBottom: 12,
  textAlign: 'center',
},
compactMessageBox: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: 'rgba(255, 235, 238, 0.5)',
  borderRadius: 12,
  padding: 14,
  marginBottom: 20,
  width: '100%',
},
compactWarningIcon: {
  marginRight: 8,
  marginTop: 1,
},
compactMessage: {
  flex: 1,
  fontSize: 14,
  color: '#2E7D32',
  lineHeight: 20,
},
compactPlantName: {
  fontWeight: '700',
  color: '#1B5E20',
  fontStyle: 'italic',
},
compactButtonRow: {
  flexDirection: 'row',
  gap: 10,
  width: '100%',
  marginBottom: 12,
},
compactCancelBtn: {
  flex: 1,
  borderRadius: 12,
  overflow: 'hidden',
},
compactDeleteBtn: {
  flex: 1,
  borderRadius: 12,
  overflow: 'hidden',
},
compactBtnGradient: {
  paddingVertical: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
},
compactCancelText: {
  color: '#2E7D32',
  fontSize: 14,
  fontWeight: '600',
},
compactDeleteText: {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '600',
},
compactNote: {
  fontSize: 11,
  color: '#757575',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
});