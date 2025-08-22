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
  LinearProgress,
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
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
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
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // 週次チェックリスト用の状態
  const [currentWeek, setCurrentWeek] = useState<string>('');
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState<string>('all');
  const [weeklyProgress, setWeeklyProgress] = useState<{[key: string]: any}>({});

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
    setCurrentWeek(getCurrentWeek());
    fetchData();
  }, [hasPermission, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      console.log('API URL:', process.env.REACT_APP_API_URL);
      console.log('Token exists:', !!token);
      
      // 生徒データを取得
      console.log('Fetching students data...');
      const studentsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/class1/students`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Students response received:', studentsResponse.status);

      // ユーザーデータを取得
      console.log('Fetching users data...');
      const usersResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/auth/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Users response received:', usersResponse.status);

      console.log('生徒データレスポンス:', studentsResponse.data);
      console.log('ユーザーデータレスポンス:', usersResponse.data);
      console.log('ユーザーデータレスポンス詳細:', {
        hasSuccess: 'success' in usersResponse.data,
        successValue: usersResponse.data.success,
        hasUsers: 'users' in usersResponse.data,
        usersLength: usersResponse.data.users?.length,
        dataKeys: Object.keys(usersResponse.data)
      });

      // 生徒データの処理
      if (studentsResponse.data && studentsResponse.data.success) {
        setStudents(studentsResponse.data.students || []);
        console.log('生徒データ設定完了:', studentsResponse.data.students);
      } else {
        console.error('Students API returned success: false', studentsResponse.data);
        setStudents([]); // 空配列を設定
      }
      
      // ユーザーデータの処理（successフィールドに関係なくデータを設定）
      if (usersResponse.data && usersResponse.data.users && Array.isArray(usersResponse.data.users)) {
        setUsers(usersResponse.data.users);
        console.log('ユーザーデータ設定完了:', usersResponse.data.users);
        
        // 全ユーザーのロールを確認
        const users = usersResponse.data.users;
        console.log('全ユーザーのロール一覧:', users.map((user: any) => ({
          username: user.username,
          role: user.role,
          roleLength: user.role?.length || 0,
          roleCharCodes: user.role ? Array.from(user.role as string).map((char: string) => char.charCodeAt(0)) : []
        })));
        
        // 講師とClass1 Membersの数を確認
        const instructors = users.filter((user: any) => 
          user.role === 'ECG講師' || user.role === 'JCG講師'
        );
        const class1Members = users.filter((user: any) => 
          user.role === 'Class1 Members'
        );
        
        console.log('講師数:', instructors.length, instructors);
        console.log('Class1 Members数:', class1Members.length, class1Members);
        
        // データ設定成功ログ
        console.log('ユーザーデータ正常設定 - users state length:', users.length);
      } else if (usersResponse.data && usersResponse.data.success) {
        setUsers(usersResponse.data.users || []);
        console.log('ユーザーデータ設定完了（successベース）:', usersResponse.data.users);
      } else {
        console.error('Users API returned unexpected format:', usersResponse.data);
        setUsers([]); // 空配列を設定
      }
      
      // データ取得完了（必ず実行）
      setDataLoaded(true);
      console.log('Data loading completed - dataLoaded set to true');
    } catch (error: any) {
      console.error('データ取得エラー:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      setError(`データの取得に失敗しました: ${error.message}`);
      setDataLoaded(false);
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
    console.log('getInstructors called, users state:', users);
    const instructors = users.filter(user => {
      const role = user.role?.trim();
      return role === 'ECG講師' || role === 'JCG講師';
    });
    console.log('Filtered instructors:', instructors);
    return instructors;
  };

  const getClass1Members = () => {
    console.log('getClass1Members called, users state:', users);
    const members = users.filter(user => {
      const role = user.role?.trim();
      return role === 'Class1 Members';
    });
    console.log('Filtered Class1 Members:', members);
    return members;
  };

  // 週次チェックリスト用のヘルパー関数
  const getCurrentWeek = () => {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil((now.getDate() + new Date(year, now.getMonth(), 1).getDay()) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  };

  const getWeekRange = (weekString: string) => {
    const [year, week] = weekString.split('-W');
    const yearNum = parseInt(year);
    const weekNum = parseInt(week);
    
    // その年の最初の日曜日を基準に計算
    const firstDayOfYear = new Date(yearNum, 0, 1);
    const firstSunday = new Date(firstDayOfYear);
    firstSunday.setDate(firstDayOfYear.getDate() + (7 - firstDayOfYear.getDay()) % 7);
    
    // 指定週の開始日（月曜日）
    const weekStart = new Date(firstSunday);
    weekStart.setDate(firstSunday.getDate() + (weekNum - 1) * 7 + 1);
    
    // 指定週の終了日（日曜日）
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0]
    };
  };

  const getFilteredStudents = () => {
    if (selectedInstructorFilter === 'all') {
      return students;
    }
    return students.filter(student => 
      student.instructor_id.toString() === selectedInstructorFilter
    );
  };

  const getInstructorName = (instructorId: number) => {
    const instructor = users.find(user => user.id === instructorId);
    return instructor?.username || 'Unknown';
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
          disabled={!dataLoaded}
          sx={{ 
            backgroundColor: dataLoaded ? 'secondary.main' : 'grey.500',
            '&:hover': { backgroundColor: dataLoaded ? 'secondary.dark' : 'grey.600' }
          }}
        >
          {dataLoaded ? '生徒を追加' : '読み込み中...'}
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
        <>
          {/* 週次チェックリスト */}
          <Card sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              週次チェックリスト
            </Typography>
            
            {/* 週選択 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <IconButton 
                onClick={() => {
                  const [year, week] = currentWeek.split('-W');
                  const prevWeek = parseInt(week) - 1;
                  if (prevWeek >= 1) {
                    setCurrentWeek(`${year}-W${prevWeek.toString().padStart(2, '0')}`);
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {currentWeek} 週
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {getWeekRange(currentWeek).start} ~ {getWeekRange(currentWeek).end}
              </Typography>
              
              <IconButton 
                onClick={() => {
                  const [year, week] = currentWeek.split('-W');
                  const nextWeek = parseInt(week) + 1;
                  if (nextWeek <= 53) {
                    setCurrentWeek(`${year}-W${nextWeek.toString().padStart(2, '0')}`);
                  }
                }}
              >
                <ArrowForwardIcon />
              </IconButton>
            </Box>
            
            {/* 講師フィルター */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                講師フィルター:
              </Typography>
              <FormControl sx={{ minWidth: 200 }}>
                <Select
                  value={selectedInstructorFilter}
                  onChange={(e) => setSelectedInstructorFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="all">全講師</MenuItem>
                  {getInstructors().map((instructor) => (
                    <MenuItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {/* 生徒チェックリスト */}
            <Grid container spacing={2}>
              {getFilteredStudents().map((student, index) => (
                <Grid item xs={12} key={student.id}>
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
                            生徒{index + 1}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            講師: {getInstructorName(student.instructor_id)}
                          </Typography>
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      {/* DMで次回レッスン日を調整 */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Checkbox
                            checked={student.dm_scheduled}
                            disabled
                            sx={{
                              color: 'primary.main',
                              '&.Mui-checked': {
                                color: 'success.main',
                                animation: 'glow 2s ease-in-out infinite alternate',
                                '@keyframes glow': {
                                  '0%': {
                                    boxShadow: '0 0 5px #4caf50',
                                  },
                                  '100%': {
                                    boxShadow: '0 0 20px #4caf50, 0 0 30px #4caf50',
                                  },
                                },
                              },
                            }}
                          />
                          <Typography variant="body2">
                            DMで次回レッスン日を調整した
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
                          日付を入力すると完了になります
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 4, mt: 1 }}>
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
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: 1, display: 'block' }}>
                          次回レッスン予定日を記録
                        </Typography>
                      </Box>

                      {/* レッスンを実施 */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Checkbox
                            checked={student.lesson_completed}
                            disabled
                            sx={{
                              color: 'primary.main',
                              '&.Mui-checked': {
                                color: 'success.main',
                                animation: 'glow 2s ease-in-out infinite alternate',
                                '@keyframes glow': {
                                  '0%': {
                                    boxShadow: '0 0 5px #4caf50',
                                  },
                                  '100%': {
                                    boxShadow: '0 0 20px #4caf50, 0 0 30px #4caf50',
                                  },
                                },
                              },
                            }}
                          />
                          <Typography variant="body2">
                            レッスンを実施した
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
                          日付を入力すると完了になります
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 4, mt: 1 }}>
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
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: 1, display: 'block' }}>
                          実施日を記録
                        </Typography>
                      </Box>

                      {/* 進捗表示 */}
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          進捗
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={((student.dm_scheduled ? 1 : 0) + (student.lesson_completed ? 1 : 0)) * 50}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: 'linear-gradient(90deg, #4caf50, #66bb6a)',
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {((student.dm_scheduled ? 1 : 0) + (student.lesson_completed ? 1 : 0)) * 50}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Card>
        </>
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
                  {!dataLoaded ? (
                    <MenuItem disabled value="">
                      読み込み中...
                    </MenuItem>
                  ) : (() => {
                    const members = getClass1Members();
                    console.log('Class1 Members for dropdown:', members);
                    if (members.length === 0) {
                      return (
                        <MenuItem disabled value="">
                          Class1 Membersが見つかりません
                        </MenuItem>
                      );
                    }
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
                {!dataLoaded ? (
                  <MenuItem disabled value="">
                    読み込み中...
                  </MenuItem>
                ) : (() => {
                  const instructors = getInstructors();
                  console.log('講師 for dropdown:', instructors);
                  if (instructors.length === 0) {
                    return (
                      <MenuItem disabled value="">
                        講師が見つかりません
                      </MenuItem>
                    );
                  }
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