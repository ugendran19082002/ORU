// Removed top-level import to prevent Expo Go crash in SDK 53
// import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Configure how notifications are handled when the app is in the foreground
 */
if (Constants.appOwnership !== 'expo') {
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request permissions and register for push notifications
 */
export async function registerForPushNotificationsAsync() {
  const Notifications = require('expo-notifications');
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#005d90',
      sound: 'default', // Ensures standard notification sound plays
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }
    
    // Remote push tokens are no longer supported in Expo Go for SDK 53+
    // We check appOwnership to avoid the console error/crash
    if (Constants.appOwnership === 'expo') {
      console.warn('⚠️ [NOTIF] Remote push tokens require a Development Build in SDK 53+. Skipping token fetch in Expo Go.');
      return;
    }

    // Project ID from Expo config
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
      
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      console.log('Push Token:', token);
    } catch (e) {
      console.error('Error fetching push token:', e);
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Manually trigger a local notification with sound (for testing)
 */
export async function scheduleTestNotification() {
  const Notifications = require('expo-notifications');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "ThanniGo Update 🔔",
      body: 'Your water delivery is on the way! Tap to track.',
      sound: 'default', // Trigger system sound
      data: { url: '/order/tracking' },
    },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2 
    },
  });
}
