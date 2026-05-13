import { create } from "zustand";

type AppStore = {
  title: string;
  setTitle: (value: string) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  title: "Karma",
  setTitle: (value) => set({ title: value }),
}));
