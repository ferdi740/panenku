// Mock weather service - in real app, you'd use actual API like OpenWeatherMap
export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  icon: string;
  forecast: DailyForecast[];
}

export interface DailyForecast {
  day: string;
  condition: string;
  highTemp: number;
  lowTemp: number;
  icon: string;
}

export const getCurrentWeather = async (): Promise<WeatherData> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        temperature: 28,
        condition: 'Cerah Berawan',
        humidity: 65,
        windSpeed: 12,
        location: 'Jakarta, Indonesia',
        icon: 'partly-sunny',
        forecast: [
          { day: 'Sen', condition: 'sunny', highTemp: 30, lowTemp: 25, icon: 'sunny' },
          { day: 'Sel', condition: 'partly-sunny', highTemp: 29, lowTemp: 24, icon: 'partly-sunny' },
          { day: 'Rab', condition: 'rainy', highTemp: 27, lowTemp: 23, icon: 'rainy' },
          { day: 'Kam', condition: 'cloudy', highTemp: 28, lowTemp: 24, icon: 'cloudy' },
          { day: 'Jum', condition: 'sunny', highTemp: 31, lowTemp: 25, icon: 'sunny' },
          { day: 'Sab', condition: 'partly-sunny', highTemp: 30, lowTemp: 24, icon: 'partly-sunny' },
          { day: 'Min', condition: 'rainy', highTemp: 26, lowTemp: 23, icon: 'rainy' },
        ]
      });
    }, 1000);
  });
};

export const getWeatherTips = (condition: string, temperature: number) => {
  if (condition.includes('hujan') || condition.includes('rainy')) {
    return {
      title: 'Hujan Diprediksi',
      tips: [
        'Kurangi penyiraman tanaman karena tanah sudah cukup lembab',
        'Pastikan drainase baik untuk hindari genangan air',
        'Pindahkan tanaman dalam pot ke tempat teduh'
      ],
      icon: 'rainy',
      color: '#2196F3'
    };
  } else if (temperature > 30) {
    return {
      title: 'Cuaca Panas',
      tips: [
        'Siram tanaman lebih sering di pagi dan sore hari',
        'Berikan naungan untuk tanaman yang sensitif',
        'Hindari pemupukan di siang hari'
      ],
      icon: 'sunny',
      color: '#FF9800'
    };
  } else {
    return {
      title: 'Cuaca Ideal',
      tips: [
        'Kondisi sempurna untuk penyiraman dan pemupukan',
        'Waktu terbaik untuk menanam bibit baru',
        'Lakukan perawatan rutin tanaman'
      ],
      icon: 'partly-sunny',
      color: '#4CAF50'
    };
  }
};