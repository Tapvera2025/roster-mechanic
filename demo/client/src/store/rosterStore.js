import { create } from 'zustand';

export const useRosterStore = create((set) => ({
  selectedDate: new Date(),
  viewMode: 'week', // 'day', 'week', 'month'

  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
