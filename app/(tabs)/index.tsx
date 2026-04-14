import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import LightSensor from 'expo-sensors/build/LightSensor';

export default function HomeScreen() {
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [lightLevel, setLightLevel] = useState<number | null>(null);

  useEffect(() => {
    const subscription = LightSensor.addListener((data) => {
      setLightLevel(data.illuminance);
    });

    LightSensor.setUpdateInterval(100);

    return () => subscription.remove();
  }, []);

  const toggleFlashlight = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to use the flashlight.');
        return;
      }
    }

    setIsFlashlightOn(!isFlashlightOn);
  };

  return (
    <View style={styles.container}>
      {isFlashlightOn && (
        <CameraView style={styles.hiddenCamera} enableTorch={true} />
      )}
      <TouchableOpacity
        style={[styles.button, isFlashlightOn && styles.buttonActive]}
        onPress={toggleFlashlight}
      >
      </TouchableOpacity>
      <Text style={styles.lightText}>
        {lightLevel !== null ? `${lightLevel.toFixed(2)} lux` : 'Reading...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenCamera: {
    width: 1,
    height: 1,
    position: 'absolute',
    opacity: 0,
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    borderWidth: 3,
    borderColor: '#666',
  },
  buttonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  lightText: {
    color: '#fff',
    fontSize: 24,
    marginTop: 40,
    fontWeight: '600',
  },
});
