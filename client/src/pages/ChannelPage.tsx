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
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import ChannelSidebar from '../components/ChannelSidebar/ChannelSidebar';
import EventPost from '../components/EventPost/EventPost';
import EventPostForm from '../components/EventPostForm/EventPostForm';

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

        // 投稿を取得
        const postsResponse = await axios.get(`/api/posts/channels/${numChannelId}/posts`);
        let postsData = postsResponse.data.posts || [];
        console.log('投稿取得成功:', { count: postsData.length });
        
        // Eventsチャンネルの場合、イベント投稿を開催日順にソート
        const isEventsChannel = channelData?.name === '🗓️ Events';
        console.log('チャンネル判定:', { channelName: channelData?.name, isEventsChannel });
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
          
          // 過去のイベントを別のstateに保存
          setPastEvents(pastEventPosts);
          
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

  // 投稿権限をチェックする関数
  const checkPostPermission = (channelType: string, userRole: string): boolean => {
    if (userRole === 'Trial参加者') return false;
    
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
    // 投稿を再読み込み
    if (channelId) {
      const numChannelId = parseInt(channelId);
      loadPosts(numChannelId);
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
        const channelsResponse = await axios.get(`/api/channels/categories/${category.id}/channels`);
        const foundChannel = channelsResponse.data.channels.find(
          (ch: any) => ch.name === '【要確認】みんなからの質問など'
        );
        if (foundChannel) {
          staffChannel = foundChannel;
          break;
        }
      }

      if (staffChannel) {
        await axios.post(`/api/posts/channels/${staffChannel.id}/posts`, {
          content: qaContent,
          is_anonymous: isAnonymousQa,
          question_type: 'qa',
          original_user_id: user?.id,
          original_username: user?.username
        });

        setQaContent('');
        setQaModalOpen(false);
        setShowQaSuccess(true);
        
        // 3秒後に成功メッセージを非表示
        setTimeout(() => setShowQaSuccess(false), 3000);
      } else {
        setError('スタッフチャンネルが見つかりません');
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
        const qaContent = `Q: ${questionPost?.content}\n\n質問者: ${questionPost?.is_anonymous ? '[匿名]' : questionPost?.username}\n\nA: [回答を入力してください]`;
        
        await axios.post(`/api/posts/channels/${qaChannel.id}/posts`, {
          content: qaContent,
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
      // 回答を投稿として送信
      await axios.post(`/api/posts/channels/${channelId}/posts`, {
        content: answerContent,
        is_answer: true,
        original_question_id: postId
      });

      setEditingAnswer(null);
      setAnswerContent('');
      
      // 投稿を再読み込み
      if (channelId) {
        const numChannelId = parseInt(channelId);
        loadPosts(numChannelId);
      }
    } catch (error: any) {
      console.error('回答送信に失敗しました:', error);
      setError(error.response?.data?.error || '回答送信に失敗しました');
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
      {canPost && (isEventsChannel || channel?.name === '🙋 Introduce Yourself' || isQaChannel) && (
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
                  質問を投稿
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
                    質問を投稿
                  </Button>
                </Box>
              </Box>
            ) : isQaStaffChannel ? (
              // Q&Aスタッフチャンネルの場合、質問投稿フォームを表示
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  質問を投稿
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
                    質問を投稿
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
          送信完了！回答までしばらくお待ちください！
        </Alert>
      )}

      {/* Eventsチャンネル用の過去のイベントセクション */}
      {isEventsChannel && (() => {
        const today = new Date().toISOString().split('T')[0];
        const pastEvents = posts.filter(post => 
          post.event_id && post.event_date && post.event_date < today
        );
        
        return pastEvents.length > 0 ? (
          <Card sx={{ mb: 2, opacity: 0.8 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, opacity: 0.8 }}>
                {t('pastEvents')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {pastEvents.map((post) => (
                  <Box key={post.id} sx={{ opacity: 0.7 }}>
                    {post.event_id ? (
                      <EventPost
                        event={{
                          id: post.event_id,
                          title: post.content,
                          description: post.content,
                          event_date: post.event_date || post.created_at,
                          start_time: post.start_time || '',
                          end_time: post.end_time || '',
                          location: post.location || '',
                          cover_image: post.image_url,
                          created_by_name: post.username,
                          created_by_role: '',
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
        ) : null;
      })()}

      {/* Eventsチャンネル専用：過去のイベント表示ボタン */}
      {isEventsChannel && pastEvents.length > 0 && (
        <Card sx={{ mb: 2 }}>
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
                    description: post.content,
                    event_date: post.event_date || post.created_at, // イベント日付を優先
                    start_time: post.start_time || '',
                    end_time: post.end_time || '',
                    location: post.location || '',
                    cover_image: post.image_url,
                    created_by_name: post.username,
                    created_by_role: '',
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
              <Card key={post.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      backgroundColor: 'grey.50',
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.300'
                    }}
                  >
                    {convertUrlsToLinks(post.content)}
                  </Typography>
                  
                  {/* 管理者のみ削除ボタンを表示 */}
                  {user?.role === 'サーバー管理者' && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleStartAnswer(post.id)}
                      >
                        回答を入力
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleAnsweredPostDelete(post.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                  
                  {/* 回答入力フォーム */}
                  {editingAnswer === post.id && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
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
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleCancelAnswer}
                        >
                          キャンセル
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleSubmitAnswer(post.id)}
                          disabled={!answerContent.trim()}
                        >
                          回答を送信
                        </Button>
                      </Box>
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
                        variant="contained"
                        color="primary"
                        onClick={() => handleQaTransfer(post.id)}
                      >
                        転送
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleQaReject(post.id)}
                      >
                        回答拒否
                      </Button>
                    </Box>
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: 2,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {convertUrlsToLinks(post.content)}
                  </Typography>
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
                      onClick={() => handleDeletePost(post.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 2,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {convertUrlsToLinks(post.content)}
                </Typography>
                
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
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    size="small"
                    startIcon={post.user_liked ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                    onClick={() => handleLike(post.id)}
                    sx={{ color: post.user_liked ? 'primary.main' : 'text.secondary' }}
                  >
                    {post.like_count} {t('like')}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<CommentIcon />}
                    onClick={() => handleToggleComments(post.id)}
                    endIcon={expandedComments[post.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{ color: 'text.secondary' }}
                  >
                    {post.comment_count} {t('comments')}
                  </Button>
                </Box>

                {/* コメントセクション */}
                <Collapse in={expandedComments[post.id]} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    
                    {/* コメント入力 */}
                    <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder={t('writeComment')}
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
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
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleSubmitComment(post.id)}
                        disabled={!newComment[post.id]?.trim()}
                      >
                        {t('sendComment')}
                      </Button>
                    </Box>

                    {/* コメント一覧 */}
                    {comments[post.id]?.map((comment) => (
                      <Paper key={comment.id} sx={{ p: 2, mb: 1, bgcolor: 'background.paper' }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Avatar 
                            sx={{ width: 32, height: 32 }}
                            src={comment.avatar_url}
                          >
                            {comment.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {comment.username}
                              </Typography>
                              <Chip
                                label={comment.role}
                                size="small"
                                sx={{ fontSize: '0.7rem' }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(comment.created_at)}
                              </Typography>
                            </Stack>
                            <Typography 
                              variant="body2"
                              sx={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}
                            >
                              {convertUrlsToLinks(comment.content)}
                            </Typography>
                          </Box>
                          {(user?.id === comment.user_id || user?.role === 'サーバー管理者') && (
                            <IconButton
                              onClick={() => handleDeleteComment(comment.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </Paper>
                    ))}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
            ) : null
          ))
        )}

        {/* 過去のイベントセクション */}
        {isEventsChannel && showPastEvents && pastEvents.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
              過去のイベント
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.7 }}>
              {pastEvents.map((post) => (
                <EventPost
                  key={post.id}
                  event={{
                    id: post.event_id!,
                    title: post.content,
                    description: post.content,
                    event_date: post.event_date || post.created_at,
                    start_time: post.start_time || '',
                    end_time: post.end_time || '',
                    location: post.location || '',
                    cover_image: post.image_url,
                    created_by_name: post.username,
                    created_by_role: '',
                    created_at: post.created_at,
                  }}
                  canEdit={user?.id === post.user_id || user?.role === 'サーバー管理者'}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

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
          質問を投稿
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
                通常質問
              </Button>
              <Button
                variant={isAnonymousQa ? "contained" : "outlined"}
                size="small"
                onClick={() => setIsAnonymousQa(true)}
                sx={{ fontSize: '0.75rem' }}
              >
                匿名質問
              </Button>
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={6}
            value={qaContent}
            onChange={(e) => setQaContent(e.target.value)}
            placeholder="質問内容を入力してください..."
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
              '匿名質問として投稿されます。質問者名は[匿名]と表示されます。' : 
              '通常質問として投稿されます。質問者名が表示されます。'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQaModalOpen(false)} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button 
            onClick={handleQaSubmit}
            variant="contained"
            disabled={!qaContent.trim() || isSubmitting}
            startIcon={<SendIcon />}
          >
            {isSubmitting ? '送信中...' : '送信'}
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
    </Container>
    </>
  );
};

export default ChannelPage; 