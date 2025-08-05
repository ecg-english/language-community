import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import axios from 'axios';

interface Category {
  id: number;
  name: string;
  is_collapsed: boolean;
  display_order: number;
  created_at: string;
}

interface Channel {
  id: number;
  name: string;
  description: string;
  category_id: number;
  channel_type: string;
  post_count: number;
  display_order: number;
  created_at: string;
}

interface Post {
  id: number;
  content: string;
  user_id: number;
  channel_id: number;
  username: string;
  role: string;
  avatar_url?: string;
  like_count: number;
  comment_count: number;
  user_liked: number;
  created_at: string;
}

interface Comment {
  id: number;
  content: string;
  user_id: number;
  post_id: number;
  username: string;
  role: string;
  avatar_url?: string;
  created_at: string;
}

interface CommunityContextType {
  categories: Category[];
  channels: { [categoryId: number]: Channel[] };
  posts: { [channelId: number]: Post[] };
  comments: { [postId: number]: Comment[] };
  loadCategories: () => Promise<void>;
  loadChannels: (categoryId: number) => Promise<void>;
  toggleCategory: (categoryId: number) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  createChannel: (categoryId: number, name: string, description: string, channelType: string) => Promise<void>;
  deleteChannel: (channelId: number) => Promise<void>;
  reorderCategories: (categoryIds: number[]) => Promise<void>;
  reorderChannels: (channelIds: number[]) => Promise<void>;
  loadPosts: (channelId: number) => Promise<void>;
  createPost: (channelId: number, content: string) => Promise<void>;
  deletePost: (postId: number) => Promise<void>;
  likePost: (postId: number) => Promise<void>;
  loadComments: (postId: number) => Promise<void>;
  createComment: (postId: number, content: string) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};

interface CommunityProviderProps {
  children: ReactNode;
}

export const CommunityProvider: React.FC<CommunityProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<{ [categoryId: number]: Channel[] }>({});
  const [posts, setPosts] = useState<{ [channelId: number]: Post[] }>({});
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({});

  const loadCategories = useCallback(async () => {
    try {
      const response = await axios.get('/api/channels/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('カテゴリ読み込みエラー:', error);
      throw error;
    }
  }, []);

  const loadChannels = useCallback(async (categoryId: number) => {
    try {
      const response = await axios.get(`/api/channels/categories/${categoryId}/channels`);
      setChannels(prev => ({
        ...prev,
        [categoryId]: response.data.channels || []
      }));
    } catch (error) {
      console.error('チャンネル読み込みエラー:', error);
      throw error;
    }
  }, []);

  const toggleCategory = useCallback(async (categoryId: number) => {
    try {
      const response = await axios.put(`/api/channels/categories/${categoryId}/toggle`);
      const { is_collapsed } = response.data;
      
      setCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, is_collapsed }
            : cat
        )
      );
    } catch (error) {
      console.error('カテゴリ切り替えエラー:', error);
      throw error;
    }
  }, []);

  const createCategory = useCallback(async (name: string) => {
    try {
      const response = await axios.post('/api/channels/categories', { name });
      const newCategory = response.data.category;
      setCategories(prev => [...prev, newCategory]);
    } catch (error) {
      console.error('カテゴリ作成エラー:', error);
      throw error;
    }
  }, []);

  const createChannel = useCallback(async (categoryId: number, name: string, description: string, channelType: string) => {
    try {
      const response = await axios.post(`/api/channels/categories/${categoryId}/channels`, {
        name,
        description,
        channel_type: channelType
      });
      const newChannel = response.data.channel;
      
      setChannels(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), newChannel]
      }));
    } catch (error) {
      console.error('チャンネル作成エラー:', error);
      throw error;
    }
  }, []);

  const deleteChannel = useCallback(async (channelId: number) => {
    try {
      await axios.delete(`/api/channels/channels/${channelId}`);
      
      // すべてのカテゴリからチャンネルを削除
      setChannels(prev => {
        const newChannels = { ...prev };
        Object.keys(newChannels).forEach(categoryId => {
          newChannels[Number(categoryId)] = newChannels[Number(categoryId)].filter(
            channel => channel.id !== channelId
          );
        });
        return newChannels;
      });
      
      // 関連する投稿とコメントも削除
      setPosts(prev => {
        const newPosts = { ...prev };
        delete newPosts[channelId];
        return newPosts;
      });
    } catch (error) {
      console.error('チャンネル削除エラー:', error);
      throw error;
    }
  }, []);

  const loadPosts = useCallback(async (channelId: number) => {
    try {
      const response = await axios.get(`/api/posts/channels/${channelId}/posts`);
      setPosts(prev => ({
        ...prev,
        [channelId]: response.data.posts || []
      }));
    } catch (error) {
      console.error('投稿読み込みエラー:', error);
      throw error;
    }
  }, []);

  const createPost = useCallback(async (channelId: number, content: string) => {
    try {
      const response = await axios.post(`/api/posts/channels/${channelId}/posts`, { content });
      const newPost = response.data.post;
      
      setPosts(prev => ({
        ...prev,
        [channelId]: [newPost, ...(prev[channelId] || [])]
      }));
    } catch (error) {
      console.error('投稿作成エラー:', error);
      throw error;
    }
  }, []);

  const deletePost = useCallback(async (postId: number) => {
    try {
      await axios.delete(`/api/posts/posts/${postId}`);
      
      // すべてのチャンネルから投稿を削除
      setPosts(prev => {
        const newPosts = { ...prev };
        Object.keys(newPosts).forEach(channelId => {
          newPosts[Number(channelId)] = newPosts[Number(channelId)].filter(
            post => post.id !== postId
          );
        });
        return newPosts;
      });
      
      // 関連するコメントも削除
      setComments(prev => {
        const newComments = { ...prev };
        delete newComments[postId];
        return newComments;
      });
    } catch (error) {
      console.error('投稿削除エラー:', error);
      throw error;
    }
  }, []);

  const likePost = useCallback(async (postId: number) => {
    try {
      const response = await axios.post(`/api/posts/posts/${postId}/like`);
      const { liked } = response.data;
      
      setPosts(prev => {
        const newPosts = { ...prev };
        Object.keys(newPosts).forEach(channelId => {
          newPosts[Number(channelId)] = newPosts[Number(channelId)].map(post => {
            if (post.id === postId) {
              return {
                ...post,
                like_count: liked ? post.like_count + 1 : post.like_count - 1,
                user_liked: liked ? 1 : 0
              };
            }
            return post;
          });
        });
        return newPosts;
      });
    } catch (error) {
      console.error('いいねエラー:', error);
      throw error;
    }
  }, []);

  const loadComments = useCallback(async (postId: number) => {
    try {
      const response = await axios.get(`/api/posts/posts/${postId}/comments`);
      setComments(prev => ({
        ...prev,
        [postId]: response.data.comments || []
      }));
    } catch (error) {
      console.error('コメント読み込みエラー:', error);
      throw error;
    }
  }, []);

  const createComment = useCallback(async (postId: number, content: string) => {
    try {
      const response = await axios.post(`/api/posts/posts/${postId}/comments`, { content });
      const newComment = response.data.comment;
      
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
      
      // 投稿のコメント数を更新
      setPosts(prev => {
        const newPosts = { ...prev };
        Object.keys(newPosts).forEach(channelId => {
          newPosts[Number(channelId)] = newPosts[Number(channelId)].map(post => {
            if (post.id === postId) {
              return {
                ...post,
                comment_count: post.comment_count + 1
              };
            }
            return post;
          });
        });
        return newPosts;
      });
    } catch (error) {
      console.error('コメント作成エラー:', error);
      throw error;
    }
  }, []);

  const deleteComment = useCallback(async (commentId: number) => {
    try {
      await axios.delete(`/api/posts/comments/${commentId}`);
      
      // すべての投稿からコメントを削除
      setComments(prev => {
        const newComments = { ...prev };
        Object.keys(newComments).forEach(postId => {
          newComments[Number(postId)] = newComments[Number(postId)].filter(
            comment => comment.id !== commentId
          );
        });
        return newComments;
      });
    } catch (error) {
      console.error('コメント削除エラー:', error);
      throw error;
    }
  }, []);

  const value = {
    categories,
    channels,
    posts,
    comments,
    loadCategories,
    loadChannels,
    toggleCategory,
    createCategory,
    createChannel,
    deleteChannel,
    reorderCategories: async (categoryIds: number[]) => {
      try {
        await axios.put('/api/channels/categories/reorder', { categoryIds });
        await loadCategories();
      } catch (error) {
        console.error('カテゴリ並び替えエラー:', error);
        throw error;
      }
    },
    reorderChannels: async (channelIds: number[]) => {
      try {
        await axios.put('/api/channels/channels/reorder', { channelIds });
        // 全カテゴリのチャンネルを再読み込み
        for (const category of categories) {
          await loadChannels(category.id);
        }
      } catch (error) {
        console.error('チャンネル並び替えエラー:', error);
        throw error;
      }
    },
    loadPosts,
    createPost,
    deletePost,
    likePost,
    loadComments,
    createComment,
    deleteComment,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}; 