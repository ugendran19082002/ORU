import { useState, useEffect, useCallback } from 'react';
import { systemApi } from '@/api/systemApi';

export interface MaintenanceConfig {
  maintenance: boolean;
  startTime: string;
  endTime: string;
  message: string;
}

const DEFAULT: MaintenanceConfig = { maintenance: false, startTime: '', endTime: '', message: '' };

export function useMaintenance() {
  const [config, setConfig] = useState<MaintenanceConfig>(DEFAULT);
  const [checked, setChecked] = useState(false);

  const check = useCallback(async () => {
    try {
      const res = await systemApi.getSetting('maintenance');
      if (res.data?.setting_value) {
        const parsed = JSON.parse(res.data.setting_value);
        setConfig(parsed);
      }
    } catch {
      // Network error or setting missing — don't block app
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    check();
    // Re-check every 5 minutes
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { isMaintenance: config.maintenance, config, checked, recheck: check };
}
