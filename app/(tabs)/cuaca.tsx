import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getCurrentWeather, getWeatherTips, WeatherData } from '@/services/weatherService';

export default function CuacaScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState('Sukabumi');

  const loadWeather = async () => {
    try {
      const weatherData = await getCurrentWeather();
      setWeather(weatherData);
    } catch (error) {
      console.error('Error loading weather:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWeather();
  };

  // Mock hourly forecast
  const hourlyForecast = [
    { time: '15.00', temp: '29°C', icon: 'sunny' },
    { time: '16.00', temp: '26°C', icon: 'sunny' },
    { time: '17.00', temp: '24°C', icon: 'cloudy', active: true },
    { time: '18.00', temp: '23°C', icon: 'sunny' },
  ];

  // Mock next forecast
  const nextForecast = [
    { day: 'Monday', icon: 'rainy', high: '13°C', low: '10°C' },
    { day: 'Tuesday', icon: 'stormy', high: '17°C', low: '12°C' },
    { day: 'Wednesday', icon: 'partly-sunny', high: '20°C', low: '15°C' },
    { day: 'Thursday', icon: 'sunny', high: '22°C', low: '17°C' },
    { day: 'Friday', icon: 'cloudy', high: '19°C', low: '14°C' },
    { day: 'Saturday', icon: 'rainy', high: '18°C', low: '13°C' },
    { day: 'Sunday', icon: 'partly-sunny', high: '21°C', low: '16°C' },
  ];

  const getWeatherIcon = (condition: string) => {
    const iconMap: { [key: string]: string } = {
      'sunny': 'sunny',
      'partly-sunny': 'partly-sunny-outline',
      'cloudy': 'cloudy-outline',
      'rainy': 'rainy-outline',
      'stormy': 'thunderstorm-outline',
    };
    return iconMap[condition] || 'partly-sunny-outline';
  };

  const getCurrentDate = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat data cuaca...</Text>
        </View>
      </View>
    );
  }

  const currentWeather = weather || {
    temperature: 28,
    condition: 'Partly Cloudy',
    humidity: 6,
    windSpeed: 19,
    precipitation: 90,
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenLabel}>cuaca</Text>
          <View style={styles.locationHeader}>
            <Ionicons name="location-outline" size={20} color={Colors.text} />
            <Text style={styles.locationText}>{location}</Text>
            <TouchableOpacity>
              <Ionicons name="chevron-down-outline" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Weather */}
        <View style={styles.currentWeatherSection}>
          <View style={styles.weatherIconContainer}>
            <Ionicons 
              name={getWeatherIcon('partly-sunny') as any} 
              size={120} 
              color={Colors.primary} 
            />
          </View>
          
          <Text style={styles.temperature}>{currentWeather.temperature}°</Text>
          <Text style={styles.precipitationLabel}>Precipitations</Text>
          
          <View style={styles.tempRange}>
            <Text style={styles.tempLabel}>Max.: {currentWeather.temperature + 3}°</Text>
            <Text style={styles.tempLabel}>Min.: {currentWeather.temperature - 3}°</Text>
          </View>
        </View>

        {/* Weather Details Bar */}
        <View style={styles.detailsBar}>
          <View style={styles.detailItem}>
            <Ionicons name="water-outline" size={20} color={Colors.textLight} />
            <Text style={styles.detailValue}>{currentWeather.humidity}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="rainy-outline" size={20} color={Colors.textLight} />
            <Text style={styles.detailValue}>{currentWeather.precipitation}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="leaf-outline" size={20} color={Colors.textLight} />
            <Text style={styles.detailValue}>{currentWeather.windSpeed} km/h</Text>
          </View>
        </View>

        {/* Today's Hourly Forecast */}
        <View style={styles.forecastCard}>
          <View style={styles.forecastCardHeader}>
            <Text style={styles.forecastCardTitle}>Today</Text>
            <Text style={styles.forecastCardDate}>{getCurrentDate()}</Text>
          </View>
          <View style={styles.hourlyForecast}>
            {hourlyForecast.map((hour, index) => (
              <View 
                key={index} 
                style={[
                  styles.hourlyItem,
                  hour.active && styles.hourlyItemActive
                ]}
              >
                <Text style={styles.hourlyTime}>{hour.time}</Text>
                <Ionicons 
                  name={getWeatherIcon(hour.icon) as any} 
                  size={24} 
                  color={hour.active ? Colors.primary : Colors.textLight} 
                />
                <Text style={[
                  styles.hourlyTemp,
                  hour.active && styles.hourlyTempActive
                ]}>
                  {hour.temp}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Next Forecast */}
        <View style={styles.forecastCard}>
          <View style={styles.forecastCardHeader}>
            <Text style={styles.forecastCardTitle}>Next Forecast</Text>
            <Ionicons name="calendar-outline" size={20} color={Colors.textLight} />
          </View>
          {nextForecast.map((day, index) => (
            <View key={index} style={styles.nextForecastItem}>
              <Text style={styles.nextForecastDay}>{day.day}</Text>
              <Ionicons 
                name={getWeatherIcon(day.icon) as any} 
                size={24} 
                color={Colors.textLight} 
              />
              <View style={styles.nextForecastTemp}>
                <Text style={styles.nextForecastHigh}>{day.high}</Text>
                <Text style={styles.nextForecastLow}>{day.low}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.white,
  },
  screenLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  currentWeatherSection: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  weatherIconContainer: {
    marginBottom: 20,
  },
  temperature: {
    fontSize: 64,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  precipitationLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  tempRange: {
    flexDirection: 'row',
    gap: 16,
  },
  tempLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  detailsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  detailItem: {
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  forecastCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 8,
  },
  forecastCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  forecastCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  forecastCardDate: {
    fontSize: 14,
    color: Colors.textLight,
  },
  hourlyForecast: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  hourlyItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  hourlyItemActive: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  hourlyTime: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
  hourlyTemp: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
  },
  hourlyTempActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  nextForecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nextForecastDay: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    width: 100,
  },
  nextForecastTemp: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  nextForecastHigh: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  nextForecastLow: {
    fontSize: 14,
    color: Colors.textLight,
  },
  bottomSpacing: {
    height: 40,
  },
});
