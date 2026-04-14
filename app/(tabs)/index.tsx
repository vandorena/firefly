import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function HomeScreen() {
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

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
      <TouchableOpacity
        style={[styles.button, isFlashlightOn && styles.buttonActive]}
        onPress={toggleFlashlight}
      >
      </TouchableOpacity>
      {isFlashlightOn && (
        <CameraView style={StyleSheet.absoluteFill} enableTorch={true} />
      )}
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
});
