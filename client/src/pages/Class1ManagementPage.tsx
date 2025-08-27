import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Grid,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import AdditionalLessonModal from '../components/AdditionalLessonModal';
import CalendarEditModal from '../components/CalendarEditModal';

interface Student {
  id: number;
  name: string;
  instructor_id: number;
  member_number: string;
  created_at: string;
  updated_at: string;
}

interface Instructor {
  id: number;
  username: string;
  name: string;
}

const Class1ManagementPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [addStudentDialog, setAddStudentDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // 月次データ用の状態
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('all');
  const [studentMemos, setStudentMemos] = useState<{[studentId: number]: string}>({});
  
  // 追加レッスン用の状態
  const [additionalLessonModalOpen, setAdditionalLessonModalOpen] = useState(false);
  const [additionalLessonsData, setAdditionalLessonsData] = useState<any[]>([]);
  
  // カレンダー操作用の状態
  const [calendarEditModalOpen, setCalendarEditModalOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');
  const [calendarEventsData, setCalendarEventsData] = useState<any[]>([]);

  // カレンダー機能用の状態
  const [selectedInstructorCalendar, setSelectedInstructorCalendar] = useState<string>('all');
  const [calendarEvents, setCalendarEvents] = useState<{[date: string]: Array<{
    studentId: number;
    studentName: string;
    type: 'scheduled' | 'completed';
    date: string;
    source?: 'regular' | 'additional';
  }>}>({});
  
  // ポップアップ機能用の状態
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateEvents, setSelectedDateEvents] = useState<Array<{
    studentId: number;
    studentName: string;
    type: 'scheduled' | 'completed';
    date: string;
  }>>([]);

  // 生徒と講師の状態
  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  // 現在の月を取得する関数
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  // 月の範囲を取得する関数
  const getMonthRange = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  // 生徒メモを取得する関数
  const fetchStudentMemo = async (studentId: number, month: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/student-memos/${studentId}/${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data?.memo || '';
    } catch (error) {
      console.error('生徒メモ取得エラー:', error);
      return '';
    }
  };

  // 生徒メモを保存する関数
  const saveStudentMemo = async (studentId: number, month: string, memo: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/student-memos/${studentId}/${month}`, {
        memo: memo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      console.error('生徒メモ保存エラー:', error);
      return false;
    }
  };

  // 月次データを初期化する関数
  const initializeMonthlyData = async () => {
    const monthKey = getCurrentMonth();
    setCurrentMonth(monthKey);
    
    // 生徒のメモを取得
    if (students.length > 0) {
      const memoPromises = students.map(student => 
        fetchStudentMemo(student.id, monthKey)
      );
      const memos = await Promise.all(memoPromises);
      
      const memoData: {[studentId: number]: string} = {};
      students.forEach((student, index) => {
        memoData[student.id] = memos[index];
      });
      setStudentMemos(memoData);
    }
  };

  // アンケートURL生成関数
  const generateSurveyUrl = (studentId: number) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const month = currentMonth;
    return `${baseUrl}#/survey/${month}/${studentId}`;
  };

  // アンケートURLをクリップボードにコピー
  const copySurveyUrl = (studentId: number) => {
    const surveyUrl = generateSurveyUrl(studentId);
    navigator.clipboard.writeText(surveyUrl).then(() => {
      alert(`アンケートURLをクリップボードにコピーしました:\n${surveyUrl}`);
    });
  };

  // 追加レッスンデータを取得する関数
  const fetchAdditionalLessons = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/additional-lessons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdditionalLessonsData(response.data.data || []);
    } catch (error) {
      console.error('追加レッスン取得エラー:', error);
      setAdditionalLessonsData([]);
    }
  };

  // カレンダーイベントを取得する関数
  const fetchCalendarEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/calendar-events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalendarEventsData(response.data.data || []);
    } catch (error) {
      console.error('カレンダーイベント取得エラー:', error);
      setCalendarEventsData([]);
    }
  };

  // カレンダー日付クリックハンドラー
  const handleCalendarDateClick = (date: string) => {
    setSelectedCalendarDate(date);
    setCalendarEditModalOpen(true);
  };

  // カレンダーイベントを生成する関数（同期的）
  const generateCalendarEvents = () => {
    const events: {[date: string]: Array<{
      studentId: number;
      studentName: string;
      type: 'scheduled' | 'completed';
      date: string;
      source?: 'regular' | 'additional';
    }>} = {};

    // カレンダーイベントデータを処理
    calendarEventsData.forEach((event: any) => {
      // 講師フィルター適用
      if (selectedInstructorCalendar !== 'all') {
        const student = students.find(s => s.id === event.student_id);
        if (student && student.instructor_id.toString() !== selectedInstructorCalendar) {
          return;
        }
      }

      const dateKey = event.date;
      if (!events[dateKey]) events[dateKey] = [];
      
      events[dateKey].push({
        studentId: event.student_id,
        studentName: event.student_name,
        type: event.type,
        date: dateKey
      });
    });

    return events;
  };

  // カレンダーイベントを更新する関数（同期的）
  const updateCalendarEvents = () => {
    try {
      const events = generateCalendarEvents();
      setCalendarEvents(events);
    } catch (error) {
      console.error('カレンダーイベント更新エラー:', error);
    }
  };

  // 指定された日付のイベントを取得
  const getEventsForDate = (date: string) => {
    return calendarEvents[date] || [];
  };

  // データ取得関数
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // 生徒データを取得
      const studentsResponse = await axios.get('/api/class1/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(studentsResponse.data.data || []);

      // 講師データを取得
      const instructorsResponse = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allUsers = instructorsResponse.data.data || [];
      const instructorUsers = allUsers.filter((user: any) => 
        user.role === 'ECG講師' || user.role === 'JCG講師'
      );
      setInstructors(instructorUsers);

      setDataLoaded(true);
    } catch (error) {
      console.error('データ取得エラー:', error);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初期化
  useEffect(() => {
    const initializeData = async () => {
      if (!hasPermission) {
        console.log('権限がありません。データ取得をスキップします。');
        setLoading(false);
        return;
      }
      
      // 現在の月を設定
      const currentMonthString = getCurrentMonth();
      console.log('現在の月:', currentMonthString);
      setCurrentMonth(currentMonthString);
      
      // 基本データを取得
      await fetchData();
      
      // 月次データを初期化
      await initializeMonthlyData();
    };
    
    initializeData();
  }, [hasPermission]);

  // 月が変更されたときにメモデータを再取得
  useEffect(() => {
    if (currentMonth && students.length > 0) {
      console.log('月変更検知:', currentMonth);
      initializeMonthlyData();
    }
  }, [currentMonth, students]);

  // 追加レッスンデータを取得
  useEffect(() => {
    if (students.length > 0) {
      fetchAdditionalLessons();
      fetchCalendarEvents();
    }
  }, [students]);

  // カレンダーイベントデータまたは講師フィルターが変更されたときにカレンダーイベントを更新
  useEffect(() => {
    if (students.length > 0) {
      updateCalendarEvents();
    }
  }, [calendarEventsData, selectedInstructorCalendar, students]);

  // 生徒メモ変更ハンドラー
  const handleStudentMemoChange = async (studentId: number, memo: string) => {
    try {
      const success = await saveStudentMemo(studentId, currentMonth, memo);
      if (success) {
        setStudentMemos(prev => ({
          ...prev,
          [studentId]: memo
        }));
      }
    } catch (error) {
      console.error('メモ保存エラー:', error);
    }
  };

  // 月次ナビゲーション
  const handlePreviousMonth = () => {
    const [year, month] = currentMonth.split('-');
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (monthNum === 1) {
      const prevYear = yearNum - 1;
      setCurrentMonth(`${prevYear}-12`);
    } else {
      setCurrentMonth(`${yearNum}-${(monthNum - 1).toString().padStart(2, '0')}`);
    }
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-');
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (monthNum === 12) {
      const nextYear = yearNum + 1;
      setCurrentMonth(`${nextYear}-01`);
    } else {
      setCurrentMonth(`${yearNum}-${(monthNum + 1).toString().padStart(2, '0')}`);
    }
  };

  // フィルタリングされた生徒を取得
  const filteredStudents = students.filter(student => {
    if (selectedInstructor === 'all') return true;
    return student.instructor_id.toString() === selectedInstructor;
  });

  // 講師名を取得
  const getInstructorName = (instructorId: number) => {
    const instructor = instructors.find(i => i.id === instructorId);
    return instructor ? instructor.name : '不明';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Class1 レッスン管理
      </Typography>

      {/* 月次ナビゲーション */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={handlePreviousMonth}>
              <CalendarIcon />
            </IconButton>
            <Typography variant="h6">
              {currentMonth} 月
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <CalendarIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {getMonthRange(currentMonth).start} ~ {getMonthRange(currentMonth).end}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>講師フィルター</InputLabel>
              <Select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                label="講師フィルター"
              >
                <MenuItem value="all">全講師</MenuItem>
                {instructors.map((instructor) => (
                  <MenuItem key={instructor.id} value={instructor.id.toString()}>
                    {instructor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAdditionalLessonModalOpen(true)}
            >
              レッスン追加
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="生徒管理" />
          <Tab label="カレンダー" />
        </Tabs>
      </Box>

      {/* 生徒管理タブ */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {filteredStudents.map((student) => (
            <Grid item xs={12} md={6} key={student.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {student.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        講師: {getInstructorName(student.instructor_id)} 会員番号: {student.member_number}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      <Tooltip title="アンケートURL生成">
                        <IconButton
                          size="small"
                          onClick={() => copySurveyUrl(student.id)}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* 生徒メモ */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      <NoteIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      メモ ({currentMonth})
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      size="small"
                      placeholder="生徒のメモを入力してください..."
                      value={studentMemos[student.id] || ''}
                      onChange={(e) => handleStudentMemoChange(student.id, e.target.value)}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* カレンダータブ */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            カレンダー機能は別途実装予定
          </Typography>
        </Box>
      )}

      {/* 追加レッスンモーダル */}
      <AdditionalLessonModal
        open={additionalLessonModalOpen}
        onClose={() => setAdditionalLessonModalOpen(false)}
        students={students}
        onSuccess={() => {
          fetchAdditionalLessons();
        }}
      />

      {/* カレンダー編集モーダル */}
      <CalendarEditModal
        open={calendarEditModalOpen}
        onClose={() => setCalendarEditModalOpen(false)}
        date={selectedCalendarDate}
        students={students}
        events={getEventsForDate(selectedCalendarDate)}
        onSuccess={() => {
          fetchCalendarEvents();
        }}
      />
    </Container>
  );
};

export default Class1ManagementPage; 