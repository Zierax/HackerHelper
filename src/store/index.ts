import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createSelectors } from './selectors'

interface AppState {
  // UI State
  isDarkMode: boolean
  setDarkMode: (isDark: boolean) => void
  
  // Auth State
  isAuthenticated: boolean
  user: User | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  
  // Tool States
  activeTab: string
  setActiveTab: (tab: string) => void
  
  // Security Scan Results
  scanResults: ScanResult[]
  addScanResult: (result: ScanResult) => void
  clearScanResults: () => void
}

interface User {
  id: string
  email: string
  name: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface ScanResult {
  id: string
  type: string
  timestamp: number
  findings: unknown[]
}

const useStoreBase = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // UI State
        isDarkMode: false,
        setDarkMode: (isDark) => set({ isDarkMode: isDark }),
        
        // Auth State
        isAuthenticated: false,
        user: null,
        login: async (credentials) => {
          try {
            // Implement login logic here
            set({ isAuthenticated: true, user: { id: '1', email: credentials.email, name: 'User' } })
          } catch (error) {
            console.error('Login failed:', error)
            throw error
          }
        },
        logout: () => set({ isAuthenticated: false, user: null }),
        
        // Tool States
        activeTab: 'Chat',
        setActiveTab: (tab) => set({ activeTab: tab }),
        
        // Security Scan Results
        scanResults: [],
        addScanResult: (result) => 
          set((state) => ({ 
            scanResults: [...state.scanResults, result]
          })),
        clearScanResults: () => set({ scanResults: [] }),
      }),
      {
        name: 'hacker-helper-storage',
        partialize: (state) => ({
          isDarkMode: state.isDarkMode,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
)

export const useStore = createSelectors(useStoreBase)

// Type-safe selectors
export const useDarkMode = () => useStore((state) => state.isDarkMode)
export const useIsAuthenticated = () => useStore((state) => state.isAuthenticated)
export const useUser = () => useStore((state) => state.user)
export const useActiveTab = () => useStore((state) => state.activeTab)
export const useScanResults = () => useStore((state) => state.scanResults)
