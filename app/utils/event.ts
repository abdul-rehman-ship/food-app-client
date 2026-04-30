// src/utils/events.ts
export const favoritesEvents = {
  addEventListener: (callback: () => void) => {
    window.addEventListener('favorites-updated', callback);
  },
  removeEventListener: (callback: () => void) => {
    window.removeEventListener('favorites-updated', callback);
  },
  dispatch: () => {
    window.dispatchEvent(new Event('favorites-updated'));
  }
};