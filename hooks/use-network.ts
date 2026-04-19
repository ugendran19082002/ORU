import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected !== false);
      setIsChecking(false);
    });

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected !== false);
    });

    return () => unsubscribe();
  }, []);

  const retry = () => {
    setIsChecking(true);
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected !== false);
      setIsChecking(false);
    });
  };

  return { isConnected, isChecking, retry };
}
