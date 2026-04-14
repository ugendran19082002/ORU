import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native';
import { useSecurityStore } from '@/stores/securityStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type PinEntryModalProps = {
  visible: boolean;
  onSuccess: (pin: string) => Promise<void> | void;
  onCancel?: () => void;
  title?: string;
  mode?: 'verify' | 'set' | 'confirm';
  onSetPin?: (pin: string) => void;
};

export const PinEntryModal: React.FC<PinEntryModalProps> = ({
  visible,
  onSuccess,
  onCancel,
  title = 'Enter PIN',
  mode = 'verify',
  onSetPin,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentStep, setCurrentStep] = useState<'enter' | 'confirm'>(mode === 'set' ? 'enter' : 'enter');
  const { isBiometricsEnabled, authenticateBiometrics } = useSecurityStore();
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && mode === 'verify' && isBiometricsEnabled) {
      handleBiometrics();
    }
    if (!visible) {
        setPin('');
        setIsLoading(false);
        setError(false);
    }
  }, [visible]);

  const handleBiometrics = async () => {
    const success = await authenticateBiometrics();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(''); // Pass empty for biometrics as PIN is not used
    }
  };

  const handleKeyPress = (key: string) => {
    if (pin.length >= 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPin = pin + key;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      handleComplete(newPin);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const handleComplete = async (finalPin: string) => {
    if (mode === 'verify') {
      try {
        setIsLoading(true);
        setError(false);
        setErrorMessage('');
        await onSuccess(finalPin);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(true);
        setPin('');
        
        // Extract message from backend response if available
        const backendMsg = err.response?.data?.message || err.message;
        setErrorMessage(backendMsg || 'Incorrect PIN');
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'set') {
      if (currentStep === 'enter') {
        setConfirmPin(finalPin);
        setPin('');
        setCurrentStep('confirm');
      } else {
        if (finalPin === confirmPin) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSetPin?.(finalPin);
          onSuccess(finalPin);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError(true);
          setErrorMessage('PINs do not match');
          setPin('');
          setCurrentStep('enter');
          setConfirmPin('');
        }
      }
    }
  };

  const renderDot = (index: number) => {
    const active = pin.length > index;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          active && styles.dotActive,
          error && styles.dotError,
        ]}
      />
    );
  };

  const renderKey = (key: string) => (
    <TouchableOpacity
      key={key}
      style={styles.key}
      onPress={() => handleKeyPress(key)}
    >
      <Text style={styles.keyText}>{key}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.content}>
          {onCancel && (
            <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          )}

          <Text style={styles.title}>
            {currentStep === 'confirm' ? 'Confirm PIN' : title}
          </Text>
          
          <View style={styles.dotsContainer}>
            {isLoading ? <ActivityIndicator color="#005d90" /> : [0, 1, 2, 3].map(renderDot)}
          </View>

          {error && (
            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
          )}

          <View style={styles.keypad}>
            <View style={styles.row}>
              {[1, 2, 3].map(k => renderKey(k.toString()))}
            </View>
            <View style={styles.row}>
              {[4, 5, 6].map(k => renderKey(k.toString()))}
            </View>
            <View style={styles.row}>
              {[7, 8, 9].map(k => renderKey(k.toString()))}
            </View>
            <View style={styles.row}>
              {mode === 'verify' && isBiometricsEnabled ? (
                <TouchableOpacity style={styles.key} onPress={handleBiometrics}>
                  <Ionicons name="finger-print" size={28} color="#005d90" />
                </TouchableOpacity>
              ) : (
                <View style={styles.key} />
              )}
              {renderKey('0')}
              <TouchableOpacity style={styles.key} onPress={handleDelete}>
                <Ionicons name="backspace-outline" size={24} color="#181c20" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#181c20',
    marginBottom: 30,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  dotActive: {
    backgroundColor: '#005d90',
    borderColor: '#005d90',
  },
  dotError: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  keypad: {
    width: width * 0.8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#181c20',
  },
});
