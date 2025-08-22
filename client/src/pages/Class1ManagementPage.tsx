import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Chip,
  Tabs,
  Tab,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Student {
  id: number;
  name: string;
  instructor_id: number;
  instructor_name: string;
  email?: string;
  memo?: string;
  next_lesson_date?: string;
  lesson_completed_date?: string;
  dm_scheduled: boolean;
  lesson_completed: boolean;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  role: string;
}

const Class1ManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [addStudentDialog, setAddStudentDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // フォーム状態
  const [studentName, setStudentName] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [studentMemo, setStudentMemo] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [isNewStudent, setIsNewStudent] = useState(true);

  // 権限チェック
  const hasPermission = user?.role === 'ECG講師' || user?.role === 'JCG講師' || user?.role === 'サーバー管理者';

  useEffect(() => {
    if (!hasPermission) {
      navigate('/');
      return;
    }
    fetchData();
  }, [hasPermission, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // 生徒データを取得
      const studentsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/class1/students`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ユーザーデータを取得
      const usersResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/auth/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('生徒データレスポンス:', studentsResponse.data);
      console.log('ユーザーデータレスポンス:', usersResponse.data);

      if (studentsResponse.data.success) {
        setStudents(studentsResponse.data.students);
        console.log('生徒データ設定完了:', studentsResponse.data.students);
      }
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.users);
        console.log('ユーザーデータ設定完了:', usersResponse.data.users);
        
        // 講師とClass1 Membersの数を確認
        const instructors = usersResponse.data.users.filter((user: any) => 
          user.role === 'ECG講師' || user.role === 'JCG講師'
        );
        const class1Members = usersResponse.data.users.filter((user: any) => 
          user.role === 'Class1 Members'
        );
        
        console.log('講師数:', instructors.length, instructors);
        console.log('Class1 Members数:', class1Members.length, class1Members);
      }
    } catch (error: any) {
      console.error('データ取得エラー:', error);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/class1/students`,
        {
          name: studentName,
          instructor_id: parseInt(selectedInstructor),
          memo: studentMemo,
          email: studentEmail,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setAddStudentDialog(false);
        resetForm();
        fetchData();
        alert('生徒を追加しました');
      }
    } catch (error: any) {
      console.error('生徒追加エラー:', error);
      alert('生徒の追加に失敗しました');
    }
  };

  const handleUpdateLessonDate = async (studentId: number, field: 'next_lesson_date' | 'lesson_completed_date', value: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/class1/students/${studentId}/lesson-date`,
        {
          field,
          value,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        fetchData();
        alert('レッスン日を更新しました');
      }
    } catch (error: any) {
      console.error('レッスン日更新エラー:', error);
      alert('レッスン日の更新に失敗しました');
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!window.confirm('この生徒を削除しますか？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/class1/students/${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        fetchData();
        alert('生徒を削除しました');
      }
    } catch (error: any) {
      console.error('生徒削除エラー:', error);
      alert('生徒の削除に失敗しました');
    }
  };

  const resetForm = () => {
    setStudentName('');
    setSelectedInstructor('');
    setStudentMemo('');
    setStudentEmail('');
    setIsNewStudent(true);
  };

  const getInstructors = () => {
    return users.filter(user => 
      user.role === 'ECG講師' || user.role === 'JCG講師'
    );
  };

  const getClass1Members = () => {
    return users.filter(user => user.role === 'Class1 Members');
  };

  if (!hasPermission) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SchoolIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Class1 レッスン管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddStudentDialog(true)}
          sx={{ 
            backgroundColor: 'secondary.main',
            '&:hover': { backgroundColor: 'secondary.dark' }
          }}
        >
          生徒を追加
        </Button>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* タブ */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="生徒管理" icon={<PersonIcon />} />
          <Tab label="カレンダー" icon={<CalendarIcon />} />
        </Tabs>
      </Paper>

      {/* 生徒管理タブ */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {students.map((student) => (
            <Grid item xs={12} md={6} key={student.id}>
              <Card sx={{ 
                border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
                '&:hover': {
                  boxShadow: isDarkMode ? '0 4px 20px rgba(255,255,255,0.1)' : '0 4px 20px rgba(0,0,0,0.1)'
                }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {student.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        担当講師: {student.instructor_name}
                      </Typography>
                    </Box>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  {student.memo && (
                    <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                      メモ: {student.memo}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* DMで次回レッスン日を調整 */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Checkbox
                        checked={student.dm_scheduled}
                        disabled
                        color="primary"
                      />
                      <Typography variant="body2">
                        DMで次回レッスン日を調整した
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        type="date"
                        size="small"
                        value={student.next_lesson_date || ''}
                        onChange={(e) => handleUpdateLessonDate(student.id, 'next_lesson_date', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          handleUpdateLessonDate(student.id, 'next_lesson_date', today);
                        }}
                      >
                        今日を設定
                      </Button>
                    </Box>
                  </Box>

                  {/* レッスンを実施 */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Checkbox
                        checked={student.lesson_completed}
                        disabled
                        color="primary"
                      />
                      <Typography variant="body2">
                        レッスンを実施した
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        type="date"
                        size="small"
                        value={student.lesson_completed_date || ''}
                        onChange={(e) => handleUpdateLessonDate(student.id, 'lesson_completed_date', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          handleUpdateLessonDate(student.id, 'lesson_completed_date', today);
                        }}
                      >
                        今日を設定
                      </Button>
                    </Box>
                  </Box>

                  {/* 進捗表示 */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      進捗: {student.dm_scheduled ? '✅' : '⏳'} DM調整 
                      {student.lesson_completed ? '✅' : '⏳'} レッスン実施
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* カレンダータブ */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              レッスンカレンダー
            </Typography>
            <Typography variant="body2" color="text.secondary">
              カレンダー機能は現在開発中です。
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* 生徒追加ダイアログ */}
      <Dialog open={addStudentDialog} onClose={() => setAddStudentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>生徒を追加</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>生徒の種類</InputLabel>
              <Select
                value={isNewStudent ? 'new' : 'existing'}
                onChange={(e) => {
                  setIsNewStudent(e.target.value === 'new');
                  setStudentName('');
                }}
                label="生徒の種類"
              >
                <MenuItem value="new">新規生徒名を入力</MenuItem>
                <MenuItem value="existing">Class1 Membersから選択</MenuItem>
              </Select>
            </FormControl>

            {isNewStudent ? (
              <TextField
                fullWidth
                label="生徒名"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="生徒名を入力"
              />
            ) : (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Class1 Members</InputLabel>
                <Select
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  label="Class1 Members"
                >
                  {(() => {
                    const members = getClass1Members();
                    console.log('Class1 Members for dropdown:', members);
                    return members.map((member) => (
                      <MenuItem key={member.id} value={member.username}>
                        {member.username}
                      </MenuItem>
                    ));
                  })()}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>担当講師</InputLabel>
              <Select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                label="担当講師"
              >
                {(() => {
                  const instructors = getInstructors();
                  console.log('講師 for dropdown:', instructors);
                  return instructors.map((instructor) => (
                    <MenuItem key={instructor.id} value={instructor.id}>
                      {instructor.username} ({instructor.role})
                    </MenuItem>
                  ));
                })()}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="メモ（任意）"
              value={studentMemo}
              onChange={(e) => setStudentMemo(e.target.value)}
              multiline
              rows={2}
              sx={{ mb: 2 }}
              placeholder="例: 火曜午後が都合良い"
            />

            <TextField
              fullWidth
              label="メールアドレス（任意）"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              type="email"
              sx={{ mb: 1 }}
              placeholder="student@example.com"
            />

            <Typography variant="caption" color="text.secondary">
              後から編集・削除できます。
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStudentDialog(false)}>キャンセル</Button>
          <Button 
            onClick={handleAddStudent} 
            variant="contained"
            disabled={!studentName || !selectedInstructor}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Class1ManagementPage; 