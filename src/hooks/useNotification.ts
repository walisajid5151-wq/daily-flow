import { useEffect, useCallback } from "react";

export function useNotification() {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const playSound = useCallback((type: "alarm" | "gentle" | "success" = "gentle") => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === "alarm") {
      // Alarm sound - alternating frequencies
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.6);
    } else if (type === "success") {
      // Success chime - ascending notes
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } else {
      // Gentle notification
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  }, []);

  const notify = useCallback((title: string, options?: NotificationOptions & { sound?: "alarm" | "gentle" | "success" }) => {
    const { sound = "gentle", ...notifOptions } = options || {};
    
    playSound(sound);
    
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, {
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        requireInteraction: sound === "alarm",
        ...notifOptions,
      });
      
      return notification;
    }
    return null;
  }, [playSound]);

  return { notify, playSound };
}
