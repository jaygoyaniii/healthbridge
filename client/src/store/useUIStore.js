import { create } from 'zustand';

/**
 * Global UI State (Sidebar, Modals, Theme)
 */
const useUIStore = create((set) => ({
  // Sidebar State
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),

  // Modal State
  activeModal: null,
  modalData: null,
  openModal: (modalName, data = null) => set({ activeModal: modalName, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));

export default useUIStore;
