import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { RootStackParamList } from '@/navigation/AppNavigator';
import { RootState } from '@/store';
import { formatTimeAgo } from '@/utils/helpers';

type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;

const MapScreen: React.FC = () => {
  const navigation = useNavigation<MapScreenNavigationProp>();
  const { t } = useTranslation();
  
  const { currentLocation, locationHistory, isTracking } = useSelector(
    (state: RootState) => state.location
  );
  
  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [showPath, setShowPath] = useState(true);

  // Default location (Riyadh, Saudi Arabia)
  const defaultLocation = {
    latitude: 24.7136,
    longitude: 46.6753,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // Get current region
  const getCurrentRegion = () => {
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return defaultLocation;
  };

  // Center map on current location
  const centerOnCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(getCurrentRegion(), 1000);
    } else {
      Alert.alert(t('common.error'), 'الموقع الحالي غير متوفر');
    }
  };

  // Toggle map type
  const toggleMapType = () => {
    const types: Array<'standard' | 'satellite' | 'hybrid'> = ['standard', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  // Get map type display name
  const getMapTypeDisplayName = () => {
    switch (mapType) {
      case 'standard':
        return 'عادي';
      case 'satellite':
        return 'قمر صناعي';
      case 'hybrid':
        return 'مختلط';
      default:
        return 'عادي';
    }
  };

  // Generate path coordinates
  const getPathCoordinates = () => {
    return locationHistory
      .slice(0, 50) // Show last 50 locations
      .map(location => ({
        latitude: location.latitude,
        longitude: location.longitude,
      }));
  };

  // Get marker color based on accuracy
  const getMarkerColor = (accuracy: number) => {
    if (accuracy <= 5) return '#4caf50'; // Green for high accuracy
    if (accuracy <= 15) return '#ff9800'; // Orange for medium accuracy
    return '#f44336'; // Red for low accuracy
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>خريطة الموقع</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleMapType}
          >
            <Text style={styles.headerButtonText}>{getMapTypeDisplayName()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        initialRegion={getCurrentRegion()}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="الموقع الحالي"
            description={`الدقة: ±${currentLocation.accuracy}م`}
            pinColor={getMarkerColor(currentLocation.accuracy)}
          />
        )}

        {/* Location History Markers */}
        {locationHistory.slice(1, 10).map((location, index) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={`موقع سابق ${index + 1}`}
            description={formatTimeAgo(location.timestamp)}
            pinColor="#757575"
            opacity={0.7}
          />
        ))}

        {/* Path Polyline */}
        {showPath && locationHistory.length > 1 && (
          <Polyline
            coordinates={getPathCoordinates()}
            strokeColor="#4285f4"
            strokeWidth={3}
            strokePattern={[1]}
          />
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={centerOnCurrentLocation}
        >
          <Text style={styles.controlButtonIcon}>📍</Text>
          <Text style={styles.controlButtonText}>الموقع الحالي</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, showPath && styles.controlButtonActive]}
          onPress={() => setShowPath(!showPath)}
        >
          <Text style={styles.controlButtonIcon}>🛤️</Text>
          <Text style={styles.controlButtonText}>
            {showPath ? 'إخفاء المسار' : 'إظهار المسار'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location Info Panel */}
      {currentLocation && (
        <View style={styles.locationInfo}>
          <View style={styles.locationInfoHeader}>
            <Text style={styles.locationInfoTitle}>معلومات الموقع</Text>
            <View style={[
              styles.trackingStatus,
              { backgroundColor: isTracking ? '#4caf50' : '#f44336' }
            ]}>
              <Text style={styles.trackingStatusText}>
                {isTracking ? 'التتبع نشط' : 'التتبع متوقف'}
              </Text>
            </View>
          </View>
          
          <View style={styles.locationInfoContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>الإحداثيات:</Text>
              <Text style={styles.infoValue}>
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>الدقة:</Text>
              <Text style={[
                styles.infoValue,
                { color: getMarkerColor(currentLocation.accuracy) }
              ]}>
                ±{currentLocation.accuracy}م
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>السرعة:</Text>
              <Text style={styles.infoValue}>
                {currentLocation.speed ? `${Math.round(currentLocation.speed * 3.6)} كم/س` : '0 كم/س'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>آخر تحديث:</Text>
              <Text style={styles.infoValue}>
                {formatTimeAgo(currentLocation.timestamp)}
              </Text>
            </View>
            
            {currentLocation.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>العنوان:</Text>
                <Text style={styles.infoValue}>{currentLocation.address}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Statistics */}
      <View style={styles.statistics}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{locationHistory.length}</Text>
          <Text style={styles.statLabel}>نقطة موقع</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {currentLocation ? Math.round(currentLocation.accuracy) : '--'}
          </Text>
          <Text style={styles.statLabel}>دقة (متر)</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {currentLocation?.speed ? Math.round(currentLocation.speed * 3.6) : 0}
          </Text>
          <Text style={styles.statLabel}>سرعة (كم/س)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.3)',
  },
  headerButtonText: {
    color: '#4285f4',
    fontSize: 12,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 100,
    right: 20,
    gap: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(66, 133, 244, 0.8)',
  },
  controlButtonIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  locationInfo: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  locationInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationInfoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  trackingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trackingStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  locationInfoContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    flex: 1,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statistics: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#4285f4',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: 10,
  },
});

export default MapScreen;