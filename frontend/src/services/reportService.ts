import { apiFetch } from './api';

export interface ReportResponse {
  id: number;
  user_id: number;
  post_id: number;
  reason: string;
  details: string | null;
  created_at: string;
}

export const reportService = {
  fileReport: async (reportData: {
    post_id: number;
    reason: string;
    details?: string | null;
  }): Promise<ReportResponse> => {
    return apiFetch<ReportResponse>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },
};
