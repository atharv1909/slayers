import { create } from "zustand";

interface Candidate {
  id: string;
  name: string;
  smiles: string;
  type: string;
  predicted_activity: number;
  predicted_selectivity: number;
  predicted_stability: number;
  actual_yield?: number;
  actual_selectivity?: number;
  actual_stability?: number;
  metal_type?: string;
  support_material?: string;
  [key: string]: any;
}

interface AppContext {
  currentPage: string;
  selectedCandidate: Candidate | null;
  currentReaction: string;
  currentProjectId: string | null;
  recentActions: string[];
  discoveryResults: Candidate[];
  isDiscovering: boolean;
  setContext: (ctx: Partial<AppContext>) => void;
  addAction: (action: string) => void;
  setSelectedCandidate: (candidate: Candidate | null) => void;
  setDiscoveryResults: (results: Candidate[]) => void;
  setIsDiscovering: (val: boolean) => void;
}

export const useAppContext = create<AppContext>((set) => ({
  currentPage: "dashboard",
  selectedCandidate: null,
  currentReaction: "CO2 + H2 → Methanol",
  currentProjectId: null,
  recentActions: [],
  discoveryResults: [],
  isDiscovering: false,
  setContext: (ctx) => set((state) => ({ ...state, ...ctx })),
  addAction: (action) =>
    set((state) => ({
      recentActions: [action, ...state.recentActions].slice(0, 10),
    })),
  setSelectedCandidate: (candidate) =>
    set(() => ({ selectedCandidate: candidate })),
  setDiscoveryResults: (results) => set(() => ({ discoveryResults: results })),
  setIsDiscovering: (val) => set(() => ({ isDiscovering: val })),
}));
