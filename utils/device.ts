import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'thannigo_original_device_id';

/**
 * Returns the original hardware/OS build ID or a fallback persisted ID.
 */
export async function getOriginalDeviceId(): Promise<string> {
  // 1. Try to get hardware ID from expo-device
  const hardwareId = Device.osInternalBuildId || Device.osBuildId;
  
  if (hardwareId) {
    return hardwareId;
  }

  // 2. Fallback: Check SecureStore for a previously generated ID
  try {
    let persistedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (persistedId) return persistedId;

    // 3. Generate a new one if all else fails
    const newId = `dev_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
    return newId;
    
  } catch (e) {
    return Device.modelName || 'UnknownDevice';
  }
}
