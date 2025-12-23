import { Colors } from '@/constants/Colors';
import { useNotification } from '@/contexts/NotificationContext';
import { plantService } from '@/services/plantService';
import { getCurrentWeather } from '@/services/weatherService'; 
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Helper Functions ---
const formatDateToIndonesian = (date: Date) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatDateForInput = (date: Date) => {
  if (!date || isNaN(date.getTime())) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateFromInput = (dateString: string) => {
  if (!dateString) return new Date();
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  } catch (error) {
    return new Date();
  }
};

const calculateHarvestDateByDays = (plantedDate: Date, days: number) => {
  const harvestDate = new Date(plantedDate);
  harvestDate.setDate(harvestDate.getDate() + days);
  return harvestDate;
};

const isValidDate = (date: Date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

export default function AddPlantScreen() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);
  
  const [showPlantedDatePicker, setShowPlantedDatePicker] = useState(false);
  
  // Validation Modal State
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState({ title: '', message: '' });
  
  const handleBack = () => {
    router.back();
  };
  
  const [form, setForm] = useState({
    name: '',
    type: '',
    plantedDate: new Date(),
    harvestDate: new Date(),
    location: '',
    area: '',
    weather: '',
    weatherLabel: '',
    harvestDurationDays: 90,
    harvestDurationText: '',
    fertilizer: '',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
  });

  // --- AUTOMATION LOGIC ---
  useEffect(() => {
    const detectLocationAndWeather = async () => {
      setIsDetecting(true);
      try {
        const weatherData = await getCurrentWeather();
        
        const estimatedHarvestDate = calculateHarvestDateByDays(
          form.plantedDate, 
          weatherData.harvestDurationDays
        );

        setForm(prev => ({
          ...prev,
          location: weatherData.location,
          weather: weatherData.condition,
          weatherLabel: weatherData.label,
          harvestDurationDays: weatherData.harvestDurationDays,
          harvestDurationText: weatherData.harvestDurationText,
          harvestDate: estimatedHarvestDate
        }));

      } catch (error) {
        console.error('Gagal deteksi otomatis:', error);
        showNotification('Gagal mendeteksi lokasi. Cek GPS Anda.', 'error');
        setForm(prev => ({ ...prev, location: 'Gagal mendeteksi lokasi' }));
      } finally {
        setIsDetecting(false);
      }
    };

    detectLocationAndWeather();
  }, []);

  const handlePlantedDateChange = (selectedDate: Date) => {
    if (!isValidDate(selectedDate)) return;
    const newHarvestDate = calculateHarvestDateByDays(selectedDate, form.harvestDurationDays);
    setForm({
      ...form,
      plantedDate: selectedDate,
      harvestDate: newHarvestDate
    });
    setShowPlantedDatePicker(false);
  };

  const handleWebDateChange = (field: 'plantedDate', value: string) => {
    const newDate = parseDateFromInput(value);
    if (!isValidDate(newDate)) return;
    const newHarvestDate = calculateHarvestDateByDays(newDate, form.harvestDurationDays);
    setForm({
      ...form,
      plantedDate: newDate,
      harvestDate: newHarvestDate
    });
  };

  const handleAreaChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    const parts = cleanedText.split('.');
    if (parts.length > 2) return;
    setForm({ ...form, area: cleanedText });
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showNotification('Aplikasi memerlukan akses galeri foto.', 'error');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setForm({ ...form, image: result.assets[0].uri });
      }
    } catch (error) {
      showNotification('Gagal memilih foto.', 'error');
    }
  };

  const handleAddPlant = async () => {
    // 1. Validasi Nama
    if (!form.name || form.name.trim().length < 3) {
      setValidationMessage({
        title: 'Nama Terlalu Pendek',
        message: 'Nama jenis tanaman harus memiliki minimal 3 karakter agar mudah dikenali.'
      });
      setShowValidationModal(true);
      return;
    }

    // 2. Validasi Luas Lahan (REQUIRED)
    if (!form.area || isNaN(parseFloat(form.area)) || parseFloat(form.area) <= 0) {
      setValidationMessage({
        title: 'Luas Lahan Wajib Diisi',
        message: 'Harap isi luas lahan (hektar) dengan angka yang valid. Data ini penting untuk estimasi hasil panen.'
      });
      setShowValidationModal(true);
      return;
    }

    // 3. Validasi Lokasi & Cuaca
    if (!form.location || !form.weather) {
       setValidationMessage({
        title: 'Data Belum Lengkap',
        message: 'Mohon tunggu sebentar hingga lokasi dan cuaca berhasil dideteksi otomatis.'
      });
      setShowValidationModal(true);
      return;
    }

    setLoading(true);

    try {
      const newPlant = {
        name: form.name.trim(),
        type: form.type || form.name.trim(),
        plantedDate: form.plantedDate.toISOString().split('T')[0],
        harvestDate: form.harvestDate.toISOString().split('T')[0],
        image: form.image,
        location: form.location,
        area: form.area ? parseFloat(form.area) : null,
        weather: form.weather,
        weatherLabel: form.weatherLabel,
        weatherNotes: '',
        fertilizer: form.fertilizer || '',
        care: {
          water: '1 kali sehari',
          sun: '6-8 jam/hari',
          soil: 'Tanah gembur',
          fertilizer: form.fertilizer || 'Pupuk organik mingguan'
        },
        progress: 10,
        status: 'growing' as const,
        harvestDuration: form.harvestDurationText,
      };

      await plantService.createPlant(newPlant);
      showNotification(`Tanaman ${form.name} berhasil ditambahkan!`, 'success');
      router.back();

    } catch (error) {
      console.error('Error creating plant:', error);
      showNotification('Gagal menambahkan tanaman.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (weather: string) => {
    const iconMap: any = {
      'cerah': 'sunny', 'berawan': 'partly-sunny', 'hujan': 'rainy', 'panas': 'thermometer', 'dingin': 'snow'
    };
    return iconMap[weather] || 'partly-sunny';
  };

  // Custom Date Picker Component
  const CustomDatePicker = ({ visible, onClose, selectedDate, onDateChange, title }: any) => {
    const [currentDate, setCurrentDate] = useState(selectedDate);
    const getCalendarDays = (date: Date) => {
       if (!isValidDate(date)) date = new Date();
       const year = date.getFullYear();
       const month = date.getMonth();
       const firstDay = new Date(year, month, 1);
       const lastDay = new Date(year, month + 1, 0);
       const days = [];
       for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
       for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
       return days;
    };

    if (!visible) return null;
    return (
      <Modal transparent={true} animationType="slide" visible={visible} onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
               <View style={styles.datePickerContainer}>
                <LinearGradient
                  colors={['#2E7D32', '#4CAF50']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.datePickerHeader}
                >
                  <Text style={styles.datePickerTitle}>{title}</Text>
                </LinearGradient>
                 
                <View style={styles.dateControls}>
                  <TouchableOpacity style={styles.dateControlButton} onPress={() => {const d = new Date(currentDate); d.setMonth(d.getMonth()-1); setCurrentDate(d);}}>
                    <Ionicons name="chevron-back" size={24} color="#2E7D32" />
                  </TouchableOpacity>
                  <Text style={styles.monthYearText}>{currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</Text>
                  <TouchableOpacity style={styles.dateControlButton} onPress={() => {const d = new Date(currentDate); d.setMonth(d.getMonth()+1); setCurrentDate(d);}}>
                    <Ionicons name="chevron-forward" size={24} color="#2E7D32" />
                  </TouchableOpacity>
                </View>

                <View style={styles.dateGrid}>
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                    <Text key={day} style={styles.weekDayLabel}>{day}</Text>
                  ))}
                  {getCalendarDays(currentDate).map((date: any, index: number) => (
                    <TouchableOpacity 
                      key={index} 
                      style={[
                        styles.dateCell, 
                        date && date.toDateString() === selectedDate.toDateString() && styles.dateCellSelected
                      ]} 
                      onPress={() => date && onDateChange(date)} 
                      disabled={!date}
                    >
                      <Text style={[
                        styles.dateCellText, 
                        date && date.toDateString() === selectedDate.toDateString() && styles.dateCellTextSelected
                      ]}>
                        {date ? date.getDate() : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.datePickerButtons}>
                  <TouchableOpacity style={styles.datePickerCancelButton} onPress={onClose}>
                    <Text style={styles.datePickerCancelButtonText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.datePickerConfirmButton} onPress={() => { onDateChange(currentDate); onClose(); }}>
                    <LinearGradient
                      colors={['#4CAF50', '#2E7D32']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.datePickerConfirmButtonGradient}
                    >
                      <Text style={styles.datePickerConfirmButtonText}>Pilih Tanggal</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
               </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

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
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
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
            {/* Image Section */}
            <View style={styles.imageSection}>
              <Text style={styles.sectionLabel}>Foto Tanaman</Text>
              <TouchableOpacity style={styles.imagePreviewContainer} onPress={handlePickImage}>
                {form.image ? (
                  <Image source={{ uri: form.image }} style={styles.imagePreview} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={48} color="#81C784" />
                    <Text style={styles.imagePlaceholderText}>Tambahkan Foto</Text>
                    <Text style={styles.imagePlaceholderSubtext}>Ketuk untuk memilih dari galeri</Text>
                  </View>
                )}
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Form Section */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Informasi Tanaman</Text>
              
              {/* Jenis Tanaman */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Jenis Tanaman</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="leaf-outline" size={20} color="#2E7D32" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Padi, Jagung, Tomat"
                    placeholderTextColor="#81C784"
                    value={form.name}
                    onChangeText={(text) => setForm({...form, name: text})}
                  />
                </View>
              </View>

              {/* Tanggal Tanam */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tanggal Tanam</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.inputContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#2E7D32" style={styles.inputIcon} />
                    <input
                      type="date"
                      value={formatDateForInput(form.plantedDate)}
                      onChange={(e) => handleWebDateChange('plantedDate', e.target.value)}
                      style={styles.webDateInput}
                    />
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.dateInputContainer} 
                    onPress={() => setShowPlantedDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#2E7D32" style={styles.inputIcon} />
                    <Text style={styles.dateInputText}>{formatDateToIndonesian(form.plantedDate)}</Text>
                    <Ionicons name="chevron-down" size={18} color="#2E7D32" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Luas Lahan */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Luas Lahan (Hektar)</Text>
                  <Text style={styles.requiredLabel}>* Wajib diisi</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="resize-outline" size={20} color="#2E7D32" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#81C784"
                    value={form.area}
                    onChangeText={handleAreaChange}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.areaUnit}>Ha</Text>
                </View>
              </View>
            </View>

            {/* Automated Info Section */}
            <View style={styles.autoSectionCard}>
              <View style={styles.autoSectionHeader}>
                <Ionicons name="cloud-circle-outline" size={24} color="#2E7D32" />
                <Text style={styles.autoSectionTitle}>Informasi Otomatis</Text>
              </View>
              
              {isDetecting ? (
                <View style={styles.detectingContainer}>
                  <ActivityIndicator size="large" color="#2E7D32" />
                  <Text style={styles.detectingText}>Mendeteksi lokasi & cuaca...</Text>
                  <Text style={styles.detectingSubtext}>Mohon tunggu sebentar</Text>
                </View>
              ) : (
                <>
                  {/* Lokasi */}
                  <View style={styles.autoInfoRow}>
                    <View style={styles.autoInfoIconContainer}>
                      <Ionicons name="location" size={18} color="#2E7D32" />
                    </View>
                    <View style={styles.autoInfoContent}>
                      <Text style={styles.autoInfoLabel}>Lokasi Terdeteksi</Text>
                      <Text style={styles.autoInfoValue}>{form.location}</Text>
                    </View>
                  </View>

                  {/* Cuaca */}
                  <View style={styles.autoInfoRow}>
                    <View style={styles.autoInfoIconContainer}>
                      <Ionicons name={getWeatherIcon(form.weather) as any} size={18} color="#2E7D32" />
                    </View>
                    <View style={styles.autoInfoContent}>
                      <Text style={styles.autoInfoLabel}>Kondisi Cuaca Saat Ini</Text>
                      <Text style={styles.autoInfoValue}>{form.weatherLabel}</Text>
                    </View>
                  </View>

                  {/* Estimasi Panen */}
                  <View style={styles.autoInfoRow}>
                    <View style={styles.autoInfoIconContainer}>
                      <Ionicons name="time-outline" size={18} color="#2E7D32" />
                    </View>
                    <View style={styles.autoInfoContent}>
                      <Text style={styles.autoInfoLabel}>Estimasi Waktu Panen</Text>
                      <Text style={styles.autoInfoValue}>{formatDateToIndonesian(form.harvestDate)}</Text>
                      <Text style={styles.autoInfoNote}>
                        Durasi: {form.harvestDurationText} (Cuaca {form.weatherLabel})
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Catatan Tambahan */}
            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Ionicons name="document-text-outline" size={24} color="#2E7D32" />
                <Text style={styles.notesTitle}>Catatan Tambahan</Text>
              </View>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Catat informasi penting seperti jenis pupuk, perawatan khusus, atau hal lain yang perlu diingat..."
                  placeholderTextColor="#81C784"
                  value={form.fertilizer}
                  onChangeText={(text) => setForm({...form, fertilizer: text})}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity 
              style={[styles.saveButton, (loading || isDetecting) && styles.saveButtonDisabled]} 
              onPress={handleAddPlant} 
              disabled={loading || isDetecting} 
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.saveButtonContent}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>
                      {isDetecting ? 'Menunggu...' : 'Simpan Tanaman'}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Date Picker Modal */}
        {Platform.OS !== 'web' && (
          <CustomDatePicker 
            visible={showPlantedDatePicker} 
            onClose={() => setShowPlantedDatePicker(false)} 
            selectedDate={form.plantedDate} 
            onDateChange={handlePlantedDateChange} 
            title="Pilih Tanggal Tanam" 
          />
        )}

        {/* Validation Modal */}
        <Modal
          transparent={true}
          animationType="fade"
          visible={showValidationModal}
          onRequestClose={() => setShowValidationModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowValidationModal(false)}>
            <View style={styles.validationModalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.validationModalContent}>
                  <View style={styles.validationIconContainer}>
                    <Ionicons name="alert-circle" size={48} color="#FF9800" />
                  </View>
                  <Text style={styles.validationModalTitle}>{validationMessage.title}</Text>
                  <Text style={styles.validationModalText}>
                    {validationMessage.message}
                  </Text>
                  <TouchableOpacity 
                    style={styles.validationModalButton} 
                    onPress={() => setShowValidationModal(false)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#4CAF50', '#2E7D32']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.validationModalButtonGradient}
                    >
                      <Text style={styles.validationModalButtonText}>Mengerti</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
  imageSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 12,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePlaceholderSubtext: {
    marginTop: 4,
    color: '#81C784',
    fontSize: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 125, 50, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
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
  areaUnit: {
    position: 'absolute',
    right: 16,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  dateInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingLeft: 42,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateInputText: {
    fontSize: 15,
    color: '#1B5E20',
    flex: 1,
  },
  webDateInput: {
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
    outline: 'none',
    fontFamily: 'System',
  },
  autoSectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  autoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  autoSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  detectingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  detectingSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#81C784',
  },
  autoInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 230, 201, 0.5)',
  },
  autoInfoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  autoInfoContent: {
    flex: 1,
  },
  autoInfoLabel: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 2,
  },
  autoInfoValue: {
    fontSize: 15,
    color: '#1B5E20',
    fontWeight: '600',
  },
  autoInfoNote: {
    fontSize: 12,
    color: '#81C784',
    marginTop: 4,
    fontStyle: 'italic',
  },
  notesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
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
    minHeight: 100,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  datePickerHeader: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dateControlButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  weekDayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
    paddingVertical: 8,
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateCellSelected: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
  },
  dateCellText: {
    fontSize: 16,
    color: '#1B5E20',
    fontWeight: '500',
  },
  dateCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  datePickerButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  datePickerCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(200, 230, 201, 0.5)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  datePickerCancelButtonText: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
  datePickerConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  datePickerConfirmButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  datePickerConfirmButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  validationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  validationModalContent: {
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
  validationIconContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 16,
    borderRadius: 50,
  },
  validationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 12,
    textAlign: 'center',
  },
  validationModalText: {
    fontSize: 15,
    color: '#2E7D32',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  validationModalButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  validationModalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  validationModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});