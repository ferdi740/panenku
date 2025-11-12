import PlantCard from '@/components/PlantCard';
import { Colors } from '@/constants/Colors';
import { plantService } from '@/services/plantService';
import { Plant } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function DitanamScreen() {
  const router = useRouter();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ditanam' | 'panen'>('ditanam');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPlants = React.useCallback(async () => {
    try {
      console.log('🔄 DITANAM SCREEN - Loading plants, tab:', activeTab);
      
      let plantsData: Plant[];
      if (activeTab === 'ditanam') {
        plantsData = await plantService.getPlantsByStatus('growing');
      } else {
        plantsData = await plantService.getPlantsByStatus('harvested');
      }
      
      console.log('📊 DITANAM SCREEN - Loaded plants:', plantsData.length);
      
      // Filter by search query
      if (searchQuery.trim()) {
        plantsData = plantsData.filter(plant => 
          plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plant.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Update plants state directly
      setPlants(plantsData);
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

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  // Handle delete callback
  const handleDelete = React.useCallback(() => {
    console.log('🔄 DITANAM SCREEN - Delete callback triggered, reloading...');
    loadPlants().then(() => {
      console.log('✅ DITANAM SCREEN - Plants reloaded after delete');
    }).catch((error) => {
      console.error('❌ DITANAM SCREEN - Error reloading plants:', error);
    });
  }, [loadPlants]);
  const handleEdit = React.useCallback((plantId: string) => {
    console.log('✏️ DITANAM SCREEN - Edit plant:', plantId);
    // Navigate to edit screen
    router.push(`/edit-plant/${plantId}`);
  }, [router]);


  const onRefresh = () => {
    setRefreshing(true);
    loadPlants();
  };

  const handleAddPlant = () => {
    router.push('/add-plant');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat tanaman...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tanaman Saya</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari tanaman anda di sini..."
          placeholderTextColor={Colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ditanam' && styles.activeTab]}
          onPress={() => {
            setActiveTab('ditanam');
            setSearchQuery(''); // Reset search when switching tabs
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'ditanam' && styles.activeTabText]}>
            Ditanam
          </Text>
          {activeTab === 'ditanam' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'panen' && styles.activeTab]}
          onPress={() => {
            setActiveTab('panen');
            setSearchQuery(''); // Reset search when switching tabs
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'panen' && styles.activeTabText]}>
            Sudah Panen
          </Text>
          {activeTab === 'panen' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>
      
      {/* Content */}
       <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
                onDelete={handleDelete}
                onEdit={() => handleEdit(plant.id)} // Tambahkan ini
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            {activeTab === 'ditanam' ? (
              <Image 
                source={require('@/Icon.png')} 
                style={styles.emptyStateIcon}
                resizeMode="contain"
              />
            ) : (
              <>
                <Ionicons name="basket-outline" size={64} color={Colors.textLight} />
                <Text style={styles.emptyStateText}>
                  Belum ada tanaman yang dipanen
                </Text>
              </>
            )}

          </View>
        )}
        
        {/* Spacing for FAB */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      {activeTab === 'ditanam' && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleAddPlant}
          activeOpacity={0.8}
        > 
          <Ionicons name="leaf" size={20} color={Colors.white} />
          <Text style={styles.fabText}>Tambah catatan</Text>
        </TouchableOpacity>
      )}
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    margin: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    position: 'relative',
  },
  activeTab: {
    // Active tab styling
  },
  tabText: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    padding: 16,
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
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateIcon: {
    width: 400,
    height: 400,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyStateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
