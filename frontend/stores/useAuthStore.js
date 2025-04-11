"use client";
import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => {
    // Only update if the user actually changed
    set((state) => {
      if (JSON.stringify(state.user) === JSON.stringify(user)) {
        return state; // No change needed
      }
      return { user };
    });
  },
}));
