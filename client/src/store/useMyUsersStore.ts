import { create } from 'zustand'

type UserList = {
  username: string; avatar: string 
} []

type UsersState = {
  users: UserList;
}

type UsersAction = {
  setMyUsers: (users: UserList) => void,
  resetMyUsers: () => void
};

export const useMyUsersStore = create<UsersState & UsersAction>((set) => ({
  users: [],
  setMyUsers: (users) => set({ users: users }),
  resetMyUsers: () => set({ users: [] }),
}));