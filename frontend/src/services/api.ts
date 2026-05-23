const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  // Construct dynamic query params if provided
  let url = `${API_BASE}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  // Retrieve cached token from localStorage
  const headers = new Headers(options.headers || {});
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nk_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Default header JSON content type
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorDetail;
      } catch {
        // JSON parsing failed
      }
      
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('nk_token');
        localStorage.removeItem('nk_user');
      }
      
      console.error(`[API Error] ${options.method || 'GET'} ${url}:`, errorDetail);
      throw new Error(errorDetail);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error(`[API Connection Error] Failed to connect to ${url}. Ensure the backend is running and NEXT_PUBLIC_API_URL is set correctly.`);
      throw new Error('Could not connect to the server. Please check your internet or try again later.');
    }
    throw error;
  }
}

export async function uploadMedia(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const headers = new Headers();
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nk_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorDetail = 'File upload failed';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorDetail;
      } catch {
        // JSON parsing failed
      }
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('nk_token');
        localStorage.removeItem('nk_user');
      }
      throw new Error(errorDetail);
    }

    return response.json();
  } catch (error) {
    console.error('[Upload Error]:', error);
    throw error;
  }
}
