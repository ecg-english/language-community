import React, { useState, useEffect, useMemo } from 'react';
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
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import ChannelSidebar from '../components/ChannelSidebar/ChannelSidebar';

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
}

interface Comment {
  id: number;
  content: string;
  user_id: number;
  username: string;
  role: string;
  created_at: string;
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
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // コンポーネントマウント時のログ
  console.log('ChannelPage マウント:', { 
    channelId, 
    pathname: location.pathname,
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const numChannelId = parseInt(channelId || '0');
    console.log('URLパラメータ変更:', { 
      channelId, 
      numChannelId, 
      pathname: location.pathname,
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
        const postsData = postsResponse.data.posts || [];
        console.log('投稿取得成功:', { count: postsData.length });
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
    }
  }, [channelId, location.pathname, user?.role, user, t]);

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
      setNewPost(template);
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton
            onClick={() => setSidebarOpen(true)}
            disabled={categories.length === 0}
            sx={{ 
              border: '1px solid rgba(0, 0, 0, 0.12)',
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

      {/* 投稿フォーム */}
      {canPost && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <form onSubmit={handleSubmitPost}>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={t('postContent')}
                variant="outlined"
                sx={{ mb: 2 }}
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
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 1, sm: 0 }
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'center', sm: 'flex-start' }
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                    id="image-upload-input"
                  />
                  <label htmlFor="image-upload-input">
                    <Button
                      component="span"
                      variant="outlined"
                      startIcon={<ImageIcon />}
                      disabled={isSubmitting}
                      size="small"
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        px: { xs: 1, sm: 2 },
                        py: { xs: 0.5, sm: 1 },
                        minWidth: { xs: 'auto', sm: 'auto' },
                      }}
                    >
                      {t('addImage')}
                    </Button>
                  </label>
                  
                  {/* テンプレート投稿ボタン（Introduce Yourselfチャンネルのみ） */}
                  {(channel?.name === 'Introduce Yourself' || channel?.name === '🙋 Introduce Yourself') && (
                    <Button
                      variant="outlined"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={handleTemplatePost}
                      disabled={isSubmitting}
                      size="small"
                      sx={{
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        px: { xs: 1, sm: 2 },
                        py: { xs: 0.5, sm: 1 },
                        minWidth: { xs: 'auto', sm: 'auto' },
                        '&:hover': {
                          borderColor: 'primary.dark',
                          backgroundColor: 'primary.light',
                          color: 'primary.dark',
                        }
                      }}
                    >
                      {t('templatePost')}
                    </Button>
                  )}
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  endIcon={<SendIcon />}
                  disabled={!newPost.trim() || isSubmitting}
                  size="small"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    px: { xs: 1, sm: 2 },
                    py: { xs: 0.5, sm: 1 },
                    minWidth: { xs: 'auto', sm: 'auto' },
                  }}
                >
                  {isSubmitting ? t('loading') : t('post')}
                </Button>
              </Box>
            </form>
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
            <Card key={post.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
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
                      <Paper key={comment.id} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Avatar sx={{ width: 32, height: 32 }}>
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
          ))
        )}
      </Box>

      {/* サイドバー */}
      <ChannelSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categories={categories}
        currentChannelId={parseInt(channelId || '0')}
      />
    </Container>
  );
};

export default ChannelPage; 