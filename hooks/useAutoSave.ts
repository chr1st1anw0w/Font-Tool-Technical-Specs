import { useEffect, useRef } from 'react';
import { TransformParams } from '../types';

interface AutoSaveData {
  params: TransformParams;
  selectedLetter: string | null;
  timestamp: number;
}

export const useAutoSave = (
  params: TransformParams,
  selectedLetter: string | null,
  interval: number = 30000 // 30秒自動儲存
) => {
  // FIX: Use ReturnType<typeof setTimeout> for timeout ref to be environment-agnostic (works in browser and Node).
  // FIX: Initialize useRef with null to fix "Expected 1 arguments, but got 0" error.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveToStorage = (data: AutoSaveData) => {
    try {
      localStorage.setItem('skywalk-autosave', JSON.stringify(data));
      console.log('Auto-saved at', new Date().toLocaleTimeString());
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  };

  const loadFromStorage = (): AutoSaveData | null => {
    try {
      const saved = localStorage.getItem('skywalk-autosave');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load auto-save data:', error);
      return null;
    }
  };

  const clearAutoSave = () => {
    try {
      localStorage.removeItem('skywalk-autosave');
    } catch (error) {
      console.warn('Failed to clear auto-save data:', error);
    }
  };

  // 自動儲存邏輯
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const autoSaveData: AutoSaveData = {
        params,
        selectedLetter,
        timestamp: Date.now()
      };
      saveToStorage(autoSaveData);
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [params, selectedLetter, interval]);

  return {
    loadFromStorage,
    clearAutoSave,
    saveToStorage
  };
};

export default useAutoSave;