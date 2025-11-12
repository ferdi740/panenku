// edit-plant/[id].tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { plantService } from '@/services/plantService';
import * as ImagePicker from 'expo-image-picker';

// Format date to Indonesian format
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

// Format date to YYYY-MM-DD for input[type="date"]
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

// Parse date from YYYY-MM-DD
const parseDateFromInput = (dateString: string) => {
  if (!dateString) return new Date();
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

// Calculate harvest date based on weather condition
const calculateHarvestDate = (plantedDate: Date, weatherCondition: string) => {
  const harvestDate = new Date(plantedDate);
  
  switch (weatherCondition) {
    case 'cerah':
      harvestDate.setDate(harvestDate.getDate() + 60);
      break;
    case 'hujan':
      harvestDate.setDate(harvestDate.getDate() + 135);
      break;
    case 'berawan':
      harvestDate.setDate(harvestDate.getDate() + 90);
      break;
    case 'panas':
      harvestDate.setDate(harvestDate.getDate() + 75);
      break;
    case 'dingin':
      harvestDate.setDate(harvestDate.getDate() + 150);
      break;
    default:
      harvestDate.setDate(harvestDate.getDate() + 90);
  }
  
  return harvestDate;
};

// Get harvest duration text based on weather condition
const getHarvestDurationText = (weatherCondition: string) => {
  switch (weatherCondition) {
    case 'cerah':
      return '2 Bulan';
    case 'hujan':
      return '4.5 Bulan';
    case 'berawan':
      return '3 Bulan';
    case 'panas':
      return '2.5 Bulan';
    case 'dingin':
      return '5 Bulan';
    default:
      return '3 Bulan';
  }
};

// Validate date
const isValidDate = (date: Date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Weather options
const weatherOptions = [
  { value: 'cerah', label: 'Cerah', icon: 'sunny' },
  { value: 'berawan', label: 'Berawan', icon: 'partly-sunny' },
  { value: 'hujan', label: 'Hujan', icon: 'rainy' },
  { value: 'panas', label: 'Panas', icon: 'thermometer' },
  { value: 'dingin', label: 'Dingin', icon: 'snow' },
];

export default function EditPlantScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // State for date pickers and dropdown
  const [showPlantedDatePicker, setShowPlantedDatePicker] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);
  const [showWeatherDropdown, setShowWeatherDropdown] = useState(false);
  
  const plantId = typeof params.id === 'string' ? params.id : 
                 Array.isArray(params.id) ? params.id[0] : 
                 (params as any).id;

  console.log('🔄 EDIT PLANT SCREEN - Plant ID:', plantId);

  const [form, setForm] = useState({
    name: '',
    type: '',
    plantedDate: new Date(),
    harvestDate: new Date(),
    location: 'Cikole, Kota Sukabumi',
    area: '',
    weather: 'berawan',
    weatherNotes: '',
    fertilizer: '',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
  });

  const handleBack = () => {
    router.push('/(tabs)/ditanam');
  };

  useEffect(() => {
    if (plantId && plantId !== 'undefined') {
      loadPlant();
    } else {
      console.error('❌ EDIT PLANT SCREEN - Invalid plant ID:', plantId);
      Alert.alert('Error', 'ID tanaman tidak valid');
      router.push('/(tabs)/ditanam');
    }
  }, [plantId]);

  const loadPlant = async () => {
    try {
      console.log('📡 EDIT PLANT SCREEN - Loading plant...');
      const plantData = await plantService.getPlantById(plantId);
      
      if (plantData) {
        console.log('✅ EDIT PLANT SCREEN - Plant loaded:', plantData.name);
        setImageError(false);

        // Parse dates from plant data
        const plantedDate = plantData.plantedDate ? new Date(plantData.plantedDate) : new Date();
        const harvestDate = plantData.harvestDate ? new Date(plantData.harvestDate) : calculateHarvestDate(plantedDate, plantData.weather || 'berawan');

        setForm({
          name: plantData.name || '',
          type: plantData.type || '',
          plantedDate: isValidDate(plantedDate) ? plantedDate : new Date(),
          harvestDate: isValidDate(harvestDate) ? harvestDate : calculateHarvestDate(new Date(), plantData.weather || 'berawan'),
          location: plantData.location || 'Cikole, Kota Sukabumi',
          area: plantData.area ? String(plantData.area) : '',
          weather: plantData.weather || 'berawan',
          weatherNotes: plantData.weatherNotes || '',
          fertilizer: plantData.fertilizer || '',
          image: plantData.image || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
        });
      } else {
        console.log('❌ EDIT PLANT SCREEN - Plant not found');
        Alert.alert('Error', 'Tanaman tidak ditemukan');
        router.push('/(tabs)/ditanam');
      }
    } catch (error) {
      console.error('❌ EDIT PLANT SCREEN - Error loading plant:', error);
      Alert.alert('Error', 'Gagal memuat data tanaman');
    } finally {
      setLoading(false);
    }
  };

  // Handle weather change
  const handleWeatherChange = (weather: string) => {
    const newHarvestDate = calculateHarvestDate(form.plantedDate, weather);
    setForm({
      ...form,
      weather: weather,
      harvestDate: isValidDate(newHarvestDate) ? newHarvestDate : calculateHarvestDate(new Date(), weather)
    });
    setShowWeatherDropdown(false);
  };

  // Handle planted date change
  const handlePlantedDateChange = (selectedDate: Date) => {
    if (!isValidDate(selectedDate)) {
      console.error('Invalid planted date selected');
      return;
    }
    
    const newHarvestDate = calculateHarvestDate(selectedDate, form.weather);
    setForm({
      ...form,
      plantedDate: selectedDate,
      harvestDate: isValidDate(newHarvestDate) ? newHarvestDate : calculateHarvestDate(new Date(), form.weather)
    });
    setShowPlantedDatePicker(false);
  };

  // Handle harvest date change (manual override)
  const handleHarvestDateChange = (selectedDate: Date) => {
    if (!isValidDate(selectedDate)) {
      console.error('Invalid harvest date selected');
      return;
    }
    
    setForm({
      ...form,
      harvestDate: selectedDate
    });
    setShowHarvestDatePicker(false);
  };

  // Web date input handler
  const handleWebDateChange = (field: 'plantedDate' | 'harvestDate', value: string) => {
    console.log(`Date change: ${field} = ${value}`);
    
    const newDate = parseDateFromInput(value);
    
    if (!isValidDate(newDate)) {
      console.error('Invalid date parsed from input');
      return;
    }
    
    if (field === 'plantedDate') {
      const newHarvestDate = calculateHarvestDate(newDate, form.weather);
      setForm({
        ...form,
        plantedDate: newDate,
        harvestDate: isValidDate(newHarvestDate) ? newHarvestDate : calculateHarvestDate(new Date(), form.weather)
      });
    } else {
      setForm({
        ...form,
        harvestDate: newDate
      });
    }
  };

  // Handle area input change dengan validasi angka
  const handleAreaChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    
    const parts = cleanedText.split('.');
    if (parts.length > 2) {
      return;
    }
    
    setForm({
      ...form,
      area: cleanedText
    });
  };

  const requestImagePermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Aplikasi memerlukan akses galeri foto untuk memilih foto tanaman.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const handlePickImage = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

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
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Gagal memilih foto. Coba lagi.');
    }
  };

  const handleUpdatePlant = async () => {
    if (!form.name || !form.name.trim()) {
      Alert.alert('Error', 'Harap isi Jenis Tanaman!');
      return;
    }

    // Validate area jika diisi
    if (form.area && isNaN(parseFloat(form.area))) {
      Alert.alert('Error', 'Luas hektar harus berupa angka!');
      return;
    }

    // Validate dates before saving
    if (!isValidDate(form.plantedDate) || !isValidDate(form.harvestDate)) {
      Alert.alert('Error', 'Format tanggal tidak valid. Harap periksa kembali.');
      return;
    }

    setUpdating(true);

    try {
      console.log('✏️ EDIT PLANT SCREEN - Updating plant...');
      
      const selectedWeather = weatherOptions.find(opt => opt.value === form.weather);
      
      const updatedPlant = await plantService.updatePlant(plantId, {
        name: form.name.trim(),
        type: form.type || form.name.trim(),
        plantedDate: form.plantedDate.toISOString().split('T')[0],
        harvestDate: form.harvestDate.toISOString().split('T')[0],
        image: form.image,
        location: form.location || 'Cikole, Kota Sukabumi',
        area: form.area ? parseFloat(form.area) : null,
        weather: form.weather,
        weatherLabel: selectedWeather?.label || 'Berawan',
        weatherNotes: form.weatherNotes,
        fertilizer: form.fertilizer || '',
        care: {
          water: '1 kali sehari',
          sun: '6-8 jam/hari',
          soil: 'Tanah gembur',
          fertilizer: form.fertilizer || 'Pupuk organik mingguan'
        },
        progress: 10,
        status: 'growing',
        harvestDuration: getHarvestDurationText(form.weather),
      });

      if (updatedPlant) {
        console.log('✅ EDIT PLANT SCREEN - Plant updated successfully');
        Alert.alert(
          'Berhasil!', 
          `Tanaman ${updatedPlant.name} berhasil diupdate!\nPerkiraan panen: ${getHarvestDurationText(form.weather)}`,
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/(tabs)/ditanam')
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Gagal mengupdate tanaman');
      }
    } catch (error) {
      console.error('❌ EDIT PLANT SCREEN - Error updating plant:', error);
      Alert.alert('Error', 'Gagal mengupdate tanaman. Coba lagi.');
    } finally {
      setUpdating(false);
    }
  };

  // Custom Date Picker Component for Mobile
  const CustomDatePicker = ({ 
    visible, 
    onClose, 
    selectedDate, 
    onDateChange,
    title 
  }: {
    visible: boolean;
    onClose: () => void;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    title: string;
  }) => {
    const [currentDate, setCurrentDate] = useState(selectedDate);

    if (!visible) return null;

    return (
      <Modal
        transparent={true}
        animationType="slide"
        visible={visible}
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.datePickerContainer}>
                <Text style={styles.datePickerTitle}>{title}</Text>
                
                <View style={styles.dateControls}>
                  <TouchableOpacity 
                    style={styles.dateControlButton}
                    onPress={() => {
                      const newDate = new Date(currentDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCurrentDate(newDate);
                    }}
                  >
                    <Ionicons name="chevron-back" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  
                  <Text style={styles.monthYearText}>
                    {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.dateControlButton}
                    onPress={() => {
                      const newDate = new Date(currentDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCurrentDate(newDate);
                    }}
                  >
                    <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.dateGrid}>
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                    <Text key={day} style={styles.weekDayLabel}>{day}</Text>
                  ))}
                  
                  {getCalendarDays(currentDate).map((date, index) => (
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

                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => {
                    onDateChange(currentDate);
                    onClose();
                  }}
                >
                  <Text style={styles.datePickerButtonText}>Pilih Tanggal</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Weather Dropdown Component
  const WeatherDropdown = () => {
    if (!showWeatherDropdown) return null;

    return (
      <Modal
        transparent={true}
        animationType="fade"
        visible={showWeatherDropdown}
        onRequestClose={() => setShowWeatherDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowWeatherDropdown(false)}>
          <View style={styles.dropdownOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownTitle}>Pilih Kondisi Cuaca</Text>
                {weatherOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.weatherOption,
                      form.weather === option.value && styles.weatherOptionSelected
                    ]}
                    onPress={() => handleWeatherChange(option.value)}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={20} 
                      color={form.weather === option.value ? Colors.white : Colors.text} 
                    />
                    <Text style={[
                      styles.weatherOptionText,
                      form.weather === option.value && styles.weatherOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {form.weather === option.value && (
                      <Ionicons name="checkmark" size={16} color={Colors.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Helper function to get calendar days
  const getCalendarDays = (date: Date) => {
    if (!isValidDate(date)) {
      date = new Date();
    }
    
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getWeatherIcon = (weather: string) => {
    const option = weatherOptions.find(opt => opt.value === weather);
    return option?.icon || 'partly-sunny';
  };

  const getWeatherLabel = (weather: string) => {
    const option = weatherOptions.find(opt => opt.value === weather);
    return option?.label || 'Berawan';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Catatan</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </View>
    );
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
          <Text style={styles.headerTitle}>Edit Catatan</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Selection */}
        <View style={styles.imageSection}>
          <Text style={styles.label}>Foto Tanaman</Text>
          
          {/* Preview Image */}
          <TouchableOpacity 
            style={styles.imagePreviewContainer}
            onPress={handlePickImage}
          >
            {form.image ? (
              <Image 
                source={{ uri: form.image }} 
                style={styles.imagePreview}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color={Colors.textLight} />
                <Text style={styles.imagePlaceholderText}>Ubah Foto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Jenis Tanaman */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jenis Tanaman</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="leaf-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukan jenis tanaman"
                placeholderTextColor={Colors.textLight}
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
                <Ionicons name="calendar-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                <input
                  type="date"
                  value={formatDateForInput(form.plantedDate)}
                  onChange={(e) => handleWebDateChange('plantedDate', e.target.value)}
                  style={{
                    ...styles.webDateInput,
                    background: Colors.cardBackground,
                    color: Colors.text,
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.dateInputContainer}
                onPress={() => setShowPlantedDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                <Text style={styles.dateInputText}>
                  {formatDateToIndonesian(form.plantedDate)}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textLight} style={styles.dateChevron} />
              </TouchableOpacity>
            )}
          </View>

          {/* Luas Lahan (Hektar) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Luas Lahan (Hektar)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="resize-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.textLight}
                value={form.area}
                onChangeText={handleAreaChange}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Kondisi Cuaca Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kondisi Cuaca</Text>
            <TouchableOpacity 
              style={styles.dateInputContainer}
              onPress={() => setShowWeatherDropdown(true)}
            >
              <Ionicons 
                name={getWeatherIcon(form.weather) as any} 
                size={20} 
                color={Colors.textLight} 
                style={styles.inputIcon} 
              />
              <Text style={styles.dateInputText}>
                {getWeatherLabel(form.weather)}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textLight} style={styles.dateChevron} />
            </TouchableOpacity>
            <Text style={styles.weatherInfoText}>
              Perkiraan panen: {getHarvestDurationText(form.weather)}
            </Text>
          </View>

          {/* Perkiraan Waktu Panen */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Perkiraan Waktu Panen</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.inputContainer}>
                <Ionicons name="time-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                <input
                  type="date"
                  value={formatDateForInput(form.harvestDate)}
                  onChange={(e) => handleWebDateChange('harvestDate', e.target.value)}
                  style={{
                    ...styles.webDateInput,
                    background: Colors.cardBackground,
                    color: Colors.text,
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.dateInputContainer}
                onPress={() => setShowHarvestDatePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                <Text style={styles.dateInputText}>
                  {formatDateToIndonesian(form.harvestDate)}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textLight} style={styles.dateChevron} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lokasi Penanaman */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lokasi Penanaman</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Cikole, Kota Sukabumi"
                placeholderTextColor={Colors.textLight}
                value={form.location}
                onChangeText={(text) => setForm({...form, location: text})}
              />
            </View>
          </View>

          {/* Catat Kondisi Cuaca (Notes) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Catatan Kondisi Cuaca</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tambahkan catatan detail tentang cuaca..."
                placeholderTextColor={Colors.textLight}
                value={form.weatherNotes}
                onChangeText={(text) => setForm({...form, weatherNotes: text})}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
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
                value={form.fertilizer}
                onChangeText={(text) => setForm({...form, fertilizer: text})}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, updating && styles.saveButtonDisabled]} 
          onPress={handleUpdatePlant}
          disabled={updating}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Text>
        </TouchableOpacity>

        {/* Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Custom Date Pickers for Mobile */}
      {Platform.OS !== 'web' && (
        <>
          <CustomDatePicker
            visible={showPlantedDatePicker}
            onClose={() => setShowPlantedDatePicker(false)}
            selectedDate={form.plantedDate}
            onDateChange={handlePlantedDateChange}
            title="Pilih Tanggal Tanam"
          />

          <CustomDatePicker
            visible={showHarvestDatePicker}
            onClose={() => setShowHarvestDatePicker(false)}
            selectedDate={form.harvestDate}
            onDateChange={handleHarvestDateChange}
            title="Pilih Tanggal Panen"
          />
        </>
      )}

      {/* Weather Dropdown */}
      <WeatherDropdown />
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
  // Image Section Styles
  imageSection: {
    marginBottom: 20,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: Colors.textLight,
    fontSize: 14,
  },
  // Form Styles
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 8,
    top: 6,
    zIndex: 1,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 6,
    paddingLeft: 32,
    fontSize: 11,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 32,
  },
  // Date Input Styles
  dateInputContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 6,
    paddingLeft: 32,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
  },
  dateInputText: {
    fontSize: 10,
    color: Colors.text,
    flex: 1,
    lineHeight: 14,
  },
  dateChevron: {
    marginRight: 4,
  },
  // Web Date Input
  webDateInput: {
    width: '100%',
    padding: 6,
    paddingLeft: 32,
    fontSize: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    outline: 'none',
    fontFamily: 'System',
    lineHeight: 12,
    height: 32,
  },
  textArea: {
    paddingLeft: 8,
    height: 60,
    textAlignVertical: 'top',
    fontSize: 11,
  },
  // Weather Info Text
  weatherInfoText: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
  // Date Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  dateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateControlButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  weekDayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 8,
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateCellSelected: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  dateCellText: {
    fontSize: 14,
    color: Colors.text,
  },
  dateCellTextSelected: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  datePickerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  datePickerButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Weather Dropdown Styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  weatherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  weatherOptionSelected: {
    backgroundColor: Colors.primary,
  },
  weatherOptionText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  weatherOptionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
});