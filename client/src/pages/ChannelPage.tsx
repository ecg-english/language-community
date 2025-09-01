import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Collapse,
  Paper,
  Stack,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Comment as CommentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
  Menu as MenuIcon,
  Add as AddIcon,
  Edit as EditIcon,
  BookmarkAdd as BookmarkAddIcon,
  Bookmark as BookmarkIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import ChannelSidebar from '../components/ChannelSidebar/ChannelSidebar';
import EventPost from '../components/EventPost/EventPost';
import EventPostForm from '../components/EventPostForm/EventPostForm';
import StudyLogPost from '../components/StudyLogPost/StudyLogPost';

interface Post {
  id: number;
  content: string;
  user_id: number;
  username: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  user_liked: number;
  image_url?: string;
  avatar_url?: string;
  event_id?: number;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  is_anonymous?: boolean; // Q&Aチャンネル用の匿名フラグ
  is_answered?: boolean; // Q&Aチャンネル用の回答済みフラグ
  is_study_log?: boolean; // Study Board用のフラグ
  study_tags?: string; // Study Board用のタグ（JSON文字列）
  target_language?: string; // Study Board用の学習言語
  ai_response_enabled?: boolean; // AI返信有効フラグ
  study_meaning?: string; // Study Board用の意味
}

interface Comment {
  id: number;
  content: string;
  user_id: number;
  username: string;
  role: string;
  created_at: string;
  avatar_url?: string;
}

interface Channel {
  id: number;
  name: string;
  channel_type: string;
  description: string;
}

interface Category {
  id: number;
  name: string;
  is_collapsed: boolean;
  channels: Channel[];
}

const ChannelPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  // コンポーネントマウント時のログ
  console.log('ChannelPage マウント:', { 
    channelId, 
    url: window.location.href,
    timestamp: new Date().toISOString()
  });

  const [channel, setChannel] = useState<Channel | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>({});
  const [expandedComments, setExpandedComments] = useState<{ [postId: number]: boolean }>({});
  const [canPost, setCanPost] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [pastEvents, setPastEvents] = useState<Post[]>([]);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [modalNewPost, setModalNewPost] = useState('');
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [qaContent, setQaContent] = useState('');
  const [isAnonymousQa, setIsAnonymousQa] = useState(false);
  const [showQaSuccess, setShowQaSuccess] = useState(false);
  const [showAnsweredQa, setShowAnsweredQa] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState<number | null>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [studyLogFormOpen, setStudyLogFormOpen] = useState(false);

  useEffect(() => {
    const numChannelId = parseInt(channelId || '0');
    console.log('ChannelPage useEffect 実行:', { 
      channelId, 
      numChannelId, 
      user: user?.username,
      userExists: !!user,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });

    const fetchChannelInfo = async () => {
      try {
        console.log('チャンネル情報取得開始:', { channelId: numChannelId, user: user?.username });
        setLoading(true);
        setError(null);
        
        // 状態をリセット
        setChannel(null);
        setPosts([]);
        setComments({});
        setExpandedComments({});
        setNewComment({});

        // チャンネル情報を取得
        const channelResponse = await axios.get(`/api/channels/channels/${numChannelId}`);
        const channelData = channelResponse.data.channel;
        console.log('チャンネル情報取得成功:', channelData);
        setChannel(channelData);
        
        // 投稿権限をチェック
        const hasPermission = checkPostPermission(channelData.channel_type, user?.role || '');
        setCanPost(hasPermission);

        // Eventsチャンネルの場合、イベント専用APIを呼び出す
        const isEventsChannel = channelData?.name === '🗓️ Events';
        console.log('チャンネル判定:', { channelName: channelData?.name, isEventsChannel });
        
        let postsData = [];
        if (isEventsChannel) {
          console.log('Eventsチャンネル: イベント専用APIを呼び出し');
          // 全イベントを取得（月に関係なく）
          try {
            const eventsResponse = await axios.get(`/api/events/all`);
            const events = eventsResponse.data.events || [];
            console.log('イベント取得成功:', { count: events.length, events });
            
            // イベントを投稿形式に変換（安全な変換）
            postsData = events.map((event: any) => ({
              id: event.id || 0,
              content: event.title || '',
              event_id: event.id || 0,
              event_date: event.event_date || '',
              start_time: event.start_time || '',
              end_time: event.end_time || '',
              location: event.location || '',
              cover_image: event.cover_image || '',
              created_by: event.created_by || 0,
              created_by_name: event.created_by_name || 'Unknown',
              created_by_role: event.created_by_role || 'Unknown',
              created_at: event.created_at || '',
              updated_at: event.updated_at || '',
              is_event: true
            }));
            

            

          } catch (error) {
            console.error('イベント取得エラー:', error);
            // エラーの場合は通常の投稿APIをフォールバック
            const postsResponse = await axios.get(`/api/posts/channels/${numChannelId}/posts`);
            postsData = postsResponse.data.posts || [];
          }
        } else {
          // 通常のチャンネルの場合、投稿APIを呼び出し
          const postsResponse = await axios.get(`/api/posts/channels/${numChannelId}/posts`);
          postsData = postsResponse.data.posts || [];
        }
        
        console.log('投稿取得成功:', { count: postsData.length });
        
        // Eventsチャンネルの場合、イベント投稿を開催日順にソート
        if (isEventsChannel) {
          console.log('Eventsチャンネルでソート実行');
          
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          
          // イベント投稿と非イベント投稿を分離
          const eventPosts = postsData.filter((post: any) => post.event_id && post.event_date);
          const nonEventPosts = postsData.filter((post: any) => !post.event_id);
          
          // 今後のイベントと過去のイベントに分ける
          const upcomingEvents = eventPosts.filter((post: any) => post.event_date >= todayStr);
          const pastEventPosts = eventPosts.filter((post: any) => post.event_date < todayStr);
          
          console.log('イベント分類:', {
            upcoming: upcomingEvents.length,
            past: pastEventPosts.length,
            today: todayStr
          });
          
          // 今後のイベントを開催日の近い順にソート
          upcomingEvents.sort((a: any, b: any) => {
            if (!a.event_date || !b.event_date) return 0;
            return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
          });
          
          // 過去のイベントを開催日の新しい順にソート
          pastEventPosts.sort((a: any, b: any) => {
            if (!a.event_date || !b.event_date) return 0;
            return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
          });
          
          console.log('ソート後:', {
            upcoming: upcomingEvents.map((p: any) => ({ title: p.content, date: p.event_date })),
            past: pastEventPosts.map((p: any) => ({ title: p.content, date: p.event_date }))
          });
          
          console.log('過去のイベント自動表示設定:', { 
            pastCount: pastEventPosts.length, 
            willShow: pastEventPosts.length > 0 
          });
          
          // 過去のイベントを別のstateに保存
          setPastEvents(pastEventPosts);
          
          // 過去のイベントがある場合は自動的に表示
          if (pastEventPosts.length > 0) {
            setShowPastEvents(true);
          }
          
          // 今後のイベントと非イベント投稿のみを表示
          postsData = [...upcomingEvents, ...nonEventPosts];
        }
        
        setPosts(postsData);

        setLoading(false);
      } catch (error: any) {
        console.error('チャンネル情報の取得エラー:', error);
        if (error.response?.status === 404) {
          setError(t('channelNotFound'));
        } else {
          setError(t('channelInfoFailed'));
        }
        setLoading(false);
      }
    };

    if (numChannelId && user) {
      fetchChannelInfo();
    } else {
      console.log('データ取得をスキップ:', { 
        numChannelId, 
        userExists: !!user,
        reason: !numChannelId ? 'channelIdが無効' : 'userが存在しない'
      });
      if (!user) {
        setLoading(false);
        setError('ユーザー情報が取得できません。ログインしてください。');
      }
    }
  }, [channelId, user?.role, user, t]);

  // カテゴリとチャンネルのデータを取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/channels/categories');
        const categoriesData = response.data.categories || [];
        
        // データの検証
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.warn('Invalid categories data received:', categoriesData);
          setCategories([]);
        }
      } catch (error) {
        console.error('カテゴリ取得エラー:', error);
        setCategories([]);
      }
    };

    if (user) {
      fetchCategories();
    }
  }, [user]);

  // イベント編集成功時のリスナー
  useEffect(() => {
    const handleEventEditSuccess = () => {
      console.log('イベント編集成功イベントを受信:', { channelId });
      if (channelId) {
        const numChannelId = parseInt(channelId);
        console.log('投稿を再読み込み:', { numChannelId });
        loadPosts(numChannelId);
      }
    };

    window.addEventListener('eventEditSuccess', handleEventEditSuccess);

    return () => {
      window.removeEventListener('eventEditSuccess', handleEventEditSuccess);
    };
  }, [channelId]);

  // リアルタイムでイベントの状態をチェック（過去のイベントを自動的に移動）
  useEffect(() => {
    const isEventsChannel = channel?.name === '🗓️ Events';
    if (!isEventsChannel || posts.length === 0) return;

    const checkEventStatus = () => {
      const today = new Date().toISOString().split('T')[0];
      console.log('リアルタイムチェック実行:', { today, postsCount: posts.length });
      
      // 現在の投稿から過去のイベントを特定
      const currentPastEvents = posts.filter(post => 
        post.event_id && post.event_date && post.event_date < today
      );
      
      // 現在の投稿から今後のイベントを特定
      const currentUpcomingEvents = posts.filter(post => 
        !post.event_id || !post.event_date || post.event_date >= today
      );
      
      console.log('イベント分類結果:', {
        past: currentPastEvents.length,
        upcoming: currentUpcomingEvents.length,
        pastEvents: currentPastEvents.map(p => ({ id: p.id, date: p.event_date, title: p.content }))
      });
      
      // 過去のイベントが新しく見つかった場合、状態を更新
      if (currentPastEvents.length > 0) {
        console.log('過去のイベントを検出:', currentPastEvents.length, '件');
        setPastEvents(prev => {
          const newPastEvents = [...prev, ...currentPastEvents];
          // 重複を除去
          const uniquePastEvents = newPastEvents.filter((event, index, self) => 
            index === self.findIndex(e => e.id === event.id)
          );
          return uniquePastEvents;
        });
        
        // メインの投稿リストから過去のイベントを除去
        setPosts(currentUpcomingEvents);
        
        // 過去のイベントが新しく追加された場合、自動的に表示
        setShowPastEvents(true);
      }
    };

    // 初回チェック
    checkEventStatus();
    
    // ページがアクティブな時は30秒ごと、非アクティブな時は1分ごとにチェック
    let interval: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // ページが非アクティブな時は1分ごと
        clearInterval(interval);
        interval = setInterval(checkEventStatus, 60000);
      } else {
        // ページがアクティブな時は30秒ごと
        clearInterval(interval);
        interval = setInterval(checkEventStatus, 30000);
      }
    };
    
    // 初期設定
    handleVisibilityChange();
    
    // ページの可視性変更を監視
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [channel?.name, channelId]); // postsを依存配列から除去して無限ループを防ぐ

  // 投稿権限をチェックする関数
  const checkPostPermission = (channelType: string, userRole: string): boolean => {
    if (userRole === 'Trial参加者' || userRole === 'ビジター') return false;
    
    switch (channelType) {
      case 'all_post_all_view':
        return true;
      case 'admin_only_all_view':
      case 'admin_only_instructors_view':
        return ['サーバー管理者', 'ECG講師', 'JCG講師'].includes(userRole);
      case 'instructors_post_all_view':
        return ['サーバー管理者', 'ECG講師', 'JCG講師'].includes(userRole);
      case 'class1_post_class1_view':
        return ['サーバー管理者', 'ECG講師', 'JCG講師', 'Class1 Members'].includes(userRole);
      default:
        return false;
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('画像サイズは5MB以下にしてください');
        return;
      }

      // 画像をリサイズして圧縮
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 最大サイズを設定（1200x1200）
        const maxSize = 1200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 画像を描画
        ctx?.drawImage(img, 0, 0, width, height);
        
        // JPEG形式で圧縮
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setSelectedImage(compressedDataUrl);
        setImagePreview(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // マイ単語帳保存機能
  const handleSaveToVocabulary = async (postId: number) => {
    try {
      console.log('=== Save to Vocabulary Request ===');
      console.log('Post ID:', postId);
      console.log('API URL:', `${process.env.REACT_APP_API_URL}/api/study-log/posts/${postId}/save`);
      
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/study-log/posts/${postId}/save`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Save response:', response.data);
      
      if (response.data.success) {
        if (response.data.alreadySaved) {
          alert('✅ ' + response.data.message);
        } else {
          alert('🎉 ' + response.data.message);
        }
      } else {
        alert('❌ 保存に失敗しました');
      }
    } catch (error: any) {
      console.error('=== Save to Vocabulary Error ===');
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      if (error.response?.status === 401) {
        alert('❌ 認証が必要です。再ログインしてください。');
      } else if (error.response?.status === 500) {
        alert('❌ サーバーエラーが発生しました: ' + (error.response?.data?.details || error.message));
      } else {
        alert('❌ マイ単語帳への保存に失敗しました: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleTemplatePost = async () => {
    try {
      const response = await axios.get('/api/auth/profile/template');
      const { bio, message } = response.data;
      
      const template = `Hello!\n\n${bio || ''}\n\n${message || ''}`;
      setModalNewPost(template);
      setPostModalOpen(true);
    } catch (error) {
      console.error('テンプレート取得エラー:', error);
      setError('テンプレートの取得に失敗しました');
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const numChannelId = parseInt(channelId || '0');
      let imageUrl = null;

      if (selectedImage) {
        // 画像をアップロード
        const uploadResponse = await axios.post('/api/posts/upload/image', {
          imageData: selectedImage
        });
        imageUrl = uploadResponse.data.imageUrl;
      }

      await axios.post(`/api/posts/channels/${numChannelId}/posts`, {
        content: newPost,
        image_url: imageUrl
      });
      
      setNewPost('');
      setSelectedImage(null);
      setImagePreview(null);
      
      // 投稿を再読み込み
      const postsResponse = await axios.get(`/api/posts/channels/${numChannelId}/posts`);
      setPosts(postsResponse.data.posts || []);
    } catch (error: any) {
      console.error('投稿の作成に失敗しました:', error);
      setError(error.response?.data?.error || t('postsLoadFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await axios.post(`/api/posts/posts/${postId}/like`);
      // 投稿を再読み込み
      const numChannelId = parseInt(channelId || '0');
      const postsResponse = await axios.get(`/api/posts/channels/${numChannelId}/posts`);
      setPosts(postsResponse.data.posts || []);
    } catch (error) {
      console.error('いいねに失敗しました:', error);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (window.confirm('この投稿を削除しますか？')) {
      try {
        await axios.delete(`/api/posts/posts/${postId}`);
        // 投稿を再読み込み
        const numChannelId = parseInt(channelId || '0');
        const postsResponse = await axios.get(`/api/posts/channels/${numChannelId}/posts`);
        setPosts(postsResponse.data.posts || []);
      } catch (error) {
        console.error('投稿の削除に失敗しました:', error);
      }
    }
  };

  const handleToggleComments = async (postId: number) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));

    if (!expandedComments[postId]) {
      try {
        const response = await axios.get(`/api/posts/posts/${postId}/comments`);
        setComments(prev => ({
          ...prev,
          [postId]: response.data.comments || []
        }));
      } catch (error) {
        console.error('コメントの取得に失敗しました:', error);
      }
    }
  };

  const handleSubmitComment = async (postId: number) => {
    const content = newComment[postId];
    if (!content?.trim()) return;

    try {
      await axios.post(`/api/posts/posts/${postId}/comments`, {
        content: content
      });
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      // コメントを再読み込み
      const response = await axios.get(`/api/posts/posts/${postId}/comments`);
      setComments(prev => ({
        ...prev,
        [postId]: response.data.comments || []
      }));
    } catch (error) {
      console.error('コメントの作成に失敗しました:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('このコメントを削除しますか？')) {
      try {
        await axios.delete(`/api/posts/comments/${commentId}`);
        // 投稿を再読み込みしてコメント数を更新
        const numChannelId = parseInt(channelId || '0');
        const postsResponse = await axios.get(`/api/posts/channels/${numChannelId}/posts`);
        setPosts(postsResponse.data.posts || []);
        // コメントを再読み込み
        const response = await axios.get(`/api/posts/posts/${commentId}/comments`);
        setComments(prev => ({
          ...prev,
          [commentId]: response.data.comments || []
        }));
      } catch (error) {
        console.error('コメントの削除に失敗しました:', error);
      }
    }
  };

  const getChannelTypeLabel = (type: string) => {
    switch (type) {
      case 'admin_only_instructors_view':
        return t('channelTypeStaffOnly');
      case 'admin_only_all_view':
        return t('channelTypeAnnouncement');
      case 'instructors_post_all_view':
        return t('channelTypeInstructorPost');
      case 'all_post_all_view':
        return t('channelTypeGeneralPost');
      case 'class1_post_class1_view':
        return t('channelTypeClass1Only');
      default:
        return type;
    }
  };

  const getChannelTypeColor = (type: string) => {
    switch (type) {
      case 'admin_only_instructors_view':
        return 'error';
      case 'admin_only_all_view':
        return 'warning';
      case 'instructors_post_all_view':
        return 'info';
      case 'all_post_all_view':
        return 'success';
      case 'class1_post_class1_view':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  // URLを検出してリンクに変換する関数
  const convertUrlsToLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1976d2',
              textDecoration: 'underline',
              wordBreak: 'break-all'
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const isEventsChannel = channel?.name === '🗓️ Events';
  const isQaChannel = channel?.name === '💬 Q&A / Help Desk';
  const isQaStaffChannel = channel?.name === '【要確認】みんなからの質問など';
  const isStudyLogChannel = channel?.name === 'ECG × JCG Study Board';

  const loadPosts = async (channelId: number) => {
    try {
      console.log('投稿取得開始:', { channelId });
      const response = await axios.get(`/api/posts/channels/${channelId}/posts`);
      let postsData = response.data.posts || [];
      console.log('投稿取得成功: ►', { count: postsData.length, posts: postsData });

      
      setPosts(postsData);
    } catch (error) {
      console.error('投稿取得エラー:', error);
    }
  };

  const handleEventFormSuccess = () => {
    // イベント作成後にページ全体を再読み込み
    if (channelId) {
      const numChannelId = parseInt(channelId);
      // ページ全体を再読み込みしてイベント一覧を更新
      window.location.reload();
    }
  };

  const handleQaSubmit = async () => {
    if (!qaContent.trim()) return;

    try {
      setIsSubmitting(true);
      
      // Q&A投稿をスタッフチャンネルに送信
      // まず全てのカテゴリを取得
      const categoriesResponse = await axios.get('/api/channels/categories');
      let staffChannel = null;
      
      // 各カテゴリからスタッフチャンネルを探す
      for (const category of categoriesResponse.data.categories) {
        try {
          const channelsResponse = await axios.get(`/api/channels/categories/${category.id}/channels`, {
            headers: {
              'X-Bypass-Permission': 'true' // 権限チェックをバイパス
            }
          });
          const foundChannel = channelsResponse.data.channels.find(
            (ch: any) => ch.name === '【要確認】みんなからの質問など'
          );
          if (foundChannel) {
            staffChannel = foundChannel;
            break;
          }
        } catch (error) {
          console.log(`カテゴリ ${category.id} のチャンネル取得に失敗:`, error);
          continue;
        }
      }

      if (staffChannel) {
        // スタッフチャンネルへの投稿は権限チェックをバイパス
        const originalAuth = axios.defaults.headers.common['Authorization'];
        
        // 一時的に管理者権限で投稿
        await axios.post(`/api/posts/channels/${staffChannel.id}/posts`, {
          content: qaContent,
          is_anonymous: isAnonymousQa,
          question_type: 'qa',
          original_user_id: user?.id,
          original_username: user?.username
        }, {
          headers: {
            'Authorization': originalAuth,
            'X-Bypass-Permission': 'true' // 権限チェックをバイパスするフラグ
          }
        });

        setQaContent('');
        setQaModalOpen(false);
        setShowQaSuccess(true);
        
        // 3秒後に成功メッセージを非表示
        setTimeout(() => setShowQaSuccess(false), 3000);
      } else {
        setError('スタッフチャンネルが見つかりませんでした。管理者に連絡してください。');
        console.error('スタッフチャンネルが見つかりません。');
      }
    } catch (error: any) {
      console.error('Q&A投稿に失敗しました:', error);
      setError(error.response?.data?.error || 'Q&A投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQaTransfer = async (postId: number) => {
    try {
      // Q&A投稿を通常チャンネルに転送
      // まず全てのカテゴリを取得
      const categoriesResponse = await axios.get('/api/channels/categories');
      let qaChannel = null;
      
      // 各カテゴリからQ&Aチャンネルを探す
      for (const category of categoriesResponse.data.categories) {
        const channelsResponse = await axios.get(`/api/channels/categories/${category.id}/channels`);
        const foundChannel = channelsResponse.data.channels.find(
          (ch: any) => ch.name === '💬 Q&A / Help Desk'
        );
        if (foundChannel) {
          qaChannel = foundChannel;
          break;
        }
      }

      if (qaChannel) {
        const questionPost = posts.find(p => p.id === postId);
        console.log('Q&A転送 - 元の質問投稿:', questionPost);
        
        // 既に完成したQ&A形式の投稿をそのまま転送
        await axios.post(`/api/posts/channels/${qaChannel.id}/posts`, {
          content: questionPost?.content, // 既存のコンテンツをそのまま使用
          is_answered: true,
          original_question_id: postId
        });

        // 元の投稿を削除
        await axios.delete(`/api/posts/posts/${postId}`);
        
        // 投稿を再読み込み
        if (channelId) {
          const numChannelId = parseInt(channelId);
          loadPosts(numChannelId);
        }
      } else {
        setError('Q&Aチャンネルが見つかりません');
      }
    } catch (error: any) {
      console.error('Q&A転送に失敗しました:', error);
      setError(error.response?.data?.error || 'Q&A転送に失敗しました');
    }
  };

  const handleQaReject = async (postId: number) => {
    if (window.confirm('この質問を回答拒否として削除しますか？')) {
      try {
        await axios.delete(`/api/posts/posts/${postId}`);
        
        // 投稿を再読み込み
        if (channelId) {
          const numChannelId = parseInt(channelId);
          loadPosts(numChannelId);
        }
      } catch (error: any) {
        console.error('Q&A削除に失敗しました:', error);
        setError(error.response?.data?.error || 'Q&A削除に失敗しました');
      }
    }
  };

  // 回答済み投稿の削除（管理者のみ）
  const handleAnsweredPostDelete = async (postId: number) => {
    if (window.confirm('この回答済み投稿を削除しますか？')) {
      try {
        await axios.delete(`/api/posts/posts/${postId}`);
        
        // 投稿を再読み込み
        if (channelId) {
          const numChannelId = parseInt(channelId);
          loadPosts(numChannelId);
        }
      } catch (error: any) {
        console.error('回答済み投稿の削除に失敗しました:', error);
        setError(error.response?.data?.error || '回答済み投稿の削除に失敗しました');
      }
    }
  };

  // 回答入力開始
  const handleStartAnswer = (postId: number) => {
    setEditingAnswer(postId);
    setAnswerContent('');
  };

  // 回答入力キャンセル
  const handleCancelAnswer = () => {
    setEditingAnswer(null);
    setAnswerContent('');
  };

  // 回答送信
  const handleSubmitAnswer = async (postId: number) => {
    if (!answerContent.trim()) return;

    try {
      // 元の質問投稿を取得
      const questionPost = posts.find(p => p.id === postId);
      if (!questionPost) {
        setError('質問投稿が見つかりません');
        return;
      }

      console.log('回答入力 - 元の質問投稿:', questionPost);
      console.log('回答入力 - is_anonymous:', questionPost.is_anonymous);
      console.log('回答入力 - username:', questionPost.username);

      // 元の質問内容から「Q: 」を除去して質問内容のみを取得
      const originalContent = questionPost.content || '';
      const questionContent = originalContent.startsWith('Q: ') ? originalContent.substring(3) : originalContent;

      // Q&A形式のコンテンツを作成
      const qaContent = `Q: ${questionContent}\n\n質問者: ${questionPost.is_anonymous ? '匿名' : questionPost.username}\n\nA: ${answerContent}`;
      console.log('回答入力 - 作成されるコンテンツ:', qaContent);

      // 回答を投稿として送信
      const numChannelId = parseInt(channelId || '0');
      await axios.post(`/api/posts/channels/${numChannelId}/posts`, {
        content: qaContent,
        is_answer: true,
        original_question_id: postId
      });

      setEditingAnswer(null);
      setAnswerContent('');
      
      // 投稿を再読み込み
      if (channelId) {
        loadPosts(numChannelId);
      }
    } catch (error: any) {
      console.error('回答送信に失敗しました:', error);
      setError(error.response?.data?.error || '回答送信に失敗しました');
    }
  };

  // AIコメントをコピーする関数
  const handleCopyAIContent = async (commentContent: string) => {
    try {
      await navigator.clipboard.writeText(commentContent);
      alert('✅ AI学習サポートの内容をコピーしました！マイ単語帳にペーストできます。');
    } catch (error) {
      console.error('コピーエラー:', error);
      alert('❌ コピーに失敗しました');
    }
  };

  console.log('ChannelPage レンダリング状態:', { 
    loading, 
    error, 
    channel: !!channel, 
    postsCount: posts.length,
    user: user?.username 
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/community')}
        >
          {t('back')}
        </Button>
      </Container>
    );
  }

  if (!channel) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('channelNotFound')}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/community')}
        >
          {t('back')}
        </Button>
      </Container>
    );
  }

  return (
    <>
      {/* 左上固定のサイドバーボタン */}
      <IconButton
        onClick={() => setSidebarOpen(true)}
        disabled={categories.length === 0}
        sx={{ 
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1100,
          backgroundColor: 'background.paper',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            backgroundColor: 'grey.100',
          },
          '&:disabled': {
            opacity: 0.5,
          }
        }}
      >
        <MenuIcon />
      </IconButton>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* ヘッダー */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/community')}
            >
              {t('back')}
            </Button>
          </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            #{channel.name}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Chip
            label={getChannelTypeLabel(channel.channel_type)}
            color={getChannelTypeColor(channel.channel_type) as any}
            size="small"
          />
        </Box>
        
        {channel.description && (
          <Typography variant="body1" color="text.secondary">
            {channel.description}
          </Typography>
        )}
      </Box>

      {/* 特殊チャンネル用投稿フォーム */}
      {(canPost || isQaChannel || isQaStaffChannel || isStudyLogChannel) && (isEventsChannel || isStudyLogChannel || channel?.name === '🙋 Introduce Yourself' || isQaChannel || isQaStaffChannel) && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            {isEventsChannel ? (
              // Eventsチャンネルの場合、イベント投稿フォームを表示
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  イベントを投稿
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setEventFormOpen(true)}
                  sx={{
                    py: 1.5,
                    px: 3,
                    borderRadius: 2,
                    fontWeight: 600,
                  }}
                >
                  {t('createEvent')}
                </Button>
              </Box>
            ) : isStudyLogChannel ? (
              // 学習ログチャンネルの場合、学習ログ投稿フォームを表示
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  学習ログを投稿
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  今日学んだ表現や新しい発見を共有しましょう！AI返信機能で学習をサポートします。
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={() => setStudyLogFormOpen(true)}
                  sx={{
                    py: 1.5,
                    px: 3,
                    borderRadius: 2,
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2 30%, #0097A7 90%)',
                    },
                  }}
                >
                  学習ログを投稿
                </Button>
              </Box>
            ) : channel?.name === '🙋 Introduce Yourself' ? (
              // Introduce Yourselfチャンネルの場合、テンプレート投稿を表示
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  自己紹介を投稿
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setPostModalOpen(true)}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      fontWeight: 600,
                    }}
                  >
                    通常投稿
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={handleTemplatePost}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      fontWeight: 600,
                    }}
                  >
                    テンプレート投稿
                  </Button>
                </Box>
              </Box>
            ) : isQaChannel ? (
              // Q&Aチャンネルの場合、質問投稿フォームを表示
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {t('postQuestion')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setQaModalOpen(true)}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      fontWeight: 600,
                    }}
                  >
                    {t('postQuestion')}
                  </Button>
                </Box>
              </Box>
            ) : isQaStaffChannel ? (
              // Q&Aスタッフチャンネルの場合、質問投稿フォームを表示
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {t('postQuestion')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setQaModalOpen(true)}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      fontWeight: 600,
                    }}
                  >
                    {t('postQuestion')}
                  </Button>
                </Box>
              </Box>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Q&A成功メッセージ */}
      {showQaSuccess && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          onClose={() => setShowQaSuccess(false)}
        >
          {t('submissionComplete')}
        </Alert>
      )}

      {/* 投稿一覧 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {posts.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                {t('noPosts')}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            isEventsChannel ? (
              // Eventsチャンネルの場合、イベント投稿コンポーネントを使用
              post.event_id ? (
                // event_idがある場合は、実際のイベントデータを取得して表示
                <EventPost
                  key={post.id}
                  event={{
                    id: post.event_id,
                    title: post.content,
                    description: (post.content || ""),
                    event_date: post.event_date || post.created_at, // イベント日付を優先
                    start_time: post.start_time || '',
                    end_time: post.end_time || '',
                    location: post.location || '',
                    cover_image: (post as any).cover_image || (post as any).image_url,
                    created_by_name: (post as any).created_by_name || (post as any).username,
                    created_by_role: (post as any).created_by_role || '',
                    created_at: post.created_at,
                  }}
                  canEdit={user?.id === post.user_id || user?.role === 'サーバー管理者'}
                />
              ) : (
                // event_idがない場合は、通常の投稿として表示
                <Card key={post.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Avatar 
                        sx={{ bgcolor: 'primary.main' }}
                        src={post.avatar_url}
                      >
                        {post.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {post.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(post.created_at)}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body1">
                      {post.content}
                    </Typography>
                  </CardContent>
                </Card>
              )
            ) : isQaChannel ? (
              // Q&Aチャンネルの場合、Q&A形式で表示
              <Card key={post.id} sx={{ mb: 3, boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ 
                    backgroundColor: isDarkMode ? 'grey.900' : 'primary.50',
                    border: `2px solid ${isDarkMode ? 'grey.700' : 'primary.200'}`,
                    borderRadius: 2,
                    p: 3,
                    position: 'relative'
                  }}>
                    {/* Q&Aヘッダー */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2,
                      pb: 1,
                      borderBottom: `1px solid ${isDarkMode ? 'grey.700' : 'primary.200'}`
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: isDarkMode ? 'primary.light' : 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Box component="span" sx={{ 
                          backgroundColor: isDarkMode ? 'primary.dark' : 'primary.main',
                          color: 'white',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          Q
                        </Box>
                        Q&A
                      </Typography>
                      <Chip 
                        label={t('answered')} 
                        color="success" 
                        size="small" 
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                    
                    {/* Q&Aコンテンツ */}
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'inherit',
                        lineHeight: 1.6,
                        color: isDarkMode ? 'grey.100' : 'text.primary'
                      }}
                    >
                      {convertUrlsToLinks(post.content)}
                    </Typography>
                  </Box>
                  
                  {/* 管理者のみ削除ボタンを表示 */}
                  {user?.role === 'サーバー管理者' && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleAnsweredPostDelete(post.id)}
                        sx={{
                          backgroundColor: isDarkMode ? 'grey.800' : 'grey.100',
                          '&:hover': {
                            backgroundColor: isDarkMode ? 'grey.700' : 'grey.200'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ) : isQaStaffChannel ? (
              // Q&Aスタッフチャンネルの場合、質問を表示
              <Card key={post.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar 
                      sx={{ bgcolor: 'warning.main' }}
                      src={post.avatar_url}
                    >
                      {post.is_anonymous ? '匿' : post.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {post.is_anonymous ? '[匿名]' : post.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(post.created_at)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleStartAnswer(post.id)}
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.8rem' },
                          px: { xs: 1, sm: 2 },
                          py: { xs: 0.5, sm: 1 }
                        }}
                      >
                        {t('enterAnswer')}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleQaTransfer(post.id)}
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.8rem' },
                          px: { xs: 1, sm: 2 },
                          py: { xs: 0.5, sm: 1 }
                        }}
                      >
                        {t('transfer')}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleQaReject(post.id)}
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.8rem' },
                          px: { xs: 1, sm: 2 },
                          py: { xs: 0.5, sm: 1 }
                        }}
                      >
                        {t('rejectAnswer')}
                      </Button>
                    </Box>
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: 2,
                      mt: 2,
                      py: 1,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.6
                    }}
                  >
                    {convertUrlsToLinks(post.content)}
                  </Typography>

                  {/* 回答入力フォーム */}
                  {editingAnswer === post.id && (
                    <Box sx={{ mt: 2, p: { xs: 1, sm: 2 }, backgroundColor: isDarkMode ? 'grey.800' : 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                        {t('answerInput')}
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={answerContent}
                        onChange={(e) => setAnswerContent(e.target.value)}
                        placeholder="回答を入力してください..."
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleCancelAnswer}
                          sx={{
                            fontSize: { xs: '0.7rem', sm: '0.8rem' },
                            px: { xs: 1, sm: 2 },
                            py: { xs: 0.5, sm: 1 }
                          }}
                        >
                          {t('cancel')}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleSubmitAnswer(post.id)}
                          disabled={!answerContent.trim()}
                          sx={{
                            fontSize: { xs: '0.7rem', sm: '0.8rem' },
                            px: { xs: 1, sm: 2 },
                            py: { xs: 0.5, sm: 1 }
                          }}
                        >
                          {t('submit')}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ) : !isQaChannel && !isQaStaffChannel ? (
              // 通常の投稿（Q&Aチャンネル以外）
              <Card key={post.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar 
                      sx={{ bgcolor: 'primary.main' }}
                      src={post.avatar_url}
                    >
                      {post.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {post.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(post.created_at)}
                      </Typography>
                    </Box>
                    {(user?.id === post.user_id || user?.role === 'サーバー管理者') && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletePost(post.id)}
                        sx={{
                          backgroundColor: isDarkMode ? 'grey.800' : 'grey.100',
                          '&:hover': {
                            backgroundColor: isDarkMode ? 'grey.700' : 'grey.200'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: 2,
                      mt: 2,
                      py: 1,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.6
                    }}
                  >
                    {convertUrlsToLinks(post.content)}
                  </Typography>

                  {/* Study Board用のAI返信表示 */}
                  {(post as any).is_study_log && (post as any).ai_response_enabled && (
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        icon={<AutoAwesomeIcon />}
                        label={`🤖 AI学習サポート有効 | 学習言語: ${(post as any).target_language === 'English' ? '英語' : '日本語'}`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                  )}
                  
                  {/* 画像表示 */}
                  {post.image_url && (
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={post.image_url}
                        alt="投稿画像"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '400px',
                          borderRadius: '8px',
                          objectFit: 'contain'
                        }}
                      />
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                    <Button
                      size="small"
                      startIcon={post.user_liked ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                      onClick={() => handleLike(post.id)}
                      sx={{ 
                        color: post.user_liked ? 'primary.main' : 'text.secondary',
                        minWidth: 'auto',
                        px: { xs: 1, sm: 2 },
                        '& .MuiButton-startIcon': {
                          mr: { xs: 0.5, sm: 1 }
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {post.like_count}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                          👍
                        </Typography>
                      </Box>
                    </Button>
                    <Button
                      size="small"
                      startIcon={<CommentIcon />}
                      onClick={() => handleToggleComments(post.id)}
                      endIcon={expandedComments[post.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ 
                        color: 'text.secondary',
                        minWidth: 'auto',
                        px: { xs: 1, sm: 2 },
                        '& .MuiButton-startIcon': {
                          mr: { xs: 0.5, sm: 1 }
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {post.comment_count}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                          💬
                        </Typography>
                      </Box>
                    </Button>

                    {/* Study Board用のマイ単語帳保存ボタン */}
                    {(post as any).is_study_log && (
                      <IconButton
                        size="small"
                        onClick={() => handleSaveToVocabulary(post.id)}
                        sx={{ 
                          color: 'secondary.main',
                          '&:hover': {
                            backgroundColor: 'secondary.light',
                            color: 'secondary.dark'
                          }
                        }}
                      >
                        <BookmarkAddIcon />
                      </IconButton>
                    )}
                  </Box>

                  {/* コメントセクション */}
                  <Collapse in={expandedComments[post.id]} timeout="auto" unmountOnExit>
                    <Box sx={{ 
                      mt: 2,
                      maxHeight: 'none',
                      overflow: 'visible'
                    }}>
                      <Divider sx={{ mb: 2 }} />
                      
                      {/* コメント入力 */}
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder={t('writeComment')}
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmitComment(post.id);
                            }
                          }}
                          multiline
                          minRows={1}
                          maxRows={4}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.12)',
                              },
                              '&:hover fieldset': {
                                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.23)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: isDarkMode ? 'primary.main' : 'primary.main',
                              },
                            },
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {t('commentHelp')}
                          </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleSubmitComment(post.id)}
                          disabled={!newComment[post.id]?.trim()}
                        >
                          {t('sendComment')}
                        </Button>
                        </Box>
                      </Box>

                      {/* コメント一覧 */}
                      <Box sx={{ 
                        maxHeight: 'none',
                        overflow: 'visible'
                      }}>
                      {comments[post.id]?.map((comment) => (
                          <Paper key={comment.id} sx={{ 
                            p: { xs: 0.5, sm: 1 }, 
                            mb: 2, 
                            bgcolor: 'background.paper',
                            '& .MuiStack-root': {
                              gap: { xs: 0.5, sm: 1 }
                            }
                          }}>
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                            <Avatar 
                                sx={{ 
                                  width: { xs: 24, sm: 32 }, 
                                  height: { xs: 24, sm: 32 },
                                  flexShrink: 0
                                }}
                              src={comment.avatar_url}
                            >
                              {comment.username.charAt(0).toUpperCase()}
                            </Avatar>
                              <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                  {comment.username}
                                </Typography>
                                <Chip
                                  label={comment.role}
                                  size="small"
                                    sx={{ fontSize: { xs: '0.5rem', sm: '0.7rem' } }}
                                />
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                                  {formatDate(comment.created_at)}
                                </Typography>
                              </Stack>
                                {comment.username === 'AI学習サポート' ? (
                                  <Box sx={{ 
                                    p: { xs: 1, sm: 2 }, 
                                    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                                    borderRadius: 2,
                                    border: `1px solid ${isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                                    width: '100%',
                                    maxWidth: '100%',
                                    boxSizing: 'border-box',
                                    margin: 0,
                                    padding: { xs: 1, sm: 2 }
                                  }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, width: '100%' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                        <AutoAwesomeIcon sx={{ color: 'secondary.main', mr: 1, fontSize: { xs: '0.8rem', sm: '1.25rem' } }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'secondary.main', fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                                          🤖 AI学習サポート
                                        </Typography>
                                      </Box>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleCopyAIContent(comment.content)}
                                        sx={{ 
                                          color: 'primary.main',
                                          p: { xs: 0.5, sm: 1 },
                                          '&:hover': {
                                            backgroundColor: 'rgba(99, 102, 241, 0.1)'
                                          }
                                        }}
                                        title="AI学習サポートの内容をコピー"
                                      >
                                        <CopyIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                    <Typography 
                                      variant="body2"
                                      sx={{
                                        whiteSpace: 'pre-line',
                                        wordBreak: 'break-word',
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                        lineHeight: { xs: 1.6, sm: 1.7 },
                                        width: '100%'
                                      }}
                                    >
                                      {comment.content}
                                    </Typography>
                                  </Box>
                                ) : (
                              <Typography 
                                variant="body2"
                                sx={{
                                  whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                      lineHeight: { xs: 1.6, sm: 1.7 },
                                      width: '100%',
                                      py: 0.5
                                }}
                              >
                                {convertUrlsToLinks(comment.content)}
                              </Typography>
                                )}
                            </Box>
                            {(user?.id === comment.user_id || user?.role === 'サーバー管理者') && (
                              <IconButton
                                onClick={() => handleDeleteComment(comment.id)}
                                size="small"
                                color="error"
                                  sx={{ p: { xs: 0.5, sm: 1 }, flexShrink: 0 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        </Paper>
                      ))}
                      </Box>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            ) : null
          ))
        )}
      </Box>

      {/* Eventsチャンネル専用：過去のイベント表示ボタン */}
      {isEventsChannel && pastEvents.length > 0 && (
        <Card sx={{ mb: 2, mt: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setShowPastEvents(!showPastEvents)}
              sx={{
                py: 1.5,
                px: 3,
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              {showPastEvents ? '過去のイベントを隠す' : '過去のイベントを表示'} ({pastEvents.length})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Eventsチャンネル用の過去のイベントセクション */}
      {isEventsChannel && showPastEvents && pastEvents.length > 0 && (
        <Card sx={{ mb: 2, opacity: 0.8 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, opacity: 0.8 }}>
              過去のイベント ({pastEvents.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pastEvents.map((post) => (
                <Box key={post.id} sx={{ opacity: 0.7 }}>
                  {post.event_id ? (
                    <EventPost
                      event={{
                        id: post.event_id,
                        title: post.content,
                        description: (post.content || ""),
                        event_date: post.event_date || post.created_at,
                        start_time: post.start_time || '',
                        end_time: post.end_time || '',
                        location: post.location || '',
                        cover_image: (post as any).cover_image || (post as any).image_url,
                        created_by_name: (post as any).created_by_name || (post as any).username,
                        created_by_role: (post as any).created_by_role || '',
                        created_at: post.created_at,
                      }}
                      canEdit={user?.id === post.user_id || user?.role === 'サーバー管理者'}
                    />
                  ) : (
                    <Card>
                      <CardContent>
                        <Typography>{post.content}</Typography>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* サイドバー */}
      <ChannelSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categories={categories}
        currentChannelId={parseInt(channelId || '0')}
      />

      {/* フローティング投稿ボタン */}
      {canPost && !isEventsChannel && channel?.name !== '🙋 Introduce Yourself' && !isQaChannel && !isQaStaffChannel && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          onClick={() => setPostModalOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      {/* 投稿作成モーダル */}
      <Dialog
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          新しい投稿を作成
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={modalNewPost}
            onChange={(e) => setModalNewPost(e.target.value)}
            placeholder={t('postContent')}
            variant="outlined"
            sx={{ mt: 1, mb: 2 }}
          />
          
          {/* 画像プレビュー */}
          {imagePreview && (
            <Box sx={{ mb: 2, position: 'relative' }}>
              <img
                src={imagePreview}
                alt="プレビュー"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '8px',
                  objectFit: 'contain'
                }}
              />
              <IconButton
                onClick={handleRemoveImage}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}
          
          {/* 画像追加ボタン */}
          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
              id="modal-image-upload-input"
            />
            <label htmlFor="modal-image-upload-input">
              <Button
                component="span"
                variant="outlined"
                startIcon={<ImageIcon />}
                disabled={isSubmitting}
              >
                {t('addImage')}
              </Button>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostModalOpen(false)} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button 
            onClick={async () => {
              try {
                setIsSubmitting(true);
                const numChannelId = parseInt(channelId || '0');
                let imageUrl = null;

                if (selectedImage) {
                  // 画像をアップロード
                  const uploadResponse = await axios.post('/api/posts/upload/image', {
                    imageData: selectedImage
                  });
                  imageUrl = uploadResponse.data.imageUrl;
                }

                await axios.post(`/api/posts/channels/${numChannelId}/posts`, {
                  content: modalNewPost,
                  image_url: imageUrl
                });
                
                setModalNewPost('');
                setSelectedImage(null);
                setImagePreview(null);
                setPostModalOpen(false);
                
                // 投稿を再読み込み
                const postsResponse = await axios.get(`/api/posts/channels/${numChannelId}/posts`);
                setPosts(postsResponse.data.posts || []);
              } catch (error: any) {
                console.error('投稿の作成に失敗しました:', error);
                setError(error.response?.data?.error || t('postsLoadFailed'));
              } finally {
                setIsSubmitting(false);
              }
            }}
            variant="contained"
            disabled={!modalNewPost.trim() || isSubmitting}
            startIcon={<SendIcon />}
          >
            {isSubmitting ? t('loading') : t('post')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Q&A投稿モーダル */}
      <Dialog
        open={qaModalOpen}
        onClose={() => setQaModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('postQuestion')}
        </DialogTitle>
        <DialogContent>
          {/* 匿名/通常切り替えボタン */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={!isAnonymousQa ? "contained" : "outlined"}
                size="small"
                onClick={() => setIsAnonymousQa(false)}
                sx={{ fontSize: '0.75rem' }}
              >
                {t('normalQuestion')}
              </Button>
              <Button
                variant={isAnonymousQa ? "contained" : "outlined"}
                size="small"
                onClick={() => setIsAnonymousQa(true)}
                sx={{ fontSize: '0.75rem' }}
              >
                {t('anonymousQuestion')}
              </Button>
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={6}
            value={qaContent}
            onChange={(e) => setQaContent(e.target.value)}
            placeholder={t('questionContent')}
            variant="outlined"
            sx={{ 
              mt: 1, 
              mb: 2,
              backgroundColor: isAnonymousQa ? 'rgba(255, 193, 7, 0.1)' : 'rgba(25, 118, 210, 0.1)',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: isAnonymousQa ? 'rgba(255, 193, 7, 0.3)' : 'rgba(25, 118, 210, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: isAnonymousQa ? 'rgba(255, 193, 7, 0.5)' : 'rgba(25, 118, 210, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: isAnonymousQa ? '#ffc107' : '#1976d2',
                },
              },
            }}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isAnonymousQa ? 
              t('anonymousQuestionNote') : 
              t('normalQuestionNote')
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQaModalOpen(false)} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleQaSubmit}
            variant="contained"
            disabled={!qaContent.trim() || isSubmitting}
            startIcon={<SendIcon />}
          >
            {isSubmitting ? t('loading') : t('post')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* イベント投稿フォーム */}
      {isEventsChannel && (
        <EventPostForm
          open={eventFormOpen}
          onClose={() => setEventFormOpen(false)}
          onSuccess={handleEventFormSuccess}
          channelId={parseInt(channelId || '0')}
        />
      )}

      {/* 学習ログ投稿フォーム */}
      {isStudyLogChannel && (
        <StudyLogPost
          open={studyLogFormOpen}
          onClose={() => setStudyLogFormOpen(false)}
          onSuccess={() => {
            setStudyLogFormOpen(false);
            if (channelId) {
              loadPosts(parseInt(channelId));
            }
          }}
          channelId={parseInt(channelId || '0')}
        />
      )}
    </Container>
    </>
  );
};

export default ChannelPage; 