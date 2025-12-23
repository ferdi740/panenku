import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  
  // State Modals
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract plant ID
  const plantId = typeof id === 'string' ? id : 
                  Array.isArray(id) ? id[0] : 
                  (id as any);

  const loadPlant = useCallback(async () => {
    try {
      console.log('📡 PLANT DETAIL - Loading plant with ID:', id);
      const plantData = await plantService.getPlantById(id as string);
      
      if (plantData) {
        setPlant(plantData);
        setImageError(false);
      } else {
        Alert.alert('Error', 'Tanaman tidak ditemukan');
        router.back();
      }
    } catch (error) {
      console.error('❌ PLANT DETAIL - Error loading plant:', error);
      Alert.alert('Error', 'Gagal memuat data tanaman');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadPlant();
  }, [id, loadPlant]);

  const handleEdit = () => {
    router.push(`/edit-plant/${plantId}`);
  };

  // 1. Trigger Modal Hapus
  const handleDeletePress = () => {
    if (!plant || !plantId) return;
    setShowDeleteModal(true);
  };

  // 2. Eksekusi Hapus
  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await plantService.deletePlant(plantId);
      
      if (success) {
        setShowDeleteModal(false);
        // Bisa ganti Alert ini dengan notifikasi custom jika ada context-nya
        Alert.alert('Berhasil', 'Tanaman berhasil dihapus', [
          { text: 'OK', onPress: () => router.push('/(tabs)/ditanam') }
        ]);
      } else {
        Alert.alert('Error', 'Gagal menghapus tanaman');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('❌ PLANT DETAIL - Error deleting plant:', error);
      Alert.alert('Error', 'Gagal menghapus tanaman. Coba lagi.');
      setIsDeleting(false);
    }
  };

  const handleHarvest = () => {
    if (!plant) return;
    setShowHarvestModal(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
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
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 3. Safe Area Wrapper dengan background warna Primary */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.primary }}>
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
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={handleEdit} 
              style={styles.editButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDeletePress} 
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

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
                <Text style={styles.careText}>Penyiraman: {plant.care?.water || '-'}</Text>
              </View>
              <View style={styles.careItem}>
                <Ionicons name="sunny-outline" size={20} color={Colors.primary} />
                <Text style={styles.careText}>Sinar Matahari: {plant.care?.sun || '-'}</Text>
              </View>
              <View style={styles.careItem}>
                <Ionicons name="earth-outline" size={20} color={Colors.primary} />
                <Text style={styles.careText}>Tanah: {plant.care?.soil || '-'}</Text>
              </View>
              <View style={styles.careItem}>
                <Ionicons name="nutrition-outline" size={20} color={Colors.primary} />
                <Text style={styles.careText}>Pupuk: {plant.care?.fertilizer || '-'}</Text>
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

      {/* --- CUSTOM DELETE MODAL --- */}
      <Modal
        transparent={true}
        visible={showDeleteModal}
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.deleteIconContainer}>
               <Ionicons name="trash-outline" size={48} color={Colors.danger} />
            </View>

            <Text style={styles.modalTitle}>Hapus Tanaman?</Text>
            <Text style={styles.modalTextCenter}>
              Apakah Anda yakin ingin menghapus <Text style={{fontWeight:'bold'}}>{plant.name}</Text>? 
              {"\n"}Data yang dihapus tidak dapat dikembalikan.
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Hapus</Text>
                )}
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
    // paddingTop dihapus karena sudah dihandle SafeAreaView
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
  // Modal Styles
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
    alignItems: 'center', // Center for delete modal
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
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
    width: '100%',
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Custom Delete Modal Specifics
  deleteIconContainer: {
    marginBottom: 16,
    backgroundColor: '#FEE2E2', // Light red
    padding: 16,
    borderRadius: 50,
  },
  modalTextCenter: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6', // Light gray
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});