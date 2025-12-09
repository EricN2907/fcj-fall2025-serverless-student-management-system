import { create } from 'zustand'

interface NotificationUIState {
  isOpen: boolean
  openNotificationPanel: () => void
  closeNotificationPanel: () => void
  toggleNotificationPanel: () => void
}

export const useNotificationUIStore = create<NotificationUIState>((set) => ({
  isOpen: false,
  openNotificationPanel: () => set({ isOpen: true }),
  closeNotificationPanel: () => set({ isOpen: false }),
  toggleNotificationPanel: () => set((state) => ({ isOpen: !state.isOpen }))
}))
