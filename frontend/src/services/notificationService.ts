import { apiFetch } from './api';

export interface NotificationResponse {
  id: number;
  user_id: number;
  post_id: number | null;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationResponse[]> => {
    return apiFetch<NotificationResponse[]>('/api/notifications', {
      method: 'GET',
    });
  },

  markAsRead: async (notificationId: number): Promise<{ status: string }> => {
    return apiFetch<{ status: string }>(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  },
};
