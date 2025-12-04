// DEPRECATED: Storage logic has been moved to store.ts using Zustand's custom storage adapter.
// This file can be safely removed in future cleanups.

export const safeStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};