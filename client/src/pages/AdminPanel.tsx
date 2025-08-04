import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Stack,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useCommunity } from '../contexts/CommunityContext';
import axios from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const {
    categories,
    channels,
    loadCategories,
    loadChannels,
    createCategory,
    createChannel,
    deleteChannel,
  } = useCommunity();

  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // カテゴリ作成・編集用
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // チャンネル作成・編集用
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    description: '',
    categoryId: '',
    channelType: ''
  });
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [editChannelData, setEditChannelData] = useState({
    name: '',
    description: '',
    channelType: ''
  });

  // ユーザーロール変更用
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'サーバー管理者') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      await loadCategories();
      await loadUsers();
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get('/api/auth/users');
      setUsers(response.data.users);
    } catch (error: any) {
      setError('ユーザー一覧の取得に失敗しました');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('カテゴリ名を入力してください');
      return;
    }

    try {
      await createCategory(newCategoryName);
      setNewCategoryName('');
      setCategoryDialogOpen(false);
      setSuccess('カテゴリが作成されました');
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'カテゴリの作成に失敗しました');
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelData.name.trim() || !newChannelData.categoryId || !newChannelData.channelType) {
      setError('すべての必須項目を入力してください');
      return;
    }

    try {
      await createChannel(
        Number(newChannelData.categoryId),
        newChannelData.name,
        newChannelData.description,
        newChannelData.channelType
      );
      setNewChannelData({ name: '', description: '', categoryId: '', channelType: '' });
      setChannelDialogOpen(false);
      setSuccess('チャンネルが作成されました');
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'チャンネルの作成に失敗しました');
    }
  };

  const handleDeleteChannel = async (channelId: number) => {
    if (window.confirm('このチャンネルを削除しますか？')) {
      try {
        await deleteChannel(channelId);
        setSuccess('チャンネルが削除されました');
        setError('');
      } catch (error: any) {
        setError(error.response?.data?.error || 'チャンネルの削除に失敗しました');
      }
    }
  };

  const handleChangeUserRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await axios.put(`/api/auth/users/${selectedUser.id}/role`, { role: newRole });
      await loadUsers();
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
      setSuccess('ユーザーロールが変更されました');
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'ロールの変更に失敗しました');
    }
  };

  const openRoleDialog = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleEditCategory = async () => {
    try {
      if (!editCategoryName.trim()) {
        setError('カテゴリ名を入力してください');
        return;
      }

      const response = await axios.put(`/api/channels/categories/${editingCategory.id}`, {
        name: editCategoryName
      });

      setSuccess('カテゴリが更新されました');
      setEditingCategory(null);
      setEditCategoryName('');
      // カテゴリ一覧を再読み込み
      await loadData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'カテゴリの更新に失敗しました');
    }
  };

  const handleEditChannel = async () => {
    try {
      if (!editChannelData.name || !editChannelData.channelType) {
        setError('全ての必須フィールドを入力してください');
        return;
      }

      const response = await axios.put(`/api/channels/channels/${editingChannel.id}`, {
        name: editChannelData.name,
        description: editChannelData.description,
        channel_type: editChannelData.channelType
      });

      setSuccess('チャンネルが更新されました');
      setEditingChannel(null);
      setEditChannelData({ name: '', description: '', channelType: '' });
      // チャンネル一覧を再読み込み
      await loadData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'チャンネルの更新に失敗しました');
    }
  };

  const openEditCategoryDialog = (category: any) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
  };

  const openEditChannelDialog = (channel: any) => {
    setEditingChannel(channel);
    setEditChannelData({
      name: channel.name,
      description: channel.description || '',
      channelType: channel.channel_type
    });
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
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const channelTypeLabels = {
    'admin_only_instructors_view': '管理者専用（講師のみ閲覧）',
    'admin_only_all_view': '管理者専用（全員閲覧）',
    'instructors_post_all_view': '講師投稿（全員閲覧）',
    'all_post_all_view': '全員投稿・閲覧'
  };

  const roles = [
    'Trial参加者',
    'ECGメンバー',
    'JCGメンバー',
    'Class1 Members',
    'ECG講師',
    'JCG講師',
    'サーバー管理者'
  ];

  const channelTypes = [
    { value: 'all_post_all_view', label: '全員投稿・全員閲覧' },
    { value: 'admin_only_all_view', label: '管理者のみ投稿・全員閲覧' },
    { value: 'instructors_post_all_view', label: '講師以上投稿・全員閲覧' },
    { value: 'admin_only_instructors_view', label: '管理者のみ投稿・講師以上閲覧' },
    { value: 'class1_post_class1_view', label: 'Class1以上投稿・Class1以上閲覧' }
  ];

  if (user?.role !== 'サーバー管理者') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">管理者権限が必要です</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Fade in timeout={800}>
        <Box>
          {/* ヘッダー */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <AdminPanelSettings sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h3" component="h1" fontWeight={700}>
                管理者パネル
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              サーバーの設定とユーザー管理を行います
            </Typography>
          </Box>

          {/* アラート */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* タブ */}
          <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="ユーザー管理" />
                <Tab label="カテゴリ管理" />
                <Tab label="チャンネル管理" />
              </Tabs>
            </Box>

            {/* ユーザー管理タブ */}
            <TabPanel value={tabValue} index={0}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ユーザー名</TableCell>
                      <TableCell>メールアドレス</TableCell>
                      <TableCell>ロール</TableCell>
                      <TableCell>登録日</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            sx={{
                              background: getRoleGradient(user.role),
                              color: 'white',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => openRoleDialog(user)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* カテゴリ管理タブ */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCategoryDialogOpen(true)}
                >
                  新しいカテゴリを作成
                </Button>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>カテゴリ名</TableCell>
                      <TableCell>作成日</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{formatDate(category.created_at)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => openEditCategoryDialog(category)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* チャンネル管理タブ */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setChannelDialogOpen(true)}
                >
                  新しいチャンネルを作成
                </Button>
              </Box>

              {categories.map((category) => {
                const categoryChannels = channels[category.id] || [];
                if (!categoryChannels.length) return null;

                return (
                  <Box key={category.id} sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      {category.name}
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>チャンネル名</TableCell>
                            <TableCell>説明</TableCell>
                            <TableCell>タイプ</TableCell>
                            <TableCell>投稿数</TableCell>
                            <TableCell>操作</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categoryChannels.map((channel) => (
                            <TableRow key={channel.id}>
                              <TableCell>{channel.name}</TableCell>
                              <TableCell>{channel.description}</TableCell>
                              <TableCell>
                                <Chip
                                  label={channelTypeLabels[channel.channel_type as keyof typeof channelTypeLabels]}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>{channel.post_count}</TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => openEditChannelDialog(channel)}
                                  color="primary"
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteChannel(channel.id)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                );
              })}
            </TabPanel>
          </Card>

          {/* カテゴリ作成ダイアログ */}
          <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)}>
            <DialogTitle>新しいカテゴリを作成</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="カテゴリ名"
                fullWidth
                variant="outlined"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCategoryDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleCreateCategory} variant="contained">
                作成
              </Button>
            </DialogActions>
          </Dialog>

          {/* チャンネル作成ダイアログ */}
          <Dialog open={channelDialogOpen} onClose={() => setChannelDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>新しいチャンネルを作成</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="チャンネル名"
                  fullWidth
                  variant="outlined"
                  value={newChannelData.name}
                  onChange={(e) => setNewChannelData({ ...newChannelData, name: e.target.value })}
                  required
                />
                <TextField
                  label="説明"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={2}
                  value={newChannelData.description}
                  onChange={(e) => setNewChannelData({ ...newChannelData, description: e.target.value })}
                />
                <FormControl fullWidth required>
                  <InputLabel>カテゴリ</InputLabel>
                  <Select
                    value={newChannelData.categoryId}
                    onChange={(e) => setNewChannelData({ ...newChannelData, categoryId: e.target.value })}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel>チャンネルタイプ</InputLabel>
                  <Select
                    value={newChannelData.channelType}
                    onChange={(e) => setNewChannelData({ ...newChannelData, channelType: e.target.value })}
                  >
                    {channelTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setChannelDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleCreateChannel} variant="contained">
                作成
              </Button>
            </DialogActions>
          </Dialog>

          {/* カテゴリ編集ダイアログ */}
          <Dialog open={!!editingCategory} onClose={() => setEditingCategory(null)}>
            <DialogTitle>カテゴリを編集</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="カテゴリ名"
                fullWidth
                variant="outlined"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingCategory(null)}>キャンセル</Button>
              <Button onClick={handleEditCategory} variant="contained">
                更新
              </Button>
            </DialogActions>
          </Dialog>

          {/* チャンネル編集ダイアログ */}
          <Dialog open={!!editingChannel} onClose={() => setEditingChannel(null)} maxWidth="sm" fullWidth>
            <DialogTitle>チャンネルを編集</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="チャンネル名"
                  fullWidth
                  variant="outlined"
                  value={editChannelData.name}
                  onChange={(e) => setEditChannelData({ ...editChannelData, name: e.target.value })}
                  required
                />
                <TextField
                  label="説明"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={2}
                  value={editChannelData.description}
                  onChange={(e) => setEditChannelData({ ...editChannelData, description: e.target.value })}
                />
                <FormControl fullWidth required>
                  <InputLabel>チャンネルタイプ</InputLabel>
                  <Select
                    value={editChannelData.channelType}
                    onChange={(e) => setEditChannelData({ ...editChannelData, channelType: e.target.value })}
                  >
                    {channelTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingChannel(null)}>キャンセル</Button>
              <Button onClick={handleEditChannel} variant="contained">
                更新
              </Button>
            </DialogActions>
          </Dialog>

          {/* ロール変更ダイアログ */}
          <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
            <DialogTitle>ユーザーロールを変更</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selectedUser?.username} のロールを変更します
              </Typography>
              <FormControl fullWidth>
                <InputLabel>新しいロール</InputLabel>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  {roles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRoleDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleChangeUserRole} variant="contained">
                変更
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminPanel; 