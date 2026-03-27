import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import axios from 'axios';

export default function WorkerDashboard() {
  // For demo, hardcode values; in real app, get from navigation
  const userToken = 'demo-token'; // Replace with actual JWT
  const projectId = 'demo-project-id'; // Replace with actual project ID
  const [location, setLocation] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Chyba', 'Přístup k GPS byl odepřen.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasPermission(cameraStatus.status === 'granted');
    })();
  }, []);

  const handleCheckIn = async () => {
    if (!location) return Alert.alert('Načítání...', 'Čekám na GPS signál');
    try {
      const response = await axios.post('http://localhost:3000/api/attendance/checkin', {
        projectId,
        lat: location.coords.latitude,
        lng: location.coords.longitude
      }, { headers: { Authorization: `Bearer ${userToken}` }});

      if (response.data.isValid) {
        Alert.alert('Úspěch', 'Zapsáno na stavbě. Jste v zóně.');
      } else {
        Alert.alert('Varování', `Jste mimo zónu stavby (${Math.round(response.data.distance)} m). Zapsáno s příznakem porušení.`);
      }
    } catch (e) {
      Alert.alert('Chyba', 'Nepodařilo se spojit se serverem.');
    }
  };

  const takePhotoForTask = async () => {
    // V reálné aplikaci zde otevřeme komponentu Camera
    Alert.alert('Fotoaparát', 'Modul pro pořízení fota s GPS a časovým vodoznakem inicializován.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nexus Build - Terénní Modul</Text>

      <View style={styles.gpsBox}>
        <Text style={styles.gpsText}>
          GPS: {location ? `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}` : 'Hledám družice...'}
        </Text>
      </View>

      <TouchableOpacity style={styles.btnPrimary} onPress={handleCheckIn}>
        <Text style={styles.btnText}>PŘÍCHOD NA STAVBU (GPS CHECK-IN)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSecondary} onPress={takePhotoForTask}>
        <Text style={styles.btnText}>FOTODOKUMENTACE ÚKOLU</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#0f172a', justifyContent: 'center' },
  header: { color: '#38bdf8', fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  gpsBox: { backgroundColor: '#1e293b', padding: 15, borderRadius: 8, marginBottom: 20 },
  gpsText: { color: '#94a3b8', textAlign: 'center', fontFamily: 'monospace' },
  btnPrimary: { backgroundColor: '#10b981', padding: 20, borderRadius: 8, marginBottom: 15 },
  btnSecondary: { backgroundColor: '#3b82f6', padding: 20, borderRadius: 8 },
  btnText: { color: '#ffffff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }
});
