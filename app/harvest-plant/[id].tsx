import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { plantService } from '@/services/plantService';
import { harvestService } from '@/services/harvestService';

export default function HarvestPlantScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
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
        setForm({
          plantName: plantData.name,
          plantedDate: plantData.plantedDate,
          harvestDate: new Date().toISOString().split('T')[0],
          quantity: '',
          notes: '',
        });
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

  const handleBack = () => {
    router.push('/(tabs)/ditanam');
  };

  const handleSaveHarvest = async () => {
    if (!form.quantity || isNaN(parseFloat(form.quantity))) {
      Alert.alert('Error', 'Harap isi Total Hasil Panen dengan angka yang valid!');
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

      // Show feedback modal after successful harvest
      setShowFeedbackModal(true);
    } catch (error) {
      console.error('Error saving harvest:', error);
      Alert.alert('Error', 'Gagal mencatat panen. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
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

  if (loading) {
    return (
      <View style={styles.container}>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenLabel}>detail tanaman</Text>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Catatan Panen</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form Fields */}
        <View style={styles.form}>
          {/* Jenis Tanaman */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jenis Tanaman</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="leaf-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={form.plantName}
                editable={false}
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          {/* Tanggal Tanam */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Tanam</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formatDate(form.plantedDate)}
                editable={false}
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          {/* Tanggal Panen */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Panen</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formatDate(form.harvestDate)}
                editable={false}
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          {/* Total Hasil Panen */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Total Hasil Panen</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Masukkan jumlah hasil panen"
                placeholderTextColor={Colors.textLight}
                value={form.quantity}
                onChangeText={(text) => setForm({...form, quantity: text.replace(/[^0-9.]/g, '')})}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Catat Pupuk & Lainnya */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Catat Pupuk & Lainnya</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="silahkan catat infomasi detailnya"
                placeholderTextColor={Colors.textLight}
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
          <Text style={styles.saveButtonText}>
            {saving ? 'Menyimpan...' : 'Simpan Catatan'}
          </Text>
        </TouchableOpacity>

        {/* Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        transparent={true}
        visible={showFeedbackModal}
        animationType="fade"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Bagaimana Pengalaman Panen Anda?
            </Text>
            <Text style={styles.modalSubtitle}>
              Berikan ulasan untuk membantu kami meningkatkan layanan
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
                    color={star <= rating ? Colors.warning : Colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Feedback Input */}
            <View style={styles.feedbackInputContainer}>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Tulis ulasan Anda (opsional)"
                placeholderTextColor={Colors.textLight}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowFeedbackModal(false);
                  setRating(0);
                  setFeedback('');
                  router.push('/(tabs)/ditanam');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonSecondaryText}>Lewati</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  // Save feedback (you can add this to a service later)
                  console.log('Rating:', rating, 'Feedback:', feedback);
                  setShowFeedbackModal(false);
                  setRating(0);
                  setFeedback('');
                  Alert.alert(
                    'Terima Kasih!',
                    'Ulasan Anda telah tersimpan.',
                    [
                      {
                        text: 'Lihat Hasil Panen',
                        onPress: () => router.push('/(tabs)/panen')
                      },
                      {
                        text: 'Kembali',
                        onPress: () => router.push('/(tabs)/ditanam')
                      }
                    ]
                  );
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonPrimaryText}>Kirim Ulasan</Text>
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
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  screenLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
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
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    paddingLeft: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.harvest,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 40,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  feedbackInputContainer: {
    marginBottom: 24,
  },
  feedbackInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonPrimaryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondaryText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

