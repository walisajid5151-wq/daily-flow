import { useState, useEffect } from "react";

interface DaySettings {
  dayStart: string; // e.g., "06:00"
  dayEnd: string;   // e.g., "18:00"
}

const DEFAULT_SETTINGS: DaySettings = {
  dayStart: "06:00",
  dayEnd: "18:00",
};

export function useDaySettings() {
  const [settings, setSettings] = useState<DaySettings>(() => {
    const stored = localStorage.getItem("planit-day-settings");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("planit-day-settings", JSON.stringify(settings));
  }, [settings]);

  const updateDayStart = (time: string) => {
    setSettings(prev => ({ ...prev, dayStart: time }));
  };

  const updateDayEnd = (time: string) => {
    setSettings(prev => ({ ...prev, dayEnd: time }));
  };

  // Check if current time is within the active day
  const isWithinActiveDay = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.dayStart.split(':').map(Number);
    const [endHour, endMin] = settings.dayEnd.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  // Check if it's end of day (within 30 mins of day end)
  const isEndOfDay = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [endHour, endMin] = settings.dayEnd.split(':').map(Number);
    const endMinutes = endHour * 60 + endMin;
    
    return currentMinutes >= endMinutes - 30 && currentMinutes <= endMinutes + 60;
  };

  return {
    ...settings,
    updateDayStart,
    updateDayEnd,
    isWithinActiveDay,
    isEndOfDay,
  };
}
