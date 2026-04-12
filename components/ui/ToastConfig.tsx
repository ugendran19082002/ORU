import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BaseToast, ErrorToast, InfoToast, ToastConfig } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * Premium Toast Configuration for ThanniGo
 * Design: Minimalist, glassmorphic tint, vibrant colors, sleek typography.
 */
export const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: '#10b981', 
        backgroundColor: '#ffffff',
        height: 70,
        width: width * 0.9,
        borderRadius: 16,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderLeftWidth: 6,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '800',
        color: '#065f46'
      }}
      text2Style={{
        fontSize: 13,
        color: '#374151',
        fontWeight: '500'
      }}
      renderLeadingIcon={() => (
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
        </View>
      )}
    />
  ),

  error: (props) => (
    <ErrorToast
      {...props}
      style={{ 
        borderLeftColor: '#f43f5e', 
        backgroundColor: '#ffffff',
        height: 70,
        width: width * 0.9,
        borderRadius: 16,
        shadowColor: '#f43f5e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderLeftWidth: 6,
      }}
      text1Style={{
        fontSize: 15,
        fontWeight: '800',
        color: '#9f1239'
      }}
      text2Style={{
        fontSize: 13,
        color: '#374151',
        fontWeight: '500'
      }}
      renderLeadingIcon={() => (
        <View style={styles.iconWrap}>
          <Ionicons name="close-circle" size={24} color="#f43f5e" />
        </View>
      )}
    />
  ),

  info: (props) => (
    <InfoToast
      {...props}
      style={{ 
        borderLeftColor: '#0ea5e9', 
        backgroundColor: '#ffffff',
        height: 70,
        width: width * 0.9,
        borderRadius: 16,
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderLeftWidth: 6,
      }}
      text1Style={{
        fontSize: 15,
        fontWeight: '800',
        color: '#075985'
      }}
      text2Style={{
        fontSize: 13,
        color: '#374151',
        fontWeight: '500'
      }}
      renderLeadingIcon={() => (
        <View style={styles.iconWrap}>
          <Ionicons name="information-circle" size={24} color="#0ea5e9" />
        </View>
      )}
    />
  )
};

const styles = StyleSheet.create({
  iconWrap: {
    paddingLeft: 15,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
