import PlantCard from '@/components/PlantCard';
import { Colors } from '@/constants/Colors';
import { plantService } from '@/services/plantService';
import { Plant } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DitanamScreen() {
  const router = useRouter();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ditanam' | 'panen'>('ditanam');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to calculate daysLeft and progress
  const updatePlantData = (plant: Plant): Plant => {
    const now = new Date();
    // Ensure harvestDate is a valid date object
    const harvestDate = new Date(plant.harvestDate);
    if (isNaN(harvestDate.getTime())) {
      return { ...plant, daysLeft: 0, progress: plant.progress };
    }

    const daysLeft = Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Ensure plantedDate is a valid date object
    const plantedDate = new Date(plant.plantedDate);
    if (isNaN(plantedDate.getTime())) {
      return { ...plant, daysLeft: Math.max(0, daysLeft), progress: plant.progress };
    }
    
    const totalDays = Math.ceil((harvestDate.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = totalDays - daysLeft;
    const progress = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100))) : plant.progress;

    return {
      ...plant,
      daysLeft: Math.max(0, daysLeft),
      progress,
      // Auto update status if harvest time has come
      status: daysLeft <= 0 && plant.status === 'growing' ? 'harvested' : plant.status,
    };
  };

  const loadPlants = React.useCallback(async () => {
    try {
      console.log('🔄 DITANAM SCREEN - Loading plants, tab:', activeTab);
      
      let plantsData: Plant[];
      if (activeTab === 'ditanam') {
        plantsData = await plantService.getPlantsByStatus('growing');
      } else {
        plantsData = await plantService.getPlantsByStatus('harvested');
      }
      
      // Update data on-the-fly and filter based on new status
      let processedPlants = plantsData.map(updatePlantData);
      
      // If we are in 'ditanam' tab, filter out plants that just became 'harvested'
      if (activeTab === 'ditanam') {
        processedPlants = processedPlants.filter(p => p.status === 'growing');
      }

      console.log('📊 DITANAM SCREEN - Loaded plants:', processedPlants.length);
      
      // Filter by search query
      if (searchQuery.trim()) {
        processedPlants = processedPlants.filter(plant => 
          plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plant.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Update plants state with processed data
      setPlants(processedPlants);
    } catch (error) {
      console.error('❌ DITANAM SCREEN - Error loading plants:', error);
      setPlants([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useFocusEffect(
    React.useCallback(() => {
      loadPlants();
    }, [loadPlants])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPlants();
  };

  const handleAddPlant = () => {
    router.push('/add-plant');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingContent}>
            <Ionicons name="leaf-outline" size={64} color="#2E7D32" />
            <ActivityIndicator size="large" color="#2E7D32" style={{marginVertical: 20}} />
            <Text style={styles.loadingText}>Memuat tanaman...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

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
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Ionicons name="leaf" size={28} color="#2E7D32" />
                <Text style={styles.title}>Tanaman Saya</Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#2E7D32" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari tanaman anda di sini..."
                placeholderTextColor="#81C784"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#81C784" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>

        {/* Tabs Card */}
        <View style={styles.tabsCard}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ditanam' && styles.activeTab]}
            onPress={() => {
              setActiveTab('ditanam');
              setSearchQuery('');
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="leaf-outline" 
              size={20} 
              color={activeTab === 'ditanam' ? "#FFFFFF" : "#2E7D32"} 
            />
            <Text style={[styles.tabText, activeTab === 'ditanam' && styles.activeTabText]}>
              Ditanam
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'panen' && styles.activeTab]}
            onPress={() => {
              setActiveTab('panen');
              setSearchQuery('');
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="basket-outline" 
              size={20} 
              color={activeTab === 'panen' ? "#FFFFFF" : "#2E7D32"} 
            />
            <Text style={[styles.tabText, activeTab === 'panen' && styles.activeTabText]}>
              Sudah Panen
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#2E7D32"
              colors={['#2E7D32']}
            />
          }
        >
          {plants.length > 0 ? (
            <View style={styles.plantsGrid}>
              {plants.map(plant => (
                <PlantCard 
                  key={plant.id} 
                  id={plant.id}
                  name={plant.name}
                  daysLeft={plant.daysLeft}
                  image={plant.image}
                  plantData={plant}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              {activeTab === 'ditanam' ? (
                // Empty state untuk tab Ditanam - tanpa background card
                <View style={styles.emptyStateTransparent}>
                  <Image 
                    source={require('../../assets/images/Icon.png')} 
                    style={styles.emptyStateImageTransparent}
                    resizeMode="contain"
                  />
                  <TouchableOpacity 
                    style={styles.addButtonTransparent}
                    onPress={handleAddPlant}
                  >
                    <LinearGradient
                      colors={['#4CAF50', '#2E7D32']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.addButtonGradient}
                    >
                      <View style={styles.addButtonContent}>
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>Tambah Tanaman</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                // Empty state untuk tab Panen - dengan background card
                <View style={styles.emptyStateCard}>
                  <Ionicons name="basket-outline" size={80} color="#81C784" />
                  <Text style={styles.emptyStateTitle}>Belum Ada Panenan</Text>
                  <Text style={styles.emptyStateText}>
                    Tanaman yang dipanen akan muncul di sini
                  </Text>
                  <TouchableOpacity 
                    style={styles.emptyStateButtonSecondary}
                    onPress={() => setActiveTab('ditanam')}
                  >
                    <Ionicons name="leaf-outline" size={20} color="#2E7D32" />
                    <Text style={styles.emptyStateButtonTextSecondary}>Lihat Tanaman Ditanam</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          
          {/* Spacing for FAB */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Floating Action Button - hanya untuk tab Ditanam dan ketika ada tanaman */}
        {activeTab === 'ditanam' && plants.length > 0 && (
          <TouchableOpacity 
            style={styles.fab}
            onPress={handleAddPlant}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <View style={styles.fabContent}>
                <Ionicons name="add" size={24} color="#FFFFFF" />
                <Text style={styles.fabText}>Tambah Tanaman</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
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
    padding: 20,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1B5E20',
  },
  tabsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 4,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#2E7D32',
  },
  tabText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 20,
  },
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyStateTransparent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateImageTransparent: {
    width: 300,
    height: 300,
  },
  emptyStateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addButtonTransparent: {
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyStateButtonSecondary: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  emptyStateButtonTextSecondary: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});