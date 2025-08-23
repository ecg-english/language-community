import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Grid,
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Payment as PaymentIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
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
  created_at: string;
}

interface User {
  id: number;
  username: string;
  role: string;
  email: string;
}

interface MonthlyData {
  student_id: number;
  month: string; // "2025-07", "2025-08" など
  payment_status: boolean;
  survey_completed: boolean;
  survey_answers?: string;
}

const ManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  
  // ダイアログ関連
  const [editStudentDialog, setEditStudentDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [surveyDialog, setSurveyDialog] = useState(false);
  const [selectedStudentForSurvey, setSelectedStudentForSurvey] = useState<Student | null>(null);

  // 権限チェック
  const hasPermission = user?.role === 'サーバー管理者';

  useEffect(() => {
    if (!hasPermission) {
      navigate('/');
      return;
    }

    // 現在の年月を設定
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(currentMonthStr);

    fetchData();
  }, [hasPermission, navigate]);

  useEffect(() => {
    if (currentMonth) {
      fetchMonthlyData();
    }
  }, [currentMonth]);

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

      // 講師データを取得
      const instructorsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/auth/users/class1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (studentsResponse.data.success) {
        setStudents(studentsResponse.data.students);
      }

      if (instructorsResponse.data.success) {
        const instructorUsers = instructorsResponse.data.users.filter(
          (user: User) => user.role === 'ECG講師' || user.role === 'JCG講師' || user.role === 'サーバー管理者'
        );
        setInstructors(instructorUsers);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/manager/monthly-data/${currentMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setMonthlyData(response.data.data);
      }
    } catch (error) {
      console.error('月次データ取得エラー:', error);
      // エラーが404の場合は新しい月なので空のデータを設定
      setMonthlyData([]);
    }
  };

  const getStudentMonthlyData = (studentId: number): MonthlyData => {
    return monthlyData.find(data => data.student_id === studentId) || {
      student_id: studentId,
      month: currentMonth,
      payment_status: false,
      survey_completed: false,
      survey_answers: ''
    };
  };

  const handlePaymentToggle = async (studentId: number) => {
    try {
      const token = localStorage.getItem('token');
      const currentData = getStudentMonthlyData(studentId);
      const newPaymentStatus = !currentData.payment_status;

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/manager/monthly-data/${currentMonth}/${studentId}/payment`,
        {
          payment_status: newPaymentStatus
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // ローカル状態を更新
        setMonthlyData(prev => {
          const existing = prev.find(data => data.student_id === studentId);
          if (existing) {
            return prev.map(data => 
              data.student_id === studentId 
                ? { ...data, payment_status: newPaymentStatus }
                : data
            );
          } else {
            return [...prev, {
              student_id: studentId,
              month: currentMonth,
              payment_status: newPaymentStatus,
              survey_completed: currentData.survey_completed,
              survey_answers: currentData.survey_answers
            }];
          }
        });
      }
    } catch (error) {
      console.error('入金状態更新エラー:', error);
      setError('入金状態の更新に失敗しました');
    }
  };

  const handleSurveyToggle = async (studentId: number) => {
    try {
      const token = localStorage.getItem('token');
      const currentData = getStudentMonthlyData(studentId);
      const newSurveyStatus = !currentData.survey_completed;

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/manager/monthly-data/${currentMonth}/${studentId}/survey`,
        {
          survey_completed: newSurveyStatus
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setMonthlyData(prev => {
          const existing = prev.find(data => data.student_id === studentId);
          if (existing) {
            return prev.map(data => 
              data.student_id === studentId 
                ? { ...data, survey_completed: newSurveyStatus }
                : data
            );
          } else {
            return [...prev, {
              student_id: studentId,
              month: currentMonth,
              payment_status: currentData.payment_status,
              survey_completed: newSurveyStatus,
              survey_answers: currentData.survey_answers
            }];
          }
        });
      }
    } catch (error) {
      console.error('アンケート状態更新エラー:', error);
      setError('アンケート状態の更新に失敗しました');
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditStudentDialog(true);
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/class1/students/${editingStudent.id}`,
        editingStudent,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setStudents(prev => 
          prev.map(student => 
            student.id === editingStudent.id ? editingStudent : student
          )
        );
        setEditStudentDialog(false);
        setEditingStudent(null);
      }
    } catch (error) {
      console.error('生徒情報更新エラー:', error);
      setError('生徒情報の更新に失敗しました');
    }
  };

  const handleShowSurvey = (student: Student) => {
    setSelectedStudentForSurvey(student);
    setSurveyDialog(true);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month;

    if (direction === 'prev') {
      if (month === 1) {
        newMonth = 12;
        newYear = year - 1;
      } else {
        newMonth = month - 1;
      }
    } else {
      if (month === 12) {
        newMonth = 1;
        newYear = year + 1;
      } else {
        newMonth = month + 1;
      }
    }

    setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${year}年${month}月`;
  };

  if (!hasPermission) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SchoolIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          マネージャー
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 月切り替え */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
        <IconButton onClick={() => changeMonth('prev')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ mx: 2, minWidth: '120px', textAlign: 'center' }}>
          {formatMonthDisplay(currentMonth)}
        </Typography>
        <IconButton onClick={() => changeMonth('next')}>
          <ArrowForwardIcon />
        </IconButton>
      </Box>

      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab 
            icon={<PersonIcon />} 
            label="生徒一覧" 
            iconPosition="start"
          />
          <Tab 
            icon={<SchoolIcon />} 
            label="講師一覧" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* 生徒一覧タブ */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              生徒一覧
            </Typography>
            <List>
              {students.map((student) => {
                const monthlyData = getStudentMonthlyData(student.id);
                const instructor = instructors.find(inst => inst.id === student.instructor_id);
                
                return (
                  <ListItem 
                    key={student.id}
                    sx={{ 
                      border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { color: 'primary.main' }
                            }}
                            onClick={() => handleEditStudent(student)}
                          >
                            {student.name}
                          </Typography>
                          <Chip 
                            label={`講師: ${instructor?.username || 'Unknown'}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={student.email || student.memo}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant={monthlyData.payment_status ? "contained" : "outlined"}
                          color={monthlyData.payment_status ? "success" : "default"}
                          startIcon={<PaymentIcon />}
                          onClick={() => handlePaymentToggle(student.id)}
                          sx={{
                            backgroundColor: monthlyData.payment_status ? 'success.main' : 'transparent',
                            color: monthlyData.payment_status ? 'white' : 'text.secondary',
                            '&:hover': {
                              backgroundColor: monthlyData.payment_status ? 'success.dark' : 'action.hover'
                            }
                          }}
                        >
                          {monthlyData.payment_status ? '入金済み' : '未入金'}
                        </Button>
                        <Button
                          variant={monthlyData.survey_completed ? "contained" : "outlined"}
                          color={monthlyData.survey_completed ? "info" : "default"}
                          startIcon={<AssignmentIcon />}
                          onClick={() => handleShowSurvey(student)}
                          sx={{
                            backgroundColor: monthlyData.survey_completed ? 'info.main' : 'transparent',
                            color: monthlyData.survey_completed ? 'white' : 'text.secondary',
                            '&:hover': {
                              backgroundColor: monthlyData.survey_completed ? 'info.dark' : 'action.hover'
                            }
                          }}
                        >
                          アンケート回答
                        </Button>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* 講師一覧タブ */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              講師一覧
            </Typography>
            <List>
              {instructors.map((instructor) => (
                <ListItem 
                  key={instructor.id}
                  sx={{ 
                    border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <ListItemText
                    primary={instructor.username}
                    secondary={`${instructor.role} - ${instructor.email}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* 生徒編集ダイアログ */}
      <Dialog open={editStudentDialog} onClose={() => setEditStudentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>生徒情報を編集</DialogTitle>
        <DialogContent>
          {editingStudent && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="生徒名"
                value={editingStudent.name}
                onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>担当講師</InputLabel>
                <Select
                  value={editingStudent.instructor_id}
                  onChange={(e) => setEditingStudent({ ...editingStudent, instructor_id: Number(e.target.value) })}
                  label="担当講師"
                >
                  {instructors.map((instructor) => (
                    <MenuItem key={instructor.id} value={instructor.id}>
                      {instructor.username} ({instructor.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="メールアドレス"
                value={editingStudent.email || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="メモ"
                value={editingStudent.memo || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, memo: e.target.value })}
                multiline
                rows={3}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditStudentDialog(false)}>キャンセル</Button>
          <Button onClick={handleSaveStudent} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      {/* アンケート回答ダイアログ */}
      <Dialog open={surveyDialog} onClose={() => setSurveyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {selectedStudentForSurvey?.name} のアンケート回答
            </Typography>
            <IconButton onClick={() => setSurveyDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {formatMonthDisplay(currentMonth)}のアンケート回答内容
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={10}
              value={selectedStudentForSurvey ? getStudentMonthlyData(selectedStudentForSurvey.id).survey_answers || '' : ''}
              placeholder="アンケート回答がまだありません..."
              InputProps={{
                readOnly: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSurveyDialog(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManagerPage; 