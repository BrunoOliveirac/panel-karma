import { create } from "zustand";
import { LoggedUser } from "../types/logged-user";

type LoggedUserState = {
  user: LoggedUser | null;
  setUser: (value: LoggedUser | null) => void;
};

export const useLoggedUserStore = create<LoggedUserState>((set) => ({
  user: null,
  setUser: (value) => set({ user: value }),
}));
