import { router } from 'expo-router';
import { Alert } from 'react-native';

export type SearchParams = Record<string, string | number | boolean | undefined>;

/**
 * A safe wrapper for router.push with try-catch and logging.
 * This helps prevent app-exit crashes during navigation.
 */
export const safeNavigate = (
  route: string, 
  params?: SearchParams,
  errorCallback?: (error: Error) => void
) => {
  console.log('🔄 [SAFE NAV] Started');
  console.log('Target:', route);
  console.log('Params:', JSON.stringify(params));
  
  try {
    // Basic route validation
    if (!route || typeof route !== 'string') {
      throw new Error('Invalid route path: ' + route);
    }
    
    // Clean and validate params if present
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          console.warn(`⚠️ [SAFE NAV] Warning: ${key} is ${value}`);
        } else {
          // Router expects strings for params in most cases
          cleanParams[key] = value.toString();
        }
      });
    }
    
    // Attempt navigation
    if (Object.keys(cleanParams).length > 0) {
      router.push({ pathname: route as any, params: cleanParams });
    } else {
      router.push(route as any);
    }
    
    console.log('✅ [SAFE NAV] Command sent successfully');
    return true;
    
  } catch (error: any) {
    console.error('❌ [SAFE NAV] NAVIGATION FAILED');
    console.error('Error:', error);
    console.error('Type:', error?.constructor?.name);
    console.error('Stack:', error?.stack);
    
    Alert.alert(
      'Navigation Error',
      `Failed to navigate to ${route}. Please contact support or restart the app.`,
      [{ text: 'OK' }]
    );
    
    if (errorCallback) {
      errorCallback(error as Error);
    }
    
    return false;
  }
};
