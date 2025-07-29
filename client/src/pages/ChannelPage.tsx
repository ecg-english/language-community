import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  Avatar,
  IconButton,
  Chip,
  Divider,
  Collapse,
  Paper,
  Stack,
  Fade,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Favorite,
  FavoriteBorder,
  Comment as CommentIcon,
  ExpandLess,
  ExpandMore,
  Delete as DeleteIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useCommunity } from '../contexts/CommunityContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const ChannelPage: React.FC = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    posts,
    comments,
    loadPosts,
    createPost,
    deletePost,
    likePost,
    loadComments,
    createComment,
    deleteComment,
  } = useCommunity();

  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>({});
  const [expandedComments, setExpandedComments] = useState<{ [postId: number]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canPost, setCanPost] = useState(false);

  const numChannelId = Number(channelId);
  const channelPosts = posts[numChannelId] || [];

  // チャンネル情報と権限を取得
  useEffect(() => {
    const fetchChannelInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // チャンネル情報を取得
        const channelResponse = await axios.get(`/api/channels/channels/${numChannelId}`);
        const channelData = channelResponse.data.channel;
        setChannelInfo(channelData);
        
        // 投稿権限をチェック
        const postPermission = checkPostPermission(user?.role || '', channelData.channel_type);
        setCanPost(postPermission);
        
        // 投稿を読み込み
        await loadPosts(numChannelId);
        
        setLoading(false);
      } catch (error: any) {
        console.error('チャンネル情報の取得エラー:', error);
        if (error.response?.status === 403) {
          // 権限がない場合はコミュニティページにリダイレクト
          navigate('/community');
          return;
        } else if (error.response?.status === 404) {
          setError('チャンネルが見つかりません');
        } else {
          setError('チャンネル情報の取得に失敗しました');
        }
        setLoading(false);
      }
    };

    if (numChannelId) {
      fetchChannelInfo();
    }
  }, [numChannelId, user?.role, loadPosts, navigate]);

  // 投稿権限をチェックする関数（チャンネルタイプに基づいて判定）
  const checkPostPermission = (userRole: string, channelType: string): boolean => {
    // Trial参加者は投稿不可
    if (userRole === 'Trial参加者') {
      return false;
    }

    switch (channelType) {
      case 'all_post_all_view':
        // 全員投稿可能（Trial除く）
        return true;
      
      case 'admin_only_all_view':
        // 管理者のみ投稿可能
        return userRole === 'サーバー管理者';
      
      case 'instructors_post_all_view':
      case 'admin_only_instructors_view':
        // 管理者・講師のみ投稿可能
        return ['サーバー管理者', 'ECG講師', 'JCG講師'].includes(userRole);
      
      case 'class1_post_class1_view':
        // Class1メンバー以上のみ投稿可能
        return ['サーバー管理者', 'ECG講師', 'JCG講師', 'Class1 Members'].includes(userRole);
      
      default:
        return false;
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || isSubmitting || !canPost) return;

    try {
      setIsSubmitting(true);
      await createPost(numChannelId, newPost);
      setNewPost('');
    } catch (error: any) {
      console.error('投稿の作成に失敗しました:', error);
      if (error.response?.status === 403) {
        setError('このチャンネルに投稿する権限がありません');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await likePost(postId);
    } catch (error) {
      console.error('いいねに失敗しました:', error);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (window.confirm('この投稿を削除しますか？')) {
      try {
        await deletePost(postId);
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
      await loadComments(postId);
    }
  };

  const handleSubmitComment = async (postId: number) => {
    const content = newComment[postId];
    if (!content?.trim()) return;

    try {
      await createComment(postId, content);
      setNewComment(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('コメントの作成に失敗しました:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('このコメントを削除しますか？')) {
      try {
        await deleteComment(commentId);
      } catch (error) {
        console.error('コメントの削除に失敗しました:', error);
      }
    }
  };

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'サーバー管理者':
        return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
      case 'ECG講師':
      case 'JCG講師':
        return 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)';
      case 'ECGメンバー':
        return 'linear-gradient(135deg, #48cae4 0%, #0077b6 100%)';
      case 'JCGメンバー':
        return 'linear-gradient(135deg, #a8e6cf 0%, #56ab2f 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          チャンネルを読み込み中...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/community')}
              startIcon={<ArrowBack />}
            >
              戻る
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Fade in timeout={800}>
        <Box>
          {/* ヘッダー */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/community')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 700 }}>
              チャンネル #{channelId}
            </Typography>
          </Box>

          {/* 投稿フォーム */}
          {canPost && (
            <Card sx={{ mb: 4, borderRadius: 2 }}>
              <CardContent>
                <Box component="form" onSubmit={handleSubmitPost}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="新しい投稿を作成..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    endIcon={<SendIcon />}
                    disabled={!newPost.trim() || isSubmitting}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    {isSubmitting ? '投稿中...' : '投稿する'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* 投稿一覧 */}
          {channelPosts.length > 0 ? (
            <List sx={{ width: '100%' }}>
              {channelPosts.map((post) => (
                <Card key={post.id} sx={{ mb: 3, borderRadius: 2 }}>
                  <CardContent>
                    {/* 投稿ヘッダー */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar sx={{ width: 40, height: 40 }}>
                        {post.username.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle1" fontWeight={600}>
                            {post.username}
                          </Typography>
                          <Chip
                            label={post.role}
                            size="small"
                            sx={{
                              background: getRoleGradient(post.role),
                              color: 'white',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                            }}
                          />
                        </Stack>
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
                    </Stack>

                    {/* 投稿内容 */}
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                      {post.content}
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    {/* アクションボタン */}
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button
                        startIcon={post.user_liked ? <Favorite color="error" /> : <FavoriteBorder />}
                        onClick={() => handleLike(post.id)}
                        size="small"
                        color={post.user_liked ? "error" : "inherit"}
                      >
                        {post.like_count}
                      </Button>
                      <Button
                        startIcon={<CommentIcon />}
                        onClick={() => handleToggleComments(post.id)}
                        size="small"
                        endIcon={expandedComments[post.id] ? <ExpandLess /> : <ExpandMore />}
                      >
                        {post.comment_count} コメント
                      </Button>
                    </Stack>

                    {/* コメントセクション */}
                    <Collapse in={expandedComments[post.id]} timeout="auto" unmountOnExit>
                      <Box sx={{ mt: 2 }}>
                        <Divider sx={{ mb: 2 }} />
                        
                        {/* コメント入力 */}
                        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="コメントを追加..."
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
                            送信
                          </Button>
                        </Box>

                        {/* コメント一覧 */}
                        {comments[post.id]?.map((comment) => (
                          <Paper key={comment.id} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {comment.username.charAt(0)}
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {comment.username}
                                  </Typography>
                                  <Chip
                                    label={comment.role}
                                    size="small"
                                    sx={{
                                      background: getRoleGradient(comment.role),
                                      color: 'white',
                                      fontWeight: 500,
                                      fontSize: '0.7rem',
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(comment.created_at)}
                                  </Typography>
                                </Stack>
                                <Typography variant="body2">
                                  {comment.content}
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
              ))}
            </List>
          ) : (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
              <CommentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                まだ投稿がありません
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {canPost ? '最初の投稿を作成してみましょう！' : 'このチャンネルの投稿を待ちましょう'}
              </Typography>
            </Paper>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

export default ChannelPage; 