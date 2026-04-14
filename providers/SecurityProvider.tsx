import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSecurityStore } from '@/stores/securityStore';
import { PinEntryModal } from '@/components/security/PinEntryModal';

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPinEnabled, isLocked, setLocked, initialize } = useSecurityStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isPinEnabled]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to the foreground
      if (isPinEnabled) {
        setLocked(true);
      }
    }
    appState.current = nextAppState;
  };

  return (
    <>
      {children}
      <PinEntryModal
        visible={isLocked && isPinEnabled}
        onSuccess={() => setLocked(false)}
        title="App Locked"
        mode="verify"
      />
    </>
  );
};
