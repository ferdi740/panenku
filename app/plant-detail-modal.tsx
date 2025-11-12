import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  StyleSheet 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { plantService } from '@/services/plantService';

export default function PlantDetailModal() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [plant, setPlant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);

  const plantId = typeof params.id === 'string' ? params.id : 
                 Array.isArray(params.id) ? params.id[0] : 
                 (params as any).id;

  useEffect(() => {
    if (plantId && plantId !== 'undefined') {
      loadPlant();
    } else {
      Alert.alert('Error', 'ID tanaman tidak valid');
      router.push('/(tabs)/ditanam');
    }
  }, [plantId]);

  const loadPlant = async () => {
    try {
      const plantData = await plantService.getPlantById(plantId);
      if (plantData) {
        setPlant(plantData);
      } else {
        Alert.alert('Error', 'Tanaman tidak ditemukan');
        router.push('/(tabs)/ditanam');
      }
    } catch (error) {
      console.error('Error loading plant:', error);
      Alert.alert('Error', 'Gagal memuat data tanaman');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (plant && plant.id) {
      router.push(`/edit-plant/${plant.id}`);
    }
  };

  const handleClose = () => {
    router.push('/(tabs)/ditanam');
  };

  const handleHarvest = () => {
    if (!plant) return;
    
    // Show harvest modal popup
    setShowHarvestModal(true);
  };

  // Calculate harvest duration from dates
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
      
      if (diffMonths <= 1) {
        return '1 Bulan';
      } else if (diffMonths <= 2) {
        return '1 - 2 Bulan';
      } else if (diffMonths <= 3) {
        return '2 - 3 Bulan';
      } else if (diffMonths <= 4) {
        return '3 - 4 Bulan';
      } else if (diffMonths <= 5) {
        return '4 - 5 Bulan';
      } else {
        return `${diffMonths - 1} - ${diffMonths} Bulan`;
      }
    } catch {
      return plant?.harvestDuration || '4 - 5 Bulan';
    }
  };

  // Mock environmental conditions data
  const environmentalConditions = [
    { month: 'Bulan 1', status: 'warning', statusText: 'Terdapat peringatan', rain: '202', temp: '28°C', humidity: '80' },
    { month: 'Bulan 2', status: 'suitable', statusText: 'Sesuai', rain: '202', temp: '28°C', humidity: '80' },
    { month: 'Bulan 3', status: 'not-suitable', statusText: 'Tidak Sesuai', rain: '202', temp: '28°C', humidity: '80' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'suitable': return Colors.success;
      case 'warning': return Colors.warning;
      case 'not-suitable': return Colors.danger;
      default: return Colors.textLight;
    }
  };

  if (loading) {
    return (
      <Modal visible={true} animationType="slide">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat data tanaman...</Text>
        </View>
      </Modal>
    );
  }

  if (!plant) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      presentationStyle="fullScreen"
      visible={true}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header with Image Overlay */}
        <View style={styles.headerImageContainer}>
          <Image 
            source={{ uri: plant.image }} 
            style={styles.headerImage}
            onError={() => setImageError(true)}
          />
          <View style={styles.imageOverlay} />
          
          {/* Back Button */}
          <TouchableOpacity 
            onPress={handleClose} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          
          {/* Plant Name */}
          <Text style={styles.headerTitle}>{plant.name}</Text>
          
          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{plant.progress || 90}</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Informasi Terkait */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Terkait</Text>
            
            {/* Detail Tanaman */}
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={Colors.textLight} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Detail Tanaman</Text>
                <Text style={styles.infoValue}>{plant.name}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            {/* Lokasi */}
            <TouchableOpacity style={styles.infoRow} activeOpacity={0.7}>
              <Ionicons name="location-outline" size={20} color={Colors.textLight} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Lokasi Anda</Text>
                <Text style={styles.infoSubLabel}>(Klik untuk pindah lokasi)</Text>
                <Text style={styles.infoValue}>
                  {plant.location || 'Cikole, Kota Sukabumi, Indonesia'}
                </Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            {/* Durasi Panen */}
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={Colors.textLight} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Durasi Panen</Text>
                <Text style={styles.infoValue}>
                  {calculateHarvestDuration()}
                </Text>
              </View>
            </View>
            
            {/* Progress Badge */}
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="stats-chart-outline" size={20} color={Colors.textLight} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Progress</Text>
                <Text style={styles.infoValue}>
                  {plant.progress}% - {plant.daysLeft > 0 ? `${plant.daysLeft} hari lagi` : 'Siap Panen'}
                </Text>
              </View>
            </View>
          </View>

          {/* Kondisi Lingkungan Anda */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Kondisi Lingkungan Anda</Text>
              <TouchableOpacity 
                onPress={() => setShowInfoModal(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="information-circle-outline" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
            
            {environmentalConditions.map((condition, index) => (
              <View key={index}>
                <View style={styles.environmentRow}>
                  <View style={styles.environmentLeft}>
                    <Text style={styles.environmentMonth}>{condition.month}</Text>
                    <Text style={[
                      styles.environmentStatus,
                      { color: getStatusColor(condition.status) }
                    ]}>
                      {condition.statusText}
                    </Text>
                  </View>
                  <View style={styles.environmentRight}>
                    <View style={styles.environmentMetric}>
                      <Ionicons 
                        name="rainy-outline" 
                        size={16} 
                        color={getStatusColor(condition.status)} 
                      />
                      <Text style={styles.environmentValue}>{condition.rain}</Text>
                    </View>
                    <View style={styles.environmentMetric}>
                      <Ionicons 
                        name="thermometer-outline" 
                        size={16} 
                        color={getStatusColor(condition.status)} 
                      />
                      <Text style={styles.environmentValue}>{condition.temp}</Text>
                    </View>
                    <View style={styles.environmentMetric}>
                      <Ionicons 
                        name="water-outline" 
                        size={16} 
                        color={getStatusColor(condition.status)} 
                      />
                      <Text style={styles.environmentValue}>{condition.humidity}</Text>
                    </View>
                  </View>
                </View>
                {index < environmentalConditions.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
          
          {/* Spacing for button */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Harvest Button */}
        <TouchableOpacity 
          style={styles.harvestButton}
          onPress={handleHarvest}
          activeOpacity={0.8}
        >
          <Ionicons name="leaf" size={20} color={Colors.white} />
          <Text style={styles.harvestButtonText}>Panen</Text>
        </TouchableOpacity>

        {/* Info Modal */}
        {showInfoModal && (
          <Modal
            transparent={true}
            visible={showInfoModal}
            animationType="fade"
            onRequestClose={() => setShowInfoModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Bagaimana Kami Mendapatkan Data Kondisi Lingkungan Anda?
                </Text>
                <Text style={styles.modalText}>
                  Data didapatkan dengan mengambil rata-rata pada setiap bulan.
                </Text>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => setShowInfoModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>Tutup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Harvest Modal */}
        {showHarvestModal && (
          <Modal
            transparent={true}
            visible={showHarvestModal}
            animationType="fade"
            onRequestClose={() => setShowHarvestModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Bagaimana Kami Mendapatkan Data Kondisi Lingkungan Anda?
                </Text>
                <Text style={styles.modalText}>
                  Data didapatkan dengan mengambil rata-rata pada setiap bulan.
                </Text>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => setShowHarvestModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>Tutup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerImageContainer: {
    width: '100%',
    height: 300,
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  headerTitle: {
    position: 'absolute',
    top: 50,
    left: 50,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    zIndex: 10,
  },
  badge: {
    position: 'absolute',
    bottom: -20,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  section: {
    padding: 20,
    backgroundColor: Colors.white,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  infoSubLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  environmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  environmentLeft: {
    flex: 1,
  },
  environmentMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  environmentStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  environmentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  environmentMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  environmentValue: {
    fontSize: 12,
    color: Colors.text,
  },
  bottomSpacing: {
    height: 100,
  },
  harvestButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.harvest,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  harvestButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
