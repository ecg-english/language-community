import React, { useState, useEffect, useRef } from 'react';
import {
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
  Grid,
  Box,
  Paper,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent,
  Alert,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  ContentCopy as CopyIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  SupervisorAccount as SupervisorAccountIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import AdditionalLessonModal from '../components/AdditionalLessonModal';
import CalendarEditModal from '../components/CalendarEditModal';

interface Student {
  id: number;
  name: string;
  instructor_id: number;
  instructor_name: string;
  member_number: string;
  created_at: string;
  updated_at: string;
  email?: string; // 追加
}

interface Instructor {
  id: number;
  username: string;
  name: string;
  role: string;
}

const Class1ManagementPage: React.FC = () => {
  const { user } = useAuth();
  
  // 権限チェック関数
  const hasPermission = () => {
    const role = user?.role?.trim();
    return role === 'ECG講師' || role === 'JCG講師' || role === 'サーバー管理者';
  };

  // マネージャーページアクセス権限チェック
  const hasManagerPermission = () => {
    const role = user?.role?.trim();
    return role === 'サーバー管理者';
  };
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
  
  // 生徒追加用の状態
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedNewInstructor, setSelectedNewInstructor] = useState('');
  const [newStudentMemo, setNewStudentMemo] = useState('');
  const [isNewStudent, setIsNewStudent] = useState(true);
  const [class1Members, setClass1Members] = useState<any[]>([]);

  // 生徒メモの一時保存用state（保存ボタン用）
  const [temporaryMemos, setTemporaryMemos] = useState<{ [studentId: number]: string }>({});
  const [savingMemos, setSavingMemos] = useState<{ [studentId: number]: boolean }>({});

  // 現在の月を取得する関数（簡易版）
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  // 月の範囲を取得する関数（簡易版）
  const getMonthRange = (monthString: string) => {
    const [year, month] = monthString.split('-').map(Number);
    return {
      start: `${year}-${String(month).padStart(2, '0')}-01`,
      end: `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
    };
  };

  // 簡素化された学生メモ初期化
  const initializeStudentMemos = async () => {
    console.log('=== 生徒メモ初期化開始 ===');
    console.log('現在の生徒数:', students.length);
    
    if (students.length === 0) {
      console.log('生徒データが空のため、メモ初期化をスキップ');
      return;
    }

    const newStudentMemos: { [studentId: number]: string } = {};
    const newTemporaryMemos: { [studentId: number]: string } = {};
    
    for (const student of students) {
      try {
        console.log(`生徒 ${student.name} (ID: ${student.id}) のメモ取得開始`);
        const memo = await getStudentMemo(student.id);
        newStudentMemos[student.id] = memo;
        newTemporaryMemos[student.id] = memo; // 一時保存にも同じ値を設定
        console.log(`生徒 ${student.name} のメモ: "${memo}"`);
      } catch (error) {
        console.error(`生徒 ${student.name} のメモ取得エラー:`, error);
        newStudentMemos[student.id] = '';
        newTemporaryMemos[student.id] = '';
      }
    }
    
    console.log('全生徒メモ:', newStudentMemos);
    setStudentMemos(newStudentMemos);
    setTemporaryMemos(newTemporaryMemos);
    console.log('=== 生徒メモ初期化完了 ===');
  };

  // 生徒メモ取得（単純化）
  const getStudentMemo = async (studentId: number): Promise<string> => {
    try {
      console.log('メモ取得開始:', { studentId });
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/student-memos/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('メモ取得成功:', response.data);
      return response.data.data?.memo || '';
    } catch (error: any) {
      console.error('生徒メモ取得エラー:', error);
      return '';
    }
  };

  // 生徒メモ保存（単純化）
  const saveStudentMemo = async (studentId: number, memo: string) => {
    try {
      console.log('メモ保存開始:', { studentId, memo });
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/student-memos/${studentId}`, {
        memo: memo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('メモ保存成功:', response.data);
      return true;
    } catch (error: any) {
      console.error('生徒メモ保存エラー:', error);
      return false;
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
      
      console.log('=== データ取得開始 ===');
      console.log('Token:', !!token);
      
      // 生徒データを取得
      console.log('生徒データ取得中...');
      const studentsResponse = await axios.get('/api/class1/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('生徒データ取得成功:', studentsResponse.data);
      const studentsData = studentsResponse.data.students || [];
      console.log('生徒データ詳細:', studentsData);
      setStudents(studentsData);
      
      // 生徒データ設定後に月次データを初期化
      setTimeout(async () => {
        console.log('生徒データ設定後の月次データ初期化');
        console.log('現在の生徒数:', studentsData.length);
        await initializeStudentMemos();
      }, 200);

      // 講師データを取得
      console.log('講師データ取得中...');
      const instructorsResponse = await axios.get('/api/auth/users/class1', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('講師データ取得成功:', instructorsResponse.data);
      const allUsers = instructorsResponse.data.users || [];
      console.log('全ユーザー数:', allUsers.length);
      console.log('全ユーザーのロール:', allUsers.map((u: any) => ({ name: u.name, role: u.role })));
      
      const instructorUsers = allUsers.filter((user: any) => {
        const role = user.role?.trim();
        const isInstructor = role === 'ECG講師' || role === 'JCG講師' || role === 'サーバー管理者';
        console.log(`ユーザー ${user.name} (${role}): ${isInstructor ? '講師' : '講師ではない'}`);
        return isInstructor;
      }).map((user: any) => ({
        id: user.id,
        name: user.name || user.username,
        username: user.username,
        role: user.role,
        email: user.email
      }));
      console.log('フィルタリング後の講師数:', instructorUsers.length);
      console.log('講師一覧:', instructorUsers.map((i: any) => ({ id: i.id, name: i.name, role: i.role })));
      setInstructors(instructorUsers);
      console.log('instructors配列を設定しました:', instructorUsers);
      
      // 講師データ設定後にUIを強制更新
      setTimeout(() => {
        console.log('講師データ設定後の強制更新');
        setInstructors([...instructorUsers]);
      }, 100);

      // Class1 Membersデータを取得
      console.log('Class1 Members取得中...');
      const class1MembersUsers = allUsers.filter((user: any) => {
        const role = user.role?.trim();
        return role === 'Class1 Members';
      });
      setClass1Members(class1MembersUsers);
      console.log('Class1 Members取得成功:', class1MembersUsers);

      setDataLoaded(true);
      console.log('=== データ取得完了 ===');
    } catch (error: any) {
      console.error('データ取得エラー:', error);
      console.error('エラー詳細:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      setError(`データの取得に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 初期化
  useEffect(() => {
    const initializeData = async () => {
      if (!hasPermission()) {
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
      
      // データ取得完了後の処理はfetchData内で行うため、ここでは何もしない
    };
    
    initializeData();
  }, []);

  // 月が変更されたときにメモデータを再取得
  useEffect(() => {
    if (currentMonth && students.length > 0) {
      console.log('月変更検知:', currentMonth);
      initializeStudentMemos();
    }
  }, [currentMonth]);

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

  // 生徒メモ変更ハンドラー（一時保存のみ）
  const handleStudentMemoChange = (studentId: number, memo: string) => {
    console.log(`メモ一時変更: 生徒ID ${studentId}, メモ: "${memo}"`);
    setTemporaryMemos(prev => ({
      ...prev,
      [studentId]: memo
    }));
  };

  // 生徒メモ保存ハンドラー（保存ボタン用）
  const handleSaveStudentMemo = async (studentId: number) => {
    try {
      console.log('=== メモ保存ボタンクリック ===');
      const memo = temporaryMemos[studentId] || '';
      console.log('メモ保存開始:', { studentId, memo });
      
      setSavingMemos(prev => ({ ...prev, [studentId]: true }));
      
      const numericStudentId = Number(studentId);
      if (isNaN(numericStudentId)) {
        console.error('無効な生徒ID:', studentId);
        return;
      }
      
      const success = await saveStudentMemo(numericStudentId, memo);
      if (success) {
        setStudentMemos(prev => ({
          ...prev,
          [numericStudentId]: memo
        }));
        console.log('✅ メモ保存成功、状態更新完了');
        
        // 成功メッセージやフィードバックを表示
        alert('メモを保存しました');
      } else {
        console.error('❌ メモ保存に失敗しました');
        alert('メモの保存に失敗しました');
      }
    } catch (error) {
      console.error('メモ保存エラー:', error);
      alert('メモの保存中にエラーが発生しました');
    } finally {
      setSavingMemos(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // 生徒削除ハンドラー
  const handleDeleteStudent = async (studentId: number) => {
    if (!window.confirm('この生徒を削除しますか？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/class1/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        fetchData();
        alert('生徒を削除しました');
      }
    } catch (error: any) {
      console.error('生徒削除エラー:', error);
      alert('生徒の削除に失敗しました');
    }
  };

  // 生徒追加ハンドラー
  const handleAddStudent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/class1/students', {
        name: newStudentName,
        instructor_id: parseInt(selectedNewInstructor),
        memo: newStudentMemo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAddStudentDialog(false);
        setNewStudentName('');
        setSelectedNewInstructor('');
        setNewStudentMemo('');
        setIsNewStudent(true);
        fetchData();
        alert('生徒を追加しました');
      }
    } catch (error: any) {
      console.error('生徒追加エラー:', error);
      alert('生徒の追加に失敗しました');
    }
  };

  // 月次ナビゲーション
  const handlePreviousMonth = () => {
    console.log('前月ボタンクリック - 現在の月:', currentMonth);
    const [year, month] = currentMonth.split('-');
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    let newYear = yearNum;
    let newMonth = monthNum - 1;
    
    if (newMonth === 0) {
      newYear = yearNum - 1;
      newMonth = 12;
    }
    
    const newMonthString = `${newYear}-${newMonth.toString().padStart(2, '0')}`;
    console.log('新しい月:', newMonthString);
    setCurrentMonth(newMonthString);
    
    // データを再取得
    setTimeout(() => {
      initializeStudentMemos();
      if (activeTab === 1) {
        fetchCalendarEvents();
      }
    }, 100);
  };

  const handleNextMonth = () => {
    console.log('次月ボタンクリック - 現在の月:', currentMonth);
    const [year, month] = currentMonth.split('-');
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    let newYear = yearNum;
    let newMonth = monthNum + 1;
    
    if (newMonth === 13) {
      newYear = yearNum + 1;
      newMonth = 1;
    }
    
    const newMonthString = `${newYear}-${newMonth.toString().padStart(2, '0')}`;
    console.log('新しい月:', newMonthString);
    setCurrentMonth(newMonthString);
    
    // データを再取得
    setTimeout(() => {
      initializeStudentMemos();
      if (activeTab === 1) {
        fetchCalendarEvents();
      }
    }, 100);
  };

  // フィルタリングされた生徒を取得
  const filteredStudents = students.filter(student => {
    if (selectedInstructor === 'all') return true;
    return student.instructor_id.toString() === selectedInstructor;
  });

  // 講師名を取得
  const getInstructorName = (instructorId: number) => {
    console.log(`講師名取得 - ID: ${instructorId}, 講師配列長: ${instructors.length}`);
    console.log(`講師配列内容:`, instructors);
    const instructor = instructors.find(i => i.id === instructorId);
    console.log(`見つかった講師:`, instructor);
    if (!instructor) {
      console.warn(`講師ID ${instructorId} が見つかりません`);
    }
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Class1 レッスン管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddStudentDialog(true)}
        >
          生徒を追加
        </Button>
      </Box>

      {/* 月次ナビゲーション */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={handlePreviousMonth}>
              <NavigateBeforeIcon />
            </IconButton>
            <Typography variant="h6">
              {currentMonth} 月
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <NavigateNextIcon />
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
                {instructors.length === 0 ? (
                  <MenuItem disabled value="">
                    講師データを読み込み中...
                  </MenuItem>
                ) : (
                  instructors.map((instructor) => (
                    <MenuItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            

          </Box>
        </Box>
      </Paper>

      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="生徒管理" />
          <Tab label="カレンダー" />
          {hasManagerPermission() && (
            <Tab label="マネージャー" />
          )}
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
                       <Tooltip title="生徒を削除">
                         <IconButton
                           size="small"
                           color="error"
                           onClick={() => handleDeleteStudent(student.id)}
                         >
                           <DeleteIcon />
                         </IconButton>
                       </Tooltip>
                     </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* 生徒メモ */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      <AssignmentIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      生徒メモ
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      size="small"
                      placeholder="生徒のメモを入力してください..."
                      value={temporaryMemos[student.id] || ''}
                      onChange={(e) => handleStudentMemoChange(student.id, e.target.value)}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleSaveStudentMemo(student.id)}
                      disabled={savingMemos[student.id] || !temporaryMemos[student.id]}
                      sx={{ mt: 1 }}
                    >
                      {savingMemos[student.id] ? <CircularProgress size={20} /> : 'メモを保存'}
                    </Button>
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
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            レッスンカレンダー
          </Typography>

          {/* 講師フィルター */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              講師フィルター:
            </Typography>
            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={selectedInstructorCalendar}
                onChange={(e) => setSelectedInstructorCalendar(e.target.value)}
                size="small"
              >
                <MenuItem value="all">全講師</MenuItem>
                {instructors.length === 0 ? (
                  <MenuItem disabled value="">
                    講師データを読み込み中...
                  </MenuItem>
                ) : (
                  instructors.map((instructor) => (
                    <MenuItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>

          {/* カレンダー */}
          <Box sx={{ mb: 3 }}>
            {/* 月ナビゲーション */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <IconButton onClick={handlePreviousMonth}>
                <NavigateBeforeIcon />
              </IconButton>
              
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {currentMonth.split('-')[0]}年{parseInt(currentMonth.split('-')[1])}月
              </Typography>
              
              <IconButton onClick={handleNextMonth}>
                <NavigateNextIcon />
              </IconButton>
            </Box>

            {/* カレンダーグリッド */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: 1,
              border: '1px solid #e0e0e0',
              borderRadius: 1
            }}>
              {/* 曜日ヘッダー */}
              {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                <Box key={day} sx={{ 
                  p: 1, 
                  textAlign: 'center', 
                  fontWeight: 600,
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  <Typography variant="body2">{day}</Typography>
                </Box>
              ))}

              {/* カレンダー日付 */}
              {(() => {
                const [year, month] = currentMonth.split('-');
                const yearNum = parseInt(year);
                const monthNum = parseInt(month);
                
                const firstDay = new Date(yearNum, monthNum - 1, 1);
                const lastDay = new Date(yearNum, monthNum, 0);
                const daysInMonth = lastDay.getDate();
                const firstDayOfWeek = firstDay.getDay();
                
                const days = [];
                
                // 前月の日付（空白セル）
                for (let i = 0; i < firstDayOfWeek; i++) {
                  days.push(
                    <Box key={`empty-${i}`} sx={{ 
                      p: 1, 
                      minHeight: 60,
                      backgroundColor: 'rgba(0,0,0,0.02)'
                    }} />
                  );
                }
                
                // 当月の日付
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateKey = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const events = getEventsForDate(dateKey);
                  const isToday = new Date().toISOString().split('T')[0] === dateKey;
                  
                  days.push(
                    <Box key={day} sx={{ 
                      p: 1, 
                      minHeight: 60,
                      border: '1px solid #e0e0e0',
                      backgroundColor: isToday ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.1)'
                      }
                    }}
                    onClick={() => handleCalendarDateClick(dateKey)}
                    >
                      <Typography variant="body2" sx={{ 
                        fontWeight: isToday ? 600 : 400,
                        color: isToday ? 'primary.main' : 'inherit'
                      }}>
                        {day}
                      </Typography>
                      
                      {events.length > 0 && (
                        <Box sx={{ 
                          position: 'absolute', 
                          top: 2, 
                          right: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: events.some(e => e.type === 'completed') ? 'success.main' : 'warning.main',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {events.length > 1 ? events.length : 
                           events.some(e => e.type === 'completed') ? '✓' : '⭐'}
                        </Box>
                      )}
                    </Box>
                  );
                }
                
                return days;
              })()}
            </Box>
          </Box>

          {/* 凡例 */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              凡例:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: '50%', 
                backgroundColor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: 'white'
              }}>
                ✓
              </Box>
              <Typography variant="body2">レッスン実施済み</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: '50%', 
                backgroundColor: 'warning.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: 'white'
              }}>
                ⭐
              </Box>
              <Typography variant="body2">次回レッスン予定</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: '50%', 
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: 'white',
                fontWeight: 600
              }}>
                3
              </Box>
              <Typography variant="body2">複数生徒</Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* 追加レッスンモーダル */}
      <AdditionalLessonModal
        open={additionalLessonModalOpen}
        onClose={() => setAdditionalLessonModalOpen(false)}
        weekKey={currentMonth}
        onSuccess={() => {
          fetchAdditionalLessons();
        }}
      />

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
                  setNewStudentName('');
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
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="生徒名を入力"
              />
            ) : (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Class1 Members</InputLabel>
                <Select
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  label="Class1 Members"
                >
                  {!dataLoaded ? (
                    <MenuItem disabled value="">
                      読み込み中...
                    </MenuItem>
                  ) : class1Members.length === 0 ? (
                    <MenuItem disabled value="">
                      Class1 Membersが見つかりません
                    </MenuItem>
                  ) : (
                    class1Members.map((member) => (
                      <MenuItem key={member.id} value={member.username}>
                        {member.username}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>担当講師</InputLabel>
              <Select
                value={selectedNewInstructor}
                onChange={(e) => setSelectedNewInstructor(e.target.value)}
                label="担当講師"
              >
                {!dataLoaded ? (
                  <MenuItem disabled value="">
                    読み込み中...
                  </MenuItem>
                ) : instructors.length === 0 ? (
                  <MenuItem disabled value="">
                    講師が見つかりません
                  </MenuItem>
                ) : (
                                     instructors.map((instructor) => (
                     <MenuItem key={instructor.id} value={instructor.id.toString()}>
                       {instructor.name}
                     </MenuItem>
                   ))
                )}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="メモ（任意）"
              value={newStudentMemo}
              onChange={(e) => setNewStudentMemo(e.target.value)}
              multiline
              rows={2}
              sx={{ mb: 2 }}
              placeholder="例: 火曜午後が都合良い"
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
            disabled={!newStudentName || !selectedNewInstructor}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* マネージャータブ */}
      {activeTab === 2 && hasManagerPermission() && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            マネージャー機能
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            サーバー管理者専用の管理機能です。
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.open('/#/manager', '_blank')}
            startIcon={<SupervisorAccountIcon />}
          >
            マネージャーページを開く
          </Button>
        </Box>
      )}

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