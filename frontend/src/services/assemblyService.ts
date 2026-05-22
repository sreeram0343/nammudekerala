import { apiFetch } from './api';

export interface AssemblyResponse {
  id: number;
  assembly_name: string;
  district: string;
  slug: string;
  constituency_type: string;
  followers_count: number;
  issue_count: number;
  mla_name: string | null;
  mla_verified: boolean;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface AssemblyStats {
  id: number;
  assembly_name: string;
  district: string;
  slug: string;
  constituency_type: string;
  followers_count: number;
  issue_count: number;
  mla_name: string | null;
  mla_verified: boolean;
  total_issues: number;
  resolved_issues: number;
  acknowledged_issues: number;
  ignored_issues: number;
  resolution_rate: number;
  created_at: string;
}

export interface GlobalStats {
  total_issues: number;
  resolved_issues: number;
  acknowledged_issues: number;
  reported_issues: number;
  resolution_rate: number;
  active_hotspot: string;
}

export const assemblyService = {
  getAssemblies: async (): Promise<AssemblyResponse[]> => {
    return apiFetch<AssemblyResponse[]>('/api/assemblies', {
      method: 'GET',
    });
  },

  getGlobalStats: async (): Promise<GlobalStats> => {
    return apiFetch<GlobalStats>('/api/stats', {
      method: 'GET',
    });
  },

  getAssemblyStats: async (name: string): Promise<AssemblyStats> => {
    return apiFetch<AssemblyStats>(`/api/assembly/${name}`, {
      method: 'GET',
    });
  },

  toggleFollow: async (
    assemblyId: number
  ): Promise<{ status: 'followed' | 'unfollowed'; followers_count: number }> => {
    return apiFetch<{ status: 'followed' | 'unfollowed'; followers_count: number }>(
      `/api/follows/assembly/${assemblyId}`,
      {
        method: 'POST',
      }
    );
  },
};
