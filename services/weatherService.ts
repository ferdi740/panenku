import * as Location from 'expo-location';

// Tipe kondisi cuaca yang didukung aplikasi
export type WeatherCondition = 'cerah' | 'berawan' | 'hujan' | 'panas' | 'dingin';

export interface DailyForecast {
  day: string;
  condition: WeatherCondition;
  icon: string;
  high: string;
  low: string;
}

export interface WeatherData {
  temperature: number;
  condition: WeatherCondition;
  label: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  location: string;
  icon: string;
  // Info tambahan untuk panen
  harvestDurationDays: number;
  harvestDurationText: string;
  forecast: DailyForecast[]; // Array ramalan 7 hari
}

// --- HELPER: LOGIKA PANEN (Tetap Sama) ---
export const getHarvestInfo = (condition: WeatherCondition) => {
  switch (condition) {
    case 'cerah':
      return { days: 60, text: '2 Bulan' };
    case 'panas':
      return { days: 75, text: '2.5 Bulan' };
    case 'berawan':
      return { days: 90, text: '3 Bulan' };
    case 'hujan':
      return { days: 135, text: '4.5 Bulan' };
    case 'dingin':
      return { days: 150, text: '5 Bulan' };
    default:
      return { days: 90, text: '3 Bulan' };
  }
};

// --- HELPER: KONVERSI KODE CUACA (WMO Code) KE TIPE APLIKASI ---
// Open-Meteo menggunakan kode WMO (0-99). Kita mapping ke tipe kita.
const mapWmoCodeToCondition = (code: number): WeatherCondition => {
  // 0: Clear sky
  if (code === 0) return 'cerah';
  
  // 1, 2, 3: Mainly clear, partly cloudy, and overcast
  if (code >= 1 && code <= 3) return 'berawan';
  
  // 45, 48: Fog
  if (code === 45 || code === 48) return 'dingin';
  
  // 51-57: Drizzle (Gerimis) -> Anggap Hujan
  // 61-67: Rain (Hujan)
  // 80-82: Rain showers
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'hujan';
  
  // 71-77: Snow (Salju) -> Dingin
  // 85-86: Snow showers
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'dingin';
  
  // 95-99: Thunderstorm -> Hujan
  if (code >= 95 && code <= 99) return 'hujan';

  return 'berawan'; // Default
};

// Mapping untuk Icon & Label UI
const getUIForCondition = (condition: WeatherCondition) => {
  const map = {
    'cerah': { label: 'Cerah', icon: 'sunny' },
    'berawan': { label: 'Berawan', icon: 'partly-sunny' },
    'hujan': { label: 'Hujan', icon: 'rainy' },
    'panas': { label: 'Terik', icon: 'thermometer' }, // Kadang cerah bisa jadi panas ekstrem
    'dingin': { label: 'Sejuk/Dingin', icon: 'snow' }
  };
  return map[condition] || map['berawan'];
};

// --- CORE FUNCTION: GET REAL WEATHER FROM API ---
export const getCurrentWeather = async (): Promise<WeatherData> => {
  let locationDisplay = 'Lokasi Tidak Diketahui';
  let latitude = -6.2088; // Default Jakarta
  let longitude = 106.8456;

  // 1. Dapatkan Lokasi GPS Device
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      latitude = location.coords.latitude;
      longitude = location.coords.longitude;

      // Reverse Geocode untuk nama kota
      const address = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address && address.length > 0) {
        const addr = address[0];
        
        // UPDATE: Menggabungkan Kecamatan dan Kota agar lebih spesifik
        // Format: "Kecamatan, Kota" (contoh: Caringin, Sukabumi)
        // FIX: Gunakan type predicate (part is string) agar TS tahu array ini bersih dari null
        const parts = [
          addr.district || addr.street || addr.subregion, // Prioritas: Kecamatan/Jalan
          addr.city || addr.subregion || addr.region      // Prioritas: Kota/Kabupaten
        ].filter((part): part is string => !!part); // Hapus yang null/undefined

        // Hapus duplikat (misal jika district dan city namanya sama)
        const uniqueParts = [...new Set(parts)];
        
        // Gabungkan dengan koma
        if (uniqueParts.length > 0) {
            locationDisplay = uniqueParts.join(', ');
        } else {
            locationDisplay = 'Lokasi Terdeteksi';
        }
      }
    }
  } catch (error) {
    console.error('Error getting location, using default.', error);
  }

  try {
    // 2. Panggil API Open-Meteo (GRATIS & REAL-TIME)
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    // 3. Olah Data Saat Ini (Current)
    const current = data.current;
    const wmoCode = current.weather_code;
    const rawTemp = current.temperature_2m;
    
    // Logic tambahan: Jika suhu > 33, paksa kondisi jadi 'panas' meskipun kodenya 'cerah'
    let condition = mapWmoCodeToCondition(wmoCode);
    if (condition === 'cerah' && rawTemp > 33) {
      condition = 'panas';
    }

    const uiData = getUIForCondition(condition);
    const harvestInfo = getHarvestInfo(condition);

    // 4. Olah Data Ramalan 7 Hari (Daily)
    const daily = data.daily;
    const forecast: DailyForecast[] = [];
    
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    // Loop 7 hari ke depan
    // Menggunakan Math.min untuk memastikan tidak akses index di luar batas array jika API kurang dari 7 hari
    const daysCount = Math.min(daily.time.length, 7);

    for (let i = 0; i < daysCount; i++) {
        const date = new Date(daily.time[i]);
        const dayName = days[date.getDay()];
        const dailyCode = daily.weather_code[i];
        const dailyCond = mapWmoCodeToCondition(dailyCode);
        const dailyUI = getUIForCondition(dailyCond);

        forecast.push({
            day: i === 0 ? 'Hari Ini' : dayName,
            condition: dailyCond,
            icon: dailyUI.icon,
            high: `${Math.round(daily.temperature_2m_max[i])}°`,
            low: `${Math.round(daily.temperature_2m_min[i])}°`
        });
    }

    return {
      location: locationDisplay,
      temperature: Math.round(rawTemp),
      condition: condition,
      label: uiData.label,
      icon: uiData.icon,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      precipitation: current.precipitation,
      harvestDurationDays: harvestInfo.days,
      harvestDurationText: harvestInfo.text,
      forecast: forecast
    };

  } catch (error) {
    console.error('Error fetching weather API:', error);
    // Fallback data jika API error/offline
    return {
      location: locationDisplay,
      temperature: 28,
      condition: 'berawan',
      label: 'Berawan (Offline)',
      icon: 'partly-sunny',
      humidity: 60,
      windSpeed: 10,
      precipitation: 0,
      harvestDurationDays: 90,
      harvestDurationText: '3 Bulan',
      forecast: []
    };
  }
};

export const getWeatherTips = (condition: string, temperature: number) => {
  if (condition.includes('hujan') || condition.includes('rainy')) {
    return {
      title: 'Hujan Diprediksi',
      tips: ['Kurangi penyiraman', 'Cek drainase'],
      icon: 'rainy',
      color: '#2196F3'
    };
  }
  return {
    title: 'Cuaca Baik',
    tips: ['Lakukan perawatan rutin'],
    icon: 'partly-sunny',
    color: '#4CAF50'
  };
};