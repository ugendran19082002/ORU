import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ActivityIndicator, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const RoleSwitchModal: React.FC<Props> = ({ visible, onClose, onConfirm, loading }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={loading ? undefined : onClose}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        
        <View style={styles.container}>
          <View style={styles.card}>
            {/* Header with Icon */}
            <View style={styles.iconCircle}>
              <View style={styles.iconBg}>
                <Ionicons name="swap-horizontal" size={32} color="#ba1a1a" />
              </View>
            </View>

            <Text style={styles.title}>Switch Account Role?</Text>
            
            <View style={styles.warningBox}>
                <Ionicons name="alert-circle" size={18} color="#ba1a1a" />
                <Text style={styles.warningText}>
                    This action is <Text style={{fontWeight: '900'}}>permanent</Text>.
                </Text>
            </View>

            <Text style={styles.description}>
              Changing your role will <Text style={styles.bold}>erase all existing data</Text> for your current profile (orders, settings, and business info).
            </Text>

            <Text style={styles.subDescription}>
              You will be redirected to the role selection screen to start fresh.
            </Text>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Keep Current Role</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={onConfirm}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#ba1a1a', '#93000a']}
                  style={styles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Text style={styles.confirmText}>Reset & Switch</Text>
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffdad6',
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffdad6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: '#ba1a1a',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  bold: {
    color: '#ba1a1a',
    fontWeight: '800',
  },
  subDescription: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 32,
  },
  footer: {
    width: '100%',
    gap: 12,
  },
  confirmBtn: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelBtn: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
});
