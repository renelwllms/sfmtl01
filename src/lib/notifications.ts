export function playNotificationSound() {
  if (typeof window === 'undefined') return;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);

  setTimeout(() => {
    oscillator.frequency.value = 600;
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);

    oscillator2.frequency.value = 600;
    oscillator2.type = 'sine';

    gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.5);
  }, 200);
}

export async function getUserSettings() {
  try {
    const response = await fetch('/api/user/settings');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching user settings:', error);
  }
  return null;
}

export async function updateUserSettings(settings: {
  notificationsEnabled?: boolean;
  soundNotificationsEnabled?: boolean;
}) {
  try {
    const response = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
  }
  return null;
}
