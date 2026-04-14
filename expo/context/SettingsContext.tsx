import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback } from 'react';
import { BusinessSettings } from '@/types/invoice';

const STORAGE_KEY = 'easyinvoice_settings';

const defaultSettings: BusinessSettings = {
  businessName: '',
  businessEmail: '',
  businessPhone: '',
  businessAddress: '',
  defaultCurrency: 'USD',
  logoUri: '',
};

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as BusinessSettings) : defaultSettings;
    },
  });

  useEffect(() => {
    if (settingsQuery.data) setSettings(settingsQuery.data);
  }, [settingsQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (updated: BusinessSettings) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => queryClient.setQueryData(['settings'], data),
  });

  const updateSettings = useCallback((partial: Partial<BusinessSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      syncMutation.mutate(updated);
      return updated;
    });
  }, [syncMutation]);

  return { settings, updateSettings, isLoading: settingsQuery.isLoading };
});
