import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Bookmark as BookmarkIcon,
  AutoAwesome as AutoAwesomeIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  ContentPaste as ContentPasteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

interface SavedPost {
  id: number;
  content: string;
  user_id: number;
  username: string;
  created_at: string;
  saved_at: string;
  avatar_url?: string;
  is_study_log?: boolean;
  study_tags?: string;
  target_language?: string;
  ai_response_enabled?: boolean;
  comments?: Comment[];
}

interface Comment {
  id: number;
  content: string;
  user_id: number;
  username: string;
  created_at: string;
  avatar_url?: string;
  post_id: number; // Added post_id to Comment interface
}

const VocabularyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<SavedPost[]>([]);
  const [editingMeaning, setEditingMeaning] = useState<{ postId: number; meaning: string } | null>(null);
  const [editingRelatedExpressions, setEditingRelatedExpressions] = useState<{ postId: number; expressions: string[] } | null>(null);
  const [editingExpressionAnalysis, setEditingExpressionAnalysis] = useState<{ postId: number; analysis: string } | null>(null);
  const [editingExamples, setEditingExamples] = useState<{ postId: number; examples: string } | null>(null);
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const [pastedWord, setPastedWord] = useState('');
  const [editingLearningContent, setEditingLearningContent] = useState<{ postId: number; content: string } | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);

  // 保存済み投稿を取得
  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/study-log/saved-posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // 各投稿のコメントを取得
        const postsWithComments = await Promise.all(
          response.data.savedPosts.map(async (post: SavedPost) => {
            try {
              console.log(`Fetching comments for post ${post.id}...`);
              const commentsResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/posts/posts/${post.id}/comments`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              
              console.log(`Comments response for post ${post.id}:`, commentsResponse.data);
              
              if (commentsResponse.data.comments) {
                return { ...post, comments: commentsResponse.data.comments };
              }
            } catch (error) {
              console.log(`Comments fetch failed for post ${post.id}:`, error);
            }
            return { ...post, comments: [] };
          })
        );
        
        console.log('Posts with comments:', postsWithComments);
        setSavedPosts(postsWithComments);
        setFilteredPosts(postsWithComments);
      } else {
        setError('保存済み投稿の取得に失敗しました');
      }
    } catch (error: any) {
      console.error('保存済み投稿取得エラー:', error);
      setError('保存済み投稿の取得に失敗しました: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // マイ単語帳から削除
  const handleRemoveFromVocabulary = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/study-log/posts/${postId}/save`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // 削除成功後、リストを更新
        setSavedPosts(prev => prev.filter(post => post.id !== postId));
        setFilteredPosts(prev => prev.filter(post => post.id !== postId));
        alert('✅ マイ単語帳から削除しました');
      } else {
        alert('❌ 削除に失敗しました');
      }
    } catch (error: any) {
      console.error('削除エラー:', error);
      alert('❌ 削除に失敗しました: ' + (error.response?.data?.error || error.message));
    }
  };

  // 検索機能
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredPosts(savedPosts);
      return;
    }

    const filtered = savedPosts.filter(post => 
      post.content.toLowerCase().includes(term.toLowerCase()) ||
      post.username.toLowerCase().includes(term.toLowerCase()) ||
      (post.study_tags && JSON.parse(post.study_tags).some((tag: string) => 
        tag.toLowerCase().includes(term.toLowerCase())
      ))
    );
    
    setFilteredPosts(filtered);
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // URLをリンクに変換
  const convertUrlsToLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: underline;">${url}</a>`;
    });
  };

  // AIコメントを学習用に解析・整理
  const parseAIComment = (commentContent: string) => {
    const sections = {
      encouragement: '',
      expressionAnalysis: '',
      examples: '',
      relatedExpressions: [] as string[]
    };

    const lines = commentContent.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('🎉 **励ましの言葉**') || trimmedLine.includes('🎉 **Encouragement**')) {
        currentSection = 'encouragement';
      } else if (trimmedLine.includes('📝 **表現の解説**') || trimmedLine.includes('📝 **Expression Analysis**')) {
        currentSection = 'expressionAnalysis';
      } else if (trimmedLine.includes('💡 **例文**') || trimmedLine.includes('💡 **Example Sentences**')) {
        currentSection = 'examples';
      } else if (trimmedLine.includes('📚 **関連表現**') || trimmedLine.includes('📚 **Related Expressions**')) {
        currentSection = 'relatedExpressions';
      } else if (trimmedLine && currentSection === 'encouragement') {
        sections.encouragement += (sections.encouragement ? '\n' : '') + trimmedLine;
      } else if (trimmedLine && currentSection === 'expressionAnalysis') {
        sections.expressionAnalysis += (sections.expressionAnalysis ? '\n' : '') + trimmedLine;
      } else if (trimmedLine && currentSection === 'examples') {
        sections.examples += (sections.examples ? '\n' : '') + trimmedLine;
      } else if (trimmedLine && currentSection === 'relatedExpressions') {
        // 関連表現の抽出を改善
        if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || trimmedLine.startsWith('*')) {
          // 箇条書き形式の関連表現を抽出
          const expression = trimmedLine
            .replace(/^[-•*]\s*/, '') // 箇条書き記号を削除
            .replace(/\*\*(.*?)\*\*/g, '$1') // マークダウンの太字を削除
            .replace(/\(.*?\)/g, '') // 括弧内の説明を削除
            .trim();
          
          if (expression && !expression.includes('**') && !expression.includes('関連表現') && !expression.includes('Related Expressions')) {
            sections.relatedExpressions.push(expression);
            console.log('Found related expression:', expression);
          }
        } else if (!trimmedLine.includes('**') && !trimmedLine.includes('関連表現') && !trimmedLine.includes('Related Expressions') && !trimmedLine.includes('これらの表現') && !trimmedLine.includes('These expressions') && trimmedLine.length > 0) {
          // 通常のテキスト形式の関連表現を抽出（説明文を除外）
          const expression = trimmedLine
            .replace(/\*\*(.*?)\*\*/g, '$1') // マークダウンの太字を削除
            .replace(/\(.*?\)/g, '') // 括弧内の説明を削除
            .trim();
          
          if (expression && expression.length > 0 && !expression.includes('使い分け') && !expression.includes('使い方')) {
            sections.relatedExpressions.push(expression);
            console.log('Found related expression (text):', expression);
          }
        }
      }
    }

    return sections;
  };

  // 意味の編集
  const handleEditMeaning = (postId: number, currentMeaning: string) => {
    setEditingMeaning({ postId, meaning: currentMeaning });
  };

  const handleSaveMeaning = async () => {
    if (!editingMeaning) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/study-log/posts/${editingMeaning.postId}/meaning`,
        { meaning: editingMeaning.meaning },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // ローカル状態を更新
      setSavedPosts(prev => prev.map(post => 
        post.id === editingMeaning.postId 
          ? { ...post, study_meaning: editingMeaning.meaning }
          : post
      ));
      setFilteredPosts(prev => prev.map(post => 
        post.id === editingMeaning.postId 
          ? { ...post, study_meaning: editingMeaning.meaning }
          : post
      ));
      
      setEditingMeaning(null);
      alert('✅ 意味を更新しました');
    } catch (error: any) {
      console.error('意味更新エラー:', error);
      alert('❌ 意味の更新に失敗しました');
    }
  };

  // 関連表現の編集
  const handleEditRelatedExpressions = (postId: number, currentExpressions: string[]) => {
    setEditingRelatedExpressions({ postId, expressions: currentExpressions });
  };

  const handleSaveRelatedExpressions = async () => {
    if (!editingRelatedExpressions) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/study-log/posts/${editingRelatedExpressions.postId}/related-expressions`,
        { expressions: editingRelatedExpressions.expressions },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // ローカル状態を更新（AIコメントも更新）
      setSavedPosts(prev => prev.map(post => 
        post.id === editingRelatedExpressions.postId 
          ? {
              ...post,
              comments: post.comments?.map(comment => 
                comment.username === 'AI学習サポート' 
                  ? { 
                      ...comment, 
                      content: comment.content.replace(
                        /📚 \*\*関連表現\*\*\n([\s\S]*?)(?=\n\n|$)/,
                        `📚 **関連表現**\n${editingRelatedExpressions.expressions.map(exp => `- ${exp}`).join('\n')}\n`
                      )
                    }
                  : comment
              )
            }
          : post
      ));
      setFilteredPosts(prev => prev.map(post => 
        post.id === editingRelatedExpressions.postId 
          ? {
              ...post,
              comments: post.comments?.map(comment => 
                comment.username === 'AI学習サポート' 
                  ? { 
                      ...comment, 
                      content: comment.content.replace(
                        /📚 \*\*関連表現\*\*\n([\s\S]*?)(?=\n\n|$)/,
                        `📚 **関連表現**\n${editingRelatedExpressions.expressions.map(exp => `- ${exp}`).join('\n')}\n`
                      )
                    }
                  : comment
              )
            }
          : post
      ));
      
      setEditingRelatedExpressions(null);
      
      // 強制的に再レンダリング
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
      alert('✅ 関連表現を更新しました');
    } catch (error: any) {
      console.error('関連表現更新エラー:', error);
      alert('❌ 関連表現の更新に失敗しました');
    }
  };

  // 表現の解説の編集
  const handleEditExpressionAnalysis = (postId: number, currentAnalysis: string) => {
    setEditingExpressionAnalysis({ postId, analysis: currentAnalysis });
  };

  const handleSaveExpressionAnalysis = async () => {
    if (!editingExpressionAnalysis) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/study-log/posts/${editingExpressionAnalysis.postId}/expression-analysis`,
        { analysis: editingExpressionAnalysis.analysis },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // ローカル状態を更新（AIコメントを更新）
      setSavedPosts(prev => prev.map(post => 
        post.id === editingExpressionAnalysis.postId 
          ? {
              ...post,
              comments: post.comments?.map(comment => 
                comment.username === 'AI学習サポート' 
                  ? { ...comment, content: comment.content.replace(/📝 \*\*表現の解説\*\*\n([\s\S]*?)(?=💡 \*\*例文\*\*|📚 \*\*関連表現\*\*|$)/, `📝 **表現の解説**\n${editingExpressionAnalysis.analysis}\n`) }
                  : comment
              )
            }
          : post
      ));
      setFilteredPosts(prev => prev.map(post => 
        post.id === editingExpressionAnalysis.postId 
          ? {
              ...post,
              comments: post.comments?.map(comment => 
                comment.username === 'AI学習サポート' 
                  ? { ...comment, content: comment.content.replace(/📝 \*\*表現の解説\*\*\n([\s\S]*?)(?=💡 \*\*例文\*\*|📚 \*\*関連表現\*\*|$)/, `📝 **表現の解説**\n${editingExpressionAnalysis.analysis}\n`) }
                  : comment
              )
            }
          : post
      ));
      
      setEditingExpressionAnalysis(null);
      alert('✅ 表現の解説を更新しました');
    } catch (error: any) {
      console.error('表現の解説更新エラー:', error);
      alert('❌ 表現の解説の更新に失敗しました');
    }
  };

  // 例文の編集
  const handleEditExamples = (postId: number, currentExamples: string) => {
    setEditingExamples({ postId, examples: currentExamples });
  };

  const handleSaveExamples = async () => {
    if (!editingExamples) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/study-log/posts/${editingExamples.postId}/examples`,
        { examples: editingExamples.examples },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // ローカル状態を更新（AIコメントを更新）
      setSavedPosts(prev => prev.map(post => 
        post.id === editingExamples.postId 
          ? {
              ...post,
              comments: post.comments?.map(comment => 
                comment.username === 'AI学習サポート' 
                  ? { ...comment, content: comment.content.replace(/💡 \*\*例文\*\*\n([\s\S]*?)(?=📚 \*\*関連表現\*\*|$)/, `💡 **例文**\n${editingExamples.examples}\n`) }
                  : comment
              )
            }
          : post
      ));
      setFilteredPosts(prev => prev.map(post => 
        post.id === editingExamples.postId 
          ? {
              ...post,
              comments: post.comments?.map(comment => 
                comment.username === 'AI学習サポート' 
                  ? { ...comment, content: comment.content.replace(/💡 \*\*例文\*\*\n([\s\S]*?)(?=📚 \*\*関連表現\*\*|$)/, `💡 **例文**\n${editingExamples.examples}\n`) }
                  : comment
              )
            }
          : post
      ));
      
      setEditingExamples(null);
      alert('✅ 例文を更新しました');
    } catch (error: any) {
      console.error('例文更新エラー:', error);
      alert('❌ 例文の更新に失敗しました');
    }
  };

  // アコーディオンの開閉ハンドラー
  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  // 学習内容の編集
  const handleEditLearningContent = (postId: number, currentContent: string) => {
    setEditingLearningContent({ postId, content: currentContent });
  };

  const handleSaveLearningContent = async () => {
    if (!editingLearningContent) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/study-log/posts/${editingLearningContent.postId}/learning-content`,
        { content: editingLearningContent.content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // ローカル状態を更新
      setSavedPosts(prev => prev.map(post => 
        post.id === editingLearningContent.postId 
          ? { ...post, content: editingLearningContent.content }
          : post
      ));
      setFilteredPosts(prev => prev.map(post => 
        post.id === editingLearningContent.postId 
          ? { ...post, content: editingLearningContent.content }
          : post
      ));
      
      setEditingLearningContent(null);
      alert('✅ 学習内容を更新しました');
    } catch (error: any) {
      console.error('学習内容更新エラー:', error);
      alert('❌ 学習内容の更新に失敗しました');
    }
  };

  // ペースト機能のハンドラー
  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setPastedContent(clipboardText);
      setShowPasteDialog(true);
    } catch (error) {
      console.error('クリップボード読み取りエラー:', error);
      alert('❌ クリップボードの読み取りに失敗しました');
    }
  };

  const handleSavePastedContent = async () => {
    if (!pastedWord.trim() || !pastedContent.trim()) {
      alert('❌ 単語と内容を入力してください');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/study-log/paste-vocabulary`,
        {
          word: pastedWord,
          content: pastedContent
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert('✅ マイ単語帳に保存しました！');
        setShowPasteDialog(false);
        setPastedContent('');
        setPastedWord('');
        fetchSavedPosts(); // 投稿一覧を再取得
      }
    } catch (error: any) {
      console.error('ペースト保存エラー:', error);
      alert('❌ 保存に失敗しました');
    }
  };

  // AIコメント表示コンポーネント
  const AILearningSection = ({ comment }: { comment: Comment }) => {
    const aiContent = parseAIComment(comment.content);
    
    return (
      <Box sx={{ 
        mt: 2, 
        p: 2, 
        backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
        borderRadius: 2,
        border: `1px solid ${isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AutoAwesomeIcon sx={{ mr: 1, color: 'secondary.main' }} />
          <Typography variant="subtitle2" fontWeight={600} color="secondary.main">
            AI学習サポート
          </Typography>
        </Box>

        {/* 励ましの言葉 */}
        {aiContent.encouragement && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              🎉 励ましの言葉
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {aiContent.encouragement}
            </Typography>
          </Box>
        )}

        {/* 表現の解説 */}
        {aiContent.expressionAnalysis && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                📝 表現の解説
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleEditExpressionAnalysis(comment.post_id, aiContent.expressionAnalysis)}
                sx={{ p: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
            {editingExpressionAnalysis?.postId === comment.post_id ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  multiline
                  rows={3}
                  value={editingExpressionAnalysis.analysis}
                  onChange={(e) => setEditingExpressionAnalysis({ ...editingExpressionAnalysis, analysis: e.target.value })}
                  size="small"
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={handleSaveExpressionAnalysis}>保存</Button>
                  <Button size="small" onClick={() => setEditingExpressionAnalysis(null)}>キャンセル</Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {aiContent.expressionAnalysis}
              </Typography>
            )}
          </Box>
        )}

        {/* 例文 */}
        {aiContent.examples && aiContent.examples.trim() && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                💡 例文
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleEditExamples(comment.post_id, Array.isArray(aiContent.examples) ? aiContent.examples.join('\n') : aiContent.examples)}
                sx={{ p: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
            {editingExamples?.postId === comment.post_id ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  multiline
                  rows={4}
                  value={editingExamples.examples}
                  onChange={(e) => setEditingExamples({ ...editingExamples, examples: e.target.value })}
                  size="small"
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={handleSaveExamples}>保存</Button>
                  <Button size="small" onClick={() => setEditingExamples(null)}>キャンセル</Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                {aiContent.examples}
              </Typography>
            )}
          </Box>
        )}

        {/* 関連表現 */}
        {aiContent.relatedExpressions.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                📚 関連表現
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleEditRelatedExpressions(comment.post_id, aiContent.relatedExpressions)}
                sx={{ p: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
            {editingRelatedExpressions?.postId === comment.post_id ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  multiline
                  rows={3}
                  value={editingRelatedExpressions.expressions.join('\n')}
                  onChange={(e) => setEditingRelatedExpressions({ 
                    ...editingRelatedExpressions, 
                    expressions: e.target.value.split('\n').filter(line => line.trim()) 
                  })}
                  size="small"
                  placeholder="1行に1つの関連表現を入力"
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={handleSaveRelatedExpressions}>保存</Button>
                  <Button size="small" onClick={() => setEditingRelatedExpressions(null)}>キャンセル</Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mt: 0.5 }}>
                {aiContent.relatedExpressions.map((expression, index) => {
                  const parts = expression.split(':');
                  const keyword = parts[0]?.trim();
                  const description = parts[1]?.trim();
                  return (
                    <Box key={index} sx={{
                      mb: 1, p: 1,
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: 1,
                      borderLeft: '3px solid #4caf50'
                    }}>
                      {keyword && (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', mb: description ? 0.5 : 0 }}>
                          {keyword}
                        </Typography>
                      )}
                      {description && (
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                          {description}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BookmarkIcon sx={{ color: 'secondary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {t('vocabulary')}
          </Typography>
        </Box>
      </Box>

      {/* 統計情報 */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? 'grey.800' : 'grey.50' }}>
        <Typography variant="body2" color="text.secondary">
          📚 {t('savedPosts')}: <strong>{savedPosts.length}</strong>件
          {searchTerm && (
            <>
              {' | '}{t('searchResults')}: <strong>{filteredPosts.length}</strong>件
            </>
          )}
        </Typography>
      </Paper>

      {/* 検索バーとペーストボタン */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          📖 マイ単語帳
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<ContentPasteIcon />}
            onClick={handlePasteFromClipboard}
            sx={{ 
              backgroundColor: 'secondary.main',
              '&:hover': {
                backgroundColor: 'secondary.dark'
              }
            }}
          >
            ペースト
          </Button>
        </Box>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 投稿一覧 */}
      {filteredPosts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BookmarkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {searchTerm ? t('noSearchResults') : t('vocabularyEmpty')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm 
              ? t('tryDifferentKeyword')
              : t('vocabularyEmptyMessage')
            }
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filteredPosts.map((post) => (
            <Card key={post.id} sx={{ 
              border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
              '&:hover': {
                boxShadow: isDarkMode ? '0 4px 20px rgba(255,255,255,0.1)' : '0 4px 20px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{ p: 2 }}>
                {/* 単語・表現のヘッダー */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {post.content}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(post.saved_at)}
                    </Typography>
                    <Tooltip title={t('removeFromVocabulary')}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveFromVocabulary(post.id)}
                        sx={{
                          backgroundColor: isDarkMode ? 'grey.800' : 'grey.100',
                          '&:hover': {
                            backgroundColor: isDarkMode ? 'grey.700' : 'grey.200'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* アコーディオンで詳細表示 */}
                <Accordion 
                  expanded={expandedAccordion === `panel-${post.id}`}
                  onChange={handleAccordionChange(`panel-${post.id}`)}
                  sx={{ 
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      px: 0,
                      minHeight: '40px',
                      '& .MuiAccordionSummary-content': { margin: 0 }
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      詳細
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 1 }}>
                    {/* 意味表示 */}
                    {(post as any).is_study_log && (post as any).study_meaning && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            📖 意味:
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleEditMeaning(post.id, (post as any).study_meaning)}
                            sx={{ p: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        {editingMeaning?.postId === post.id ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              size="small"
                              value={editingMeaning.meaning}
                              onChange={(e) => setEditingMeaning({ ...editingMeaning, meaning: e.target.value })}
                              sx={{ flex: 1 }}
                            />
                            <Button size="small" onClick={handleSaveMeaning}>保存</Button>
                            <Button size="small" onClick={() => setEditingMeaning(null)}>キャンセル</Button>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600,
                            color: 'primary.main',
                            backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                            padding: 1,
                            borderRadius: 1,
                            border: `1px solid ${isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`
                          }}>
                            {/* 冗長な説明を削除して簡潔な意味のみを表示 */}
                            {(post as any).study_meaning
                              .replace(/^["「].*?["」]\s*means?\s*["「]/, '') // "Let's go" means " を削除
                              .replace(/["「].*?["」]\s*です?。?$/, '') // " です。" を削除
                              .replace(/^.*?を指す英単語です?。?$/, '') // "「魚」を指す英単語です。" を削除
                              .trim() || (post as any).study_meaning
                            }
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* 学習内容（フリースペース） */}
                    {post.is_study_log && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            📝 学習内容:
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleEditLearningContent(post.id, post.content)}
                            sx={{ p: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        {editingLearningContent?.postId === post.id ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <TextField
                              multiline
                              rows={6}
                              value={editingLearningContent.content}
                              onChange={(e) => setEditingLearningContent({ ...editingLearningContent, content: e.target.value })}
                              size="small"
                              placeholder="Study BoardのAI学習サポートをコピペしたり、自分で自由に記入してください"
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button size="small" onClick={handleSaveLearningContent}>保存</Button>
                              <Button size="small" onClick={() => setEditingLearningContent(null)}>キャンセル</Button>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ 
                            whiteSpace: 'pre-line',
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                            padding: 2,
                            borderRadius: 1,
                            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                            minHeight: '60px'
                          }}>
                            {post.content || '学習内容を記入してください'}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* ペーストダイアログ */}
      <Dialog open={showPasteDialog} onClose={() => setShowPasteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>マイ単語帳にペースト</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="単語・表現"
              value={pastedWord}
              onChange={(e) => setPastedWord(e.target.value)}
              placeholder="例: fish, Let's go, こんにちは"
              fullWidth
            />
            <TextField
              label="学習内容"
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              multiline
              rows={8}
              fullWidth
              placeholder="学習した内容やメモをここに入力してください"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasteDialog(false)}>キャンセル</Button>
          <Button onClick={handleSavePastedContent} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VocabularyPage; 