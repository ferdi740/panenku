import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotification } from '@/contexts/NotificationContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { plantService } from '@/services/plantService';
import { harvestService } from '@/services/harvestService';

export default function HarvestPlantScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [plant, setPlant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const plantId = typeof params.id === 'string' ? params.id : 
                  Array.isArray(params.id) ? params.id[0] : 
                  (params as any).id;

  const [form, setForm] = useState({
    plantName: '',
    plantedDate: '',
    harvestDate: new Date().toISOString().split('T')[0],
    quantity: '',
    notes: '',
  });

  const loadPlant = React.useCallback(async () => {
    try {
      const plantData = await plantService.getPlantById(plantId);
      if (plantData) {
        setPlant(plantData);
        setForm({
          plantName: plantData.name,
          plantedDate: plantData.plantedDate,
          harvestDate: new Date().toISOString().split('T')[0],
          quantity: '',
          notes: '',
        });
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

  useEffect(() => {
    if (plantId && plantId !== 'undefined') {
      loadPlant();
    } else {
      showNotification('ID tanaman tidak valid.', 'error');
      router.back();
    }
  }, [plantId, loadPlant, router, showNotification]);

  const handleBack = () => {
    router.back();
  };

  const handleSaveHarvest = async () => {
    if (!form.quantity || isNaN(parseFloat(form.quantity))) {
      showNotification('Harap isi Total Hasil Panen dengan angka yang valid!', 'error');
      return;
    }

    setSaving(true);

    try {
      const quantity = parseFloat(form.quantity);
      
      await harvestService.harvestPlant(
        plantId,
        quantity,
        'Kg',
        form.notes || undefined,
        plant.location
      );

      showNotification('Panen berhasil dicatat!', 'success');
      setShowFeedbackModal(true);
    } catch (error) {
      console.error('Error saving harvest:', error);
      showNotification('Gagal mencatat panen. Coba lagi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateString;
    }
  };

  // Fungsi untuk mendapatkan teks rating berdasarkan jumlah bintang
  const getRatingText = () => {
    if (rating === 0) {
      return 'Pilih rating';
    } else if (rating === 1) {
      return 'Kurang memuaskan';
    } else if (rating === 2) {
      return 'Cukup memuaskan';
    } else if (rating === 3) {
      return 'Memuaskan';
    } else if (rating === 4) {
      return 'Sangat memuaskan';
    } else if (rating === 5) {
      return 'Luar biasa!';
    } else {
      return '';
    }
  };

  // Fungsi untuk mendapatkan warna rating berdasarkan jumlah bintang
  const getRatingColor = () => {
    if (rating === 0) {
      return '#C8E6C9';
    } else if (rating === 1) {
      return '#F44336'; // Merah untuk rating rendah
    } else if (rating === 2) {
      return '#FF9800'; // Oranye
    } else if (rating === 3) {
      return '#FFC107'; // Kuning
    } else if (rating === 4) {
      return '#4CAF50'; // Hijau muda
    } else if (rating === 5) {
      return '#2E7D32'; // Hijau tua
    } else {
      return '#FF9800';
    }
  };

  // Fungsi untuk mengirim feedback
  const handleSubmitFeedback = () => {
    // Log feedback untuk debugging
    console.log('Rating:', rating, 'Feedback:', feedback);
    
    // Tampilkan pesan yang sesuai dengan rating
    let notificationMessage = 'Terima kasih atas ulasan Anda!';
    if (rating === 1) {
      notificationMessage = 'Terima kasih atas masukan Anda. Kami akan berusaha lebih baik.';
    } else if (rating === 2 || rating === 3) {
      notificationMessage = 'Terima kasih atas ulasan Anda!';
    } else if (rating === 4 || rating === 5) {
      notificationMessage = 'Terima kasih atas ulasan yang luar biasa!';
    }
    
    // Tampilkan notifikasi
    showNotification(notificationMessage, 'success');
    
    // Reset dan tutup modal
    setShowFeedbackModal(false);
    setRating(0);
    setFeedback('');
    
    // Kembali ke halaman sebelumnya
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#E8F5E9', '#C8E6C9', '#A5D6A7'] as [string, string, string]}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingContent}>
            <Ionicons name="leaf-outline" size={64} color="#2E7D32" />
            <ActivityIndicator size="large" color="#2E7D32" style={{marginVertical: 20}} />
            <Text style={styles.loadingText}>Memuat data panen...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!plant) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#C8E6C9', '#A5D6A7'] as [string, string, string]}
        style={styles.backgroundGradient}
      >
        
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                onPress={handleBack} 
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#1B5E20" />
              </TouchableOpacity>
              <View style={styles.placeholder} />
            </View>
          </View>
        </SafeAreaView>

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {/* Header Card */}
            <View style={styles.headerCard}>
              <LinearGradient
                colors={['#4CAF50', '#2E7D32'] as [string, string]}
                style={styles.headerCardGradient}
              >
                <Ionicons name="basket" size={48} color="#FFFFFF" />
                <Text style={styles.headerCardTitle}>Selamat Panen!</Text>
                <Text style={styles.headerCardSubtitle}>
                  Catat hasil panen {plant.name} Anda
                </Text>
              </LinearGradient>
            </View>

            {/* Form Section */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Detail Panen</Text>
              
              {/* Jenis Tanaman */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Jenis Tanaman</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="leaf-outline" size={20} color="#2E7D32" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={form.plantName}
                    editable={false}
                    placeholderTextColor="#81C784"
                  />
                </View>
              </View>

              {/* Tanggal Tanam */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tanggal Tanam</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#2E7D32" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formatDate(form.plantedDate)}
                    editable={false}
                    placeholderTextColor="#81C784"
                  />
                </View>
              </View>

              {/* Tanggal Panen */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tanggal Panen</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar" size={20} color="#2E7D32" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formatDate(form.harvestDate)}
                    editable={false}
                    placeholderTextColor="#81C784"
                  />
                </View>
              </View>

              {/* Total Hasil Panen */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Total Hasil Panen</Text>
                  <Text style={styles.requiredLabel}>* Wajib diisi</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="scale-outline" size={20} color="#2E7D32" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0.0"
                    placeholderTextColor="#81C784"
                    value={form.quantity}
                    onChangeText={(text) => setForm({...form, quantity: text.replace(/[^0-9.]/g, '')})}
                    keyboardType="numeric"
                  />
                  <Text style={styles.quantityUnit}>Kg</Text>
                </View>
              </View>

              {/* Catatan Tambahan */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Catatan Tambahan</Text>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Catat informasi pupuk, perawatan, atau hal lain..."
                    placeholderTextColor="#81C784"
                    value={form.notes}
                    onChangeText={(text) => setForm({...form, notes: text})}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={handleSaveHarvest}
              disabled={saving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4CAF50', '#2E7D32'] as [string, string]}
                style={styles.saveButtonGradient}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.saveButtonContent}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Simpan Catatan Panen</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Feedback Modal */}
      <Modal
        transparent={true}
        visible={showFeedbackModal}
        animationType="fade"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="star" size={48} color="#FF9800" />
            </View>
            
            <Text style={styles.modalTitle}>Bagaimana Hasil Panen Anda?</Text>
            <Text style={styles.modalSubtitle}>
              Berikan ulasan untuk pengalaman panen Anda
            </Text>
            
            {/* Rating Stars */}
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? getRatingColor() : '#C8E6C9'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Teks Rating yang Disesuaikan */}
            <Text style={[styles.ratingText, { color: getRatingColor() }]}>
              {getRatingText()}
            </Text>

            {/* Feedback Input */}
            <View style={styles.feedbackInputContainer}>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Bagikan pengalaman panen Anda..."
                placeholderTextColor="#81C784"
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  setShowFeedbackModal(false);
                  setRating(0);
                  setFeedback('');
                  router.back();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Lewati</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitFeedback}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32'] as [string, string]}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Kirim Ulasan</Text>
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
  header: {
    backgroundColor: 'transparent',
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  headerCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  headerCardGradient: {
    padding: 28,
    alignItems: 'center',
  },
  headerCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  headerCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formCard: {
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
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 8,
  },
  requiredLabel: {
    fontSize: 11,
    color: '#F44336',
    fontStyle: 'italic',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingLeft: 42,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1B5E20',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityUnit: {
    position: 'absolute',
    right: 16,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    fontSize: 14,
    color: '#1B5E20',
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    paddingVertical: 18,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 40,
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
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalIconContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 16,
    borderRadius: 50,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  feedbackInputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  feedbackInput: {
    backgroundColor: 'rgba(200, 230, 201, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1B5E20',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  skipButton: {
    flex: 1,
    backgroundColor: 'rgba(200, 230, 201, 0.5)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});