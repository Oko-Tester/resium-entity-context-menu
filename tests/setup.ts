import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.Cesium for tests
Object.defineProperty(window, 'Cesium', {
  value: {
    SceneTransforms: {
      wgs84ToWindowCoordinates: vi.fn().mockReturnValue({ x: 100, y: 200 }),
    },
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Cleanup after each test
afterEach(() => {
  // Clear any remaining timers
  vi.clearAllTimers();

  // Clear all DOM events
  const events = ['contextmenu', 'click', 'mousemove', 'touchstart', 'touchend', 'keydown'];
  events.forEach((event) => {
    const listeners = document.listeners?.[event] || [];
    listeners.forEach((listener: EventListenerOrEventListenerObject) => {
      document.removeEventListener(event, listener);
    });
  });
});

// Setup fake timers for each test
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
