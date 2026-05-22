import { apiFetch } from './api';

export interface RepresentativeReply {
  id: number;
  post_id: number;
  content: string;
  progress_proof_url: string | null;
  created_at: string;
  representative_name: string;
}

export interface PostResponse {
  id: number;
  title: string;
  content: string;
  media_url: string | null;
  assembly_id: number;
  assembly_name: string;
  assembly_slug: string;
  category: string;
  upvotes_count: number;
  downvotes_count: number;
  is_anonymous: boolean;
  status: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  comments_count: number;
  user_id: number | null;
  username: string;
  user_image: string | null;
  user_role: string;
  user_vote: 'up' | 'down' | null;
  replies: RepresentativeReply[];
}

export interface CommentResponse {
  id: number;
  post_id: number;
  user_id: number | null;
  username: string;
  user_image: string | null;
  user_role: string;
  parent_id: number | null;
  content: string;
  created_at: string;
  replies: CommentResponse[];
}

export const postService = {
  getPosts: async (
    assemblyName?: string,
    category?: string,
    sort: string = 'trending'
  ): Promise<PostResponse[]> => {
    const params: Record<string, string> = { sort };
    if (assemblyName) params.assembly_name = assemblyName;
    if (category) params.category = category;

    return apiFetch<PostResponse[]>('/api/posts', {
      method: 'GET',
      params,
    });
  },

  getPostById: async (postId: number): Promise<PostResponse> => {
    return apiFetch<PostResponse>(`/api/posts/${postId}`, {
      method: 'GET',
    });
  },

  createPost: async (postData: {
    title: string;
    content: string;
    media_url?: string | null;
    assembly_tag: string;
    category: string;
    is_anonymous?: boolean;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<PostResponse> => {
    return apiFetch<PostResponse>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  submitVote: async (
    postId: number,
    voteType: 'up' | 'down' | 'none'
  ): Promise<{ status: string; upvotes: number; downvotes: number }> => {
    return apiFetch<{ status: string; upvotes: number; downvotes: number }>('/api/vote', {
      method: 'POST',
      body: JSON.stringify({ post_id: postId, vote_type: voteType }),
    });
  },

  createComment: async (commentData: {
    post_id: number;
    content: string;
    parent_id?: number | null;
  }): Promise<CommentResponse> => {
    return apiFetch<CommentResponse>('/api/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },

  getComments: async (postId: number): Promise<CommentResponse[]> => {
    return apiFetch<CommentResponse[]>(`/api/comments/${postId}`, {
      method: 'GET',
    });
  },

  submitRepresentativeReply: async (
    postId: number,
    replyData: { content: string; progress_proof_url?: string | null },
    statusUpdate: 'acknowledged' | 'resolved' = 'acknowledged'
  ): Promise<RepresentativeReply> => {
    return apiFetch<RepresentativeReply>(`/api/posts/${postId}/reply?status_update=${statusUpdate}`, {
      method: 'POST',
      body: JSON.stringify(replyData),
    });
  },
};
