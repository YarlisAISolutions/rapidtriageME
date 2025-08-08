/**
 * Main store configuration using Zustand
 * Provides centralized state management for the application
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { User, TriageReport, AppSettings, RootState } from './types';

// Custom storage for Zustand persistence using Expo SecureStore
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error('Error getting item from SecureStore:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('Error setting item in SecureStore:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('Error removing item from SecureStore:', error);
    }
  },
};

// Auth Store
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Mock login - replace with actual API call
          const mockUser: User = {
            id: '1',
            email,
            firstName: 'John',
            lastName: 'Doe',
            subscription: {
              tierId: 'free',
              status: 'active',
              usage: {
                scansUsed: 3,
                scansLimit: 10
              }
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          set({ user: mockUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false 
          });
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Triage Store
interface TriageStore {
  reports: TriageReport[];
  currentScan: TriageReport | null;
  isScanning: boolean;
  error: string | null;
  
  // Actions
  addReport: (report: TriageReport) => void;
  updateReport: (id: string, updates: Partial<TriageReport>) => void;
  setCurrentScan: (scan: TriageReport | null) => void;
  setScanning: (scanning: boolean) => void;
  setError: (error: string | null) => void;
  startScan: (url: string) => Promise<void>;
  clearError: () => void;
}

export const useTriageStore = create<TriageStore>()((set, get) => ({
  reports: [],
  currentScan: null,
  isScanning: false,
  error: null,

  addReport: (report) => set((state) => ({ 
    reports: [report, ...state.reports] 
  })),
  
  updateReport: (id, updates) => set((state) => ({
    reports: state.reports.map(report => 
      report.id === id ? { ...report, ...updates } : report
    )
  })),
  
  setCurrentScan: (currentScan) => set({ currentScan }),
  setScanning: (isScanning) => set({ isScanning }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  startScan: async (url: string) => {
    const newScan: TriageReport = {
      id: Date.now().toString(),
      url,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    set({ isScanning: true, currentScan: newScan, error: null });
    get().addReport(newScan);
    
    try {
      // Mock scan process - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const completedScan: TriageReport = {
        ...newScan,
        status: 'completed',
        completedAt: new Date().toISOString(),
        results: {
          performance: {
            score: 85,
            metrics: {
              firstContentfulPaint: 1200,
              largestContentfulPaint: 2400,
              cumulativeLayoutShift: 0.1,
              totalBlockingTime: 300,
              speedIndex: 1800
            },
            opportunities: []
          },
          accessibility: { score: 95, violations: [] },
          seo: { score: 90, audits: [] },
          bestPractices: { score: 88, audits: [] }
        }
      };
      
      get().updateReport(newScan.id, completedScan);
      set({ currentScan: completedScan, isScanning: false });
    } catch (error) {
      get().updateReport(newScan.id, { status: 'failed' });
      set({ 
        error: error instanceof Error ? error.message : 'Scan failed',
        isScanning: false 
      });
    }
  },
}));

// Growth Store
interface GrowthStore {
  // Trial state
  trialStatus: {
    isActive: boolean;
    daysRemaining: number;
    endDate?: string;
    hasExtended: boolean;
    extensionOffered: boolean;
  } | null;
  
  // Referral state
  referralCode: string | null;
  referralStats: {
    totalReferrals: number;
    successfulReferrals: number;
    availableRewards: number;
  } | null;
  
  // Onboarding state
  onboardingProgress: {
    currentStep: number;
    totalSteps: number;
    completedSteps: string[];
    isComplete: boolean;
    personalization: Record<string, any>;
  } | null;
  
  // Growth feature flags
  featureFlags: {
    showUpgradePrompts: boolean;
    enableEmailCapture: boolean;
    enableNPSSurveys: boolean;
    enableAchievements: boolean;
  };
  
  // Actions
  setTrialStatus: (status: GrowthStore['trialStatus']) => void;
  setReferralCode: (code: string | null) => void;
  setReferralStats: (stats: GrowthStore['referralStats']) => void;
  setOnboardingProgress: (progress: GrowthStore['onboardingProgress']) => void;
  updateFeatureFlags: (flags: Partial<GrowthStore['featureFlags']>) => void;
}

// App Store
interface AppStore {
  settings: AppSettings;
  isOnboardingComplete: boolean;
  networkStatus: 'connected' | 'disconnected' | 'unknown';
  
  // Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setNetworkStatus: (status: 'connected' | 'disconnected' | 'unknown') => void;
}

export const useGrowthStore = create<GrowthStore>()(
  persist(
    (set) => ({
      trialStatus: null,
      referralCode: null,
      referralStats: null,
      onboardingProgress: null,
      featureFlags: {
        showUpgradePrompts: true,
        enableEmailCapture: true,
        enableNPSSurveys: true,
        enableAchievements: true,
      },

      setTrialStatus: (trialStatus) => set({ trialStatus }),
      setReferralCode: (referralCode) => set({ referralCode }),
      setReferralStats: (referralStats) => set({ referralStats }),
      setOnboardingProgress: (onboardingProgress) => set({ onboardingProgress }),
      updateFeatureFlags: (flags) => set((state) => ({
        featureFlags: { ...state.featureFlags, ...flags }
      })),
    }),
    {
      name: 'growth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      settings: {
        theme: 'system',
        notifications: {
          push: true,
          email: true,
          reportComplete: true,
          weeklyDigest: false
        },
        privacy: {
          analytics: false,
          crashReporting: false
        }
      },
      isOnboardingComplete: false,
      networkStatus: 'unknown',

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      setOnboardingComplete: (isOnboardingComplete) => set({ isOnboardingComplete }),
      setNetworkStatus: (networkStatus) => set({ networkStatus }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);