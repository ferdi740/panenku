import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { plantService } from '@/services/plantService';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [plant, setPlant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);

  // Extract plant ID
  const plantId = typeof id === 'string' ? id : 
                 Array.isArray(id) ? id[0] : 
                 (id as any);

  // ✅ DEBUG: Log routing parameters
  console.log('🔄 PLANT DETAIL - Route params:', { id });
  console.log('🔄 PLANT DETAIL - Full URL:', `/plant-detail/${id}`);

  useEffect(() => {
    console.log('🎯 PLANT DETAIL - Component mounted, loading plant...');
    loadPlant();
  }, [id]);

  const loadPlant = async () => {
    try {
      console.log('📡 PLANT DETAIL - Loading plant with ID:', id);
      const plantData = await plantService.getPlantById(id as string);
      
      if (plantData) {
        console.log('✅ PLANT DETAIL - Plant loaded successfully:', plantData.name);
        setPlant(plantData);
        setImageError(false); // Reset error state when loading new plant
      } else {
        console.log('❌ PLANT DETAIL - Plant not found');
        Alert.alert('Error', 'Tanaman tidak ditemukan');
        router.back();
      }
    } catch (error) {
      console.error('❌ PLANT DETAIL - Error loading plant:', error);
      Alert.alert('Error', 'Gagal memuat data tanaman');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/edit-plant/${plantId}`);
  };

  const handleDeletePlant = () => {
    if (!plant || !plantId) {
      Alert.alert('Error', 'Data tanaman tidak tersedia');
      return;
    }

    Alert.alert(
      'Hapus Tanaman',
      `Apakah Anda yakin ingin menghapus ${plant.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: deletePlant
        }
      ]
    );
  };

  const deletePlant = async () => {
    if (!plantId || plantId === 'undefined') {
      Alert.alert('Error', 'ID tanaman tidak valid');
      return;
    }

    try {
      console.log('🗑️ PLANT DETAIL - Deleting plant with ID:', plantId);
      const success = await plantService.deletePlant(plantId);
      
      if (success) {
        console.log('✅ PLANT DETAIL - Plant deleted successfully');
        Alert.alert(
          'Berhasil!', 
          'Tanaman berhasil dihapus!',
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/(tabs)/ditanam')
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Gagal menghapus tanaman');
      }
    } catch (error) {
      console.error('❌ PLANT DETAIL - Error deleting plant:', error);
      Alert.alert('Error', 'Gagal menghapus tanaman. Coba lagi.');
    }
  };

  const handleHarvest = () => {
    if (!plant) return;
    
    // Show harvest modal popup
    setShowHarvestModal(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Tanaman</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat data tanaman...</Text>
        </View>
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Tanaman</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.textLight} />
          <Text style={styles.errorText}>Tanaman tidak ditemukan</Text>
          <TouchableOpacity 
            style={styles.backButtonPrimary}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Tanaman</Text>
        <TouchableOpacity 
          onPress={handleEdit} 
          style={styles.editButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!imageError && plant.image ? (
          <Image 
            source={{ uri: plant.image }} 
            style={styles.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.fallbackImageContainer}>
            <Ionicons name="image-outline" size={64} color={Colors.textLight} />
            <Text style={styles.fallbackImageText}>Gambar tidak tersedia</Text>
          </View>
        )}
        
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{plant.name}</Text>
            <Text style={styles.subtitle}>{plant.daysLeft} hari lagi panen</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Progress Tumbuh</Text>
              <Text style={styles.progressPercent}>{plant.progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${plant.progress}%` }
                ]} 
              />
            </View>
          </View>

          {/* Plant Info */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Informasi Tanaman</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons name="leaf-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>Jenis</Text>
                <Text style={styles.infoValue}>{plant.type}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>Ditanam</Text>
                <Text style={styles.infoValue}>{plant.plantedDate}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>Panen</Text>
                <Text style={styles.infoValue}>{plant.harvestDate}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="stats-chart-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>
                  {plant.status === 'growing' ? 'Sedang Tumbuh' : 'Sudah Panen'}
                </Text>
              </View>
            </View>
          </View>

          {/* Care Instructions */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Perawatan</Text>
            <View style={styles.careList}>
              <View style={styles.careItem}>
                <Ionicons name="water-outline" size={20} color={Colors.primary} />
                <Text style={styles.careText}>Penyiraman: {plant.care.water}</Text>
              </View>
              <View style={styles.careItem}>
                <Ionicons name="sunny-outline" size={20} color={Colors.primary} />
                <Text style={styles.careText}>Sinar Matahari: {plant.care.sun}</Text>
              </View>
              <View style={styles.careItem}>
                <Ionicons name="earth-outline" size={20} color={Colors.primary} />
                <Text style={styles.careText}>Tanah: {plant.care.soil}</Text>
              </View>
              <View style={styles.careItem}>
                <Ionicons name="nutrition-outline" size={20} color={Colors.primary} />
                <Text style={styles.careText}>Pupuk: {plant.care.fertilizer}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {plant.description && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Deskripsi</Text>
              <Text style={styles.descriptionText}>{plant.description}</Text>
            </View>
          )}

          {/* Action Buttons */}
          {plant.status === 'growing' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.secondaryButton}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={20} color={Colors.primary} />
                <Text style={styles.secondaryButtonText}>Update Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleHarvest}
                activeOpacity={0.8}
              >
                <Ionicons name="basket-outline" size={20} color={Colors.white} />
                <Text style={styles.primaryButtonText}>Tandai Panen</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Bottom spacing for fixed button */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Harvest Button - Fixed Position */}
      <TouchableOpacity 
        style={styles.harvestButton}
        onPress={handleHarvest}
        activeOpacity={0.8}
      >
        <Ionicons name="leaf" size={20} color={Colors.white} />
        <Text style={styles.harvestButtonText}>Panen</Text>
      </TouchableOpacity>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 4,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  image: {
    width: '100%',
    height: 300,
  },
  fallbackImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackImageText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
  },
  content: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.primary,
    marginTop: 4,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.text,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  careList: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 16,
  },
  careItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  careText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  backButtonPrimary: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
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