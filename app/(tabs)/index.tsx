import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';

export default function HomeScreen() {
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [lightLevel, setLightLevel] = useState<number | null>(null);

  // Phase synchronization variables
  const [phase, setPhase] = useState(0); // 0 to 1, where 1 triggers flash
  const phaseRef = React.useRef(Math.random()); // Random starting phase for variety
  const lastLightLevelRef = React.useRef<number | null>(null);
  const baselineLightRef = React.useRef<number>(0);
  const lightReadingsRef = React.useRef<number[]>([]);

  // Light sensor setup with spike detection
  useEffect(() => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const loadLightSensor = async () => {
        try {
          const LightSensor = (await import('expo-sensors/build/LightSensor')).default;
          const subscription = LightSensor.addListener((data) => {
            const lux = data.illuminance;
            setLightLevel(lux);

            // Track baseline (rolling average of last 10 readings)
            lightReadingsRef.current.push(lux);
            if (lightReadingsRef.current.length > 10) {
              lightReadingsRef.current.shift();
            }
            baselineLightRef.current = lightReadingsRef.current.reduce((a, b) => a + b, 0) / lightReadingsRef.current.length;

            // Detect brightness spike (another phone flashing)
            const SPIKE_THRESHOLD = 20; // lux increase to detect a flash
            if (lastLightLevelRef.current !== null) {
              const spike = lux - baselineLightRef.current;

              if (spike > SPIKE_THRESHOLD && !isFlashlightOn) {
                // Another firefly flashed! Pull our phase forward
                const PULL_STRENGTH = 0.5; // How much to sync (0-1) - INCREASED for faster sync
                const currentPhase = phaseRef.current;

                // More aggressive pull: scales with how close we are to flashing
                const pull = currentPhase * PULL_STRENGTH;
                phaseRef.current = Math.min(1, currentPhase + pull);

                // Jump directly to flash if we're already very close (85%+)
                if (currentPhase > 0.85) {
                  phaseRef.current = 1; // Immediate sync
                }
              }
            }

            lastLightLevelRef.current = lux;
          });

          LightSensor.setUpdateInterval(100);

          return () => subscription.remove();
        } catch (error) {
          console.log('Light sensor not available');
        }
      };

      loadLightSensor();
    }
  }, [isFlashlightOn]);

  // Phase-based flashing system (like fireflies!)
  useEffect(() => {
    let phaseInterval: NodeJS.Timeout | null = null;
    let flashTimeout: NodeJS.Timeout | null = null;

    const requestPermissionAndStartFlashing = async () => {
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

      // Phase clock: increments continuously from 0 to 1
      const PHASE_SPEED = 1 / 10; // Complete cycle in 10 seconds
      const UPDATE_RATE = 50; // Update every 50ms

      phaseInterval = setInterval(() => {
        // Increment phase
        phaseRef.current += (UPDATE_RATE / 1000) * PHASE_SPEED;

        // When phase reaches 1, flash!
        if (phaseRef.current >= 1) {
          phaseRef.current = 0; // Reset phase
          setPhase(0);

          // Flash the light
          setIsFlashlightOn(true);
          Vibration.vibrate(1000);

          flashTimeout = setTimeout(() => {
            setIsFlashlightOn(false);
          }, 1000);
        } else {
          setPhase(phaseRef.current);
        }
      }, UPDATE_RATE);
    };

    requestPermissionAndStartFlashing();

    return () => {
      if (phaseInterval) {
        clearInterval(phaseInterval);
      }
      if (flashTimeout) {
        clearTimeout(flashTimeout);
      }
    };
  }, [permission]);

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
      <Text style={styles.phaseText}>
        Phase: {(phase * 100).toFixed(0)}%
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
  phaseText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
});
