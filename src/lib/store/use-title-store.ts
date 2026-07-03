import { create } from "zustand";

type Title = {
  title: string;
  setTitle: (value: string) => void;
};

export const useTitle = create<Title>((set) => ({
  title: "Karma",
  setTitle: (value) => set({ title: value }),
}));
