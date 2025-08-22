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
  
  // 週次データ管理
  const [weeklyData, setWeeklyData] = useState<{[weekKey: string]: {[studentId: number]: {
    dm_scheduled: boolean;
    lesson_completed: boolean;
    next_lesson_date?: string;
    lesson_completed_date?: string;
  }}}>({});

  // カレンダー機能用の状態
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedInstructorCalendar, setSelectedInstructorCalendar] = useState<string>('all');
  const [calendarEvents, setCalendarEvents] = useState<{[date: string]: Array<{
    studentId: number;
    studentName: string;
    type: 'scheduled' | 'completed';
    date: string;
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

  // 現在の週を正しく計算する関数
  const getCurrentWeek = () => {
    const now = new Date();
    const year = now.getFullYear();
    
    // 年の最初の日を取得
    const firstDayOfYear = new Date(year, 0, 1);
    
    // 現在の日付と年の最初の日の差を計算
    const daysDiff = Math.floor((now.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24));
    
    // 週数を計算（年の最初の週を第1週とする）
    const weekNumber = Math.ceil((daysDiff + firstDayOfYear.getDay() + 1) / 7);
    
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  };

  // 週の範囲を取得する関数
  const getWeekRange = (weekString: string) => {
    const [year, week] = weekString.split('-W');
    const yearNum = parseInt(year);
    const weekNum = parseInt(week);
    
    // 年の最初の日を取得
    const firstDayOfYear = new Date(yearNum, 0, 1);
    
    // 第1週の開始日を計算
    const firstWeekStart = new Date(firstDayOfYear);
    const dayOfWeek = firstDayOfYear.getDay();
    firstWeekStart.setDate(firstDayOfYear.getDate() - dayOfWeek);
    
    // 指定された週の開始日を計算
    const targetWeekStart = new Date(firstWeekStart);
    targetWeekStart.setDate(firstWeekStart.getDate() + (weekNum - 1) * 7);
    
    // 週の終了日を計算
    const targetWeekEnd = new Date(targetWeekStart);
    targetWeekEnd.setDate(targetWeekStart.getDate() + 6);
    
    return {
      start: targetWeekStart.toISOString().split('T')[0],
      end: targetWeekEnd.toISOString().split('T')[0]
    };
  };

  // 週次データを永続化する関数
  const saveWeeklyData = (data: any) => {
    try {
      localStorage.setItem('class1_weekly_data', JSON.stringify(data));
    } catch (error) {
      console.error('週次データの保存に失敗しました:', error);
    }
  };

  // 週次データを読み込む関数
  const loadWeeklyData = () => {
    try {
      const saved = localStorage.getItem('class1_weekly_data');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('週次データの読み込みに失敗しました:', error);
      return {};
    }
  };

  // データベースから週次データを取得
  const fetchWeeklyData = async (weekKey: string) => {
    try {
      console.log('週次データ取得開始:', weekKey);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/class1/weekly-checklist/${weekKey}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log('週次データAPI応答:', response.data);
      
      if (response.data.success) {
        const checklistData = response.data.checklist;
        const weekData: {[studentId: number]: any} = {};
        
        checklistData.forEach((item: any) => {
          weekData[item.student_id] = {
            dm_scheduled: Boolean(item.dm_scheduled),
            lesson_completed: Boolean(item.lesson_completed),
            next_lesson_date: item.next_lesson_date || '',
            lesson_completed_date: item.lesson_completed_date || ''
          };
        });
        
        console.log('処理された週次データ:', weekData);
        return weekData;
      }
      console.log('週次データ取得成功、データなし');
      return {};
    } catch (error) {
      console.error('週次データの取得に失敗しました:', error);
      return {};
    }
  };

  // 全週のデータを一括で取得する関数
  const fetchAllWeeklyData = async () => {
    try {
      console.log('全週データ取得開始');
      const token = localStorage.getItem('token');
      
      // 現在の年から過去1年分の週データを取得
      const currentYear = new Date().getFullYear();
      const allWeeklyData: {[weekKey: string]: any} = {};
      
      // 過去1年分の週データを取得
      for (let year = currentYear - 1; year <= currentYear; year++) {
        for (let week = 1; week <= 53; week++) {
          const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
          
          try {
            const response = await axios.get(
              `${process.env.REACT_APP_API_URL}/api/class1/weekly-checklist/${weekKey}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            
            if (response.data.success && response.data.checklist.length > 0) {
              const weekData: {[studentId: number]: any} = {};
              
              response.data.checklist.forEach((item: any) => {
                weekData[item.student_id] = {
                  dm_scheduled: Boolean(item.dm_scheduled),
                  lesson_completed: Boolean(item.lesson_completed),
                  next_lesson_date: item.next_lesson_date || '',
                  lesson_completed_date: item.lesson_completed_date || ''
                };
              });
              
              allWeeklyData[weekKey] = weekData;
              console.log(`週データ取得成功: ${weekKey}`, weekData);
            }
          } catch (error) {
            // データが存在しない週は無視
            console.log(`週データなし: ${weekKey}`);
          }
        }
      }
      
      console.log('全週データ取得完了:', allWeeklyData);
      return allWeeklyData;
    } catch (error) {
      console.error('全週データの取得に失敗しました:', error);
      return {};
    }
  };

  // データベースに週次データを保存
  const saveWeeklyDataToDB = async (weekKey: string, studentId: number, data: any) => {
    try {
      console.log('週次データ保存開始:', { weekKey, studentId, data });
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('認証トークンがありません');
        return;
      }
      
      const requestData = {
        dm_scheduled: data.dm_scheduled,
        lesson_completed: data.lesson_completed,
        next_lesson_date: data.next_lesson_date,
        lesson_completed_date: data.lesson_completed_date
      };
      
      console.log('送信するデータ:', requestData);
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/class1/weekly-checklist/${weekKey}/${studentId}`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log('週次データ保存成功:', response.data);
    } catch (error: any) {
      console.error('週次データの保存に失敗しました:', error);
      console.error('エラー詳細:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
    }
  };

  // フォーム状態
  const [studentName, setStudentName] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [studentMemo, setStudentMemo] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [isNewStudent, setIsNewStudent] = useState(true);

  // 権限チェック
  const hasPermission = user?.role === 'ECG講師' || user?.role === 'JCG講師' || user?.role === 'サーバー管理者';

  useEffect(() => {
    const initializeData = async () => {
      console.log('初期化開始');
      
      // 現在の週を設定
      const currentWeekString = getCurrentWeek();
      console.log('現在の週:', currentWeekString);
      setCurrentWeek(currentWeekString);
      
      // 基本データを取得
      await fetchData();
      
      // 全週のデータを一括で取得
      console.log('全週データ取得開始');
      const allWeeklyData = await fetchAllWeeklyData();
      console.log('取得した全週データ:', allWeeklyData);
      
      setWeeklyData(allWeeklyData);
    };
    
    initializeData();
  }, []);

  // 週が変更されたときにデータベースから読み込み
  useEffect(() => {
    if (currentWeek) {
      console.log('週変更検知:', currentWeek);
      
      // 全週データが既に読み込まれている場合は、その週のデータが存在するかチェック
      if (Object.keys(weeklyData).length > 0) {
        console.log('全週データが既に読み込まれています');
        return;
      }
      
      // 全週データが読み込まれていない場合のみ、その週のデータを取得
      const loadWeeklyDataFromDB = async () => {
        const dbData = await fetchWeeklyData(currentWeek);
        console.log('週変更時のデータ:', dbData);
        setWeeklyData(prev => ({
          ...prev,
          [currentWeek]: dbData
        }));
      };
      
      loadWeeklyDataFromDB();
    }
  }, [currentWeek]);

  // 週次データが変更されたときに永続化
  useEffect(() => {
    if (Object.keys(weeklyData).length > 0) {
      saveWeeklyData(weeklyData);
    }
  }, [weeklyData]);

  // 週次データまたは講師フィルターが変更されたときにカレンダーイベントを更新
  useEffect(() => {
    if (students.length > 0 && Object.keys(weeklyData).length > 0) {
      updateCalendarEvents();
    }
  }, [weeklyData, selectedInstructorCalendar, students]);

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
    const members = users.filter(user => {
      const role = user.role?.trim();
      return role === 'Class1 Members';
    });
    console.log('Filtered Class1 Members:', members);
    return members;
  };

  // 週次チェックリスト用のヘルパー関数（既存の関数を削除し、上記の新しい関数を使用）

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

  // カレンダー関連のヘルパー関数
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();
    
    return { firstDayOfWeek, daysInMonth };
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDateKey = (year: number, month: number, day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const getEventsForDate = (dateKey: string) => {
    return calendarEvents[dateKey] || [];
  };

  const getEventDisplay = (events: Array<any>) => {
    if (events.length === 0) return null;
    
    // 複数生徒の場合は常に数字で表示
    if (events.length > 1) {
      return {
        type: 'multiple',
        count: events.length,
        events: events
      };
    }
    
    // 単一生徒の場合
    const event = events[0];
    return {
      type: event.type,
      count: 1,
      events: events
    };
  };

  // ポップアップを開く関数
  const handleDateClick = (dateKey: string, events: Array<any>) => {
    if (events.length > 0) {
      setSelectedDate(dateKey);
      setSelectedDateEvents(events);
      setPopupOpen(true);
    }
  };

  // 週次データ管理用のヘルパー関数
  const getWeeklyDataKey = (weekString: string, studentId: number) => {
    return `${weekString}_${studentId}`;
  };

  const getStudentWeeklyData = (studentId: number) => {
    const weekData = weeklyData[currentWeek] || {};
    const studentData = weekData[studentId] || {
      dm_scheduled: false,
      lesson_completed: false,
      next_lesson_date: '',
      lesson_completed_date: ''
    };
    
    console.log('getStudentWeeklyData:', { 
      studentId, 
      currentWeek, 
      weekData, 
      studentData,
      weeklyDataKeys: Object.keys(weeklyData)
    });
    
    return studentData;
  };

  const updateStudentWeeklyData = (studentId: number, field: string, value: any) => {
    console.log('updateStudentWeeklyData呼び出し:', { studentId, field, value, currentWeek });
    
    setWeeklyData(prev => {
      const weekData = prev[currentWeek] || {};
      const studentData = weekData[studentId] || {
        dm_scheduled: false,
        lesson_completed: false,
        next_lesson_date: '',
        lesson_completed_date: ''
      };

      console.log('現在の学生データ:', studentData);

      // フィールドに応じてブール値も更新
      let updatedStudentData = { ...studentData, [field]: value };
      
      if (field === 'next_lesson_date') {
        updatedStudentData.dm_scheduled = !!value;
      } else if (field === 'lesson_completed_date') {
        updatedStudentData.lesson_completed = !!value;
      }

      console.log('更新後の学生データ:', updatedStudentData);

      const newWeeklyData = {
        ...prev,
        [currentWeek]: {
          ...weekData,
          [studentId]: updatedStudentData
        }
      };

      console.log('新しい週次データ:', newWeeklyData);

      // ローカルストレージに永続化
      saveWeeklyData(newWeeklyData);
      
      // データベースにも保存
      saveWeeklyDataToDB(currentWeek, studentId, updatedStudentData);

      return newWeeklyData;
    });
  };

  // カレンダーイベントを生成する関数
  const generateCalendarEvents = () => {
    const events: {[date: string]: Array<{
      studentId: number;
      studentName: string;
      type: 'scheduled' | 'completed';
      date: string;
    }>} = {};

    // 全週のデータを取得
    Object.keys(weeklyData).forEach(weekKey => {
      const weekData = weeklyData[weekKey];
      
      Object.keys(weekData).forEach(studentIdStr => {
        const studentId = parseInt(studentIdStr);
        const studentData = weekData[studentId];
        const student = students.find(s => s.id === studentId);
        
        if (!student) return;

        // 講師フィルター適用
        if (selectedInstructorCalendar !== 'all' && 
            student.instructor_id.toString() !== selectedInstructorCalendar) {
          return;
        }

        // レッスン実施済み日を処理
        if (studentData.lesson_completed_date) {
          const dateKey = studentData.lesson_completed_date;
          if (!events[dateKey]) events[dateKey] = [];
          
          // 同じ生徒が既に存在するかチェック（同じ生徒の重複のみ排除）
          const existingIndex = events[dateKey].findIndex(e => e.studentId === studentId);
          if (existingIndex === -1) {
            events[dateKey].push({
              studentId,
              studentName: student.name,
              type: 'completed',
              date: dateKey
            });
          } else {
            // 同じ生徒が既に存在する場合、チェックマーク（実施済み）で上書き
            events[dateKey][existingIndex] = {
              studentId,
              studentName: student.name,
              type: 'completed',
              date: dateKey
            };
          }
        }

        // 次回レッスン予定日を処理
        if (studentData.next_lesson_date) {
          const dateKey = studentData.next_lesson_date;
          if (!events[dateKey]) events[dateKey] = [];
          
          // 同じ生徒が既に存在するかチェック
          const existingIndex = events[dateKey].findIndex(e => e.studentId === studentId);
          if (existingIndex === -1) {
            // 同じ生徒が存在しない場合のみ追加
            events[dateKey].push({
              studentId,
              studentName: student.name,
              type: 'scheduled',
              date: dateKey
            });
          }
          // 同じ生徒が既に存在する場合は何もしない（実施済みが優先される）
        }
      });
    });

    return events;
  };

  // カレンダーイベントを更新する関数
  const updateCalendarEvents = () => {
    const events = generateCalendarEvents();
    setCalendarEvents(events);
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
                  const yearNum = parseInt(year);
                  const weekNum = parseInt(week);
                  
                  if (weekNum > 1) {
                    // 同じ年の中で前の週
                    setCurrentWeek(`${yearNum}-W${(weekNum - 1).toString().padStart(2, '0')}`);
                  } else {
                    // 前の年の最後の週
                    const prevYear = yearNum - 1;
                    setCurrentWeek(`${prevYear}-W52`);
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
                  const yearNum = parseInt(year);
                  const weekNum = parseInt(week);
                  
                  if (weekNum < 52) {
                    // 同じ年の中で次の週
                    setCurrentWeek(`${yearNum}-W${(weekNum + 1).toString().padStart(2, '0')}`);
                  } else {
                    // 次の年の最初の週
                    const nextYear = yearNum + 1;
                    setCurrentWeek(`${nextYear}-W01`);
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
              {getFilteredStudents().map((student, index) => {
                const weeklyData = getStudentWeeklyData(student.id);
                return (
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
                              {student.name || `生徒${index + 1}`}
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
                              checked={weeklyData.dm_scheduled}
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
                              value={weeklyData.next_lesson_date || ''}
                              onChange={(e) => updateStudentWeeklyData(student.id, 'next_lesson_date', e.target.value)}
                              sx={{ flex: 1 }}
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                updateStudentWeeklyData(student.id, 'next_lesson_date', today);
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
                              checked={weeklyData.lesson_completed}
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
                              value={weeklyData.lesson_completed_date || ''}
                              onChange={(e) => updateStudentWeeklyData(student.id, 'lesson_completed_date', e.target.value)}
                              sx={{ flex: 1 }}
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                updateStudentWeeklyData(student.id, 'lesson_completed_date', today);
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
                            value={((weeklyData.dm_scheduled ? 1 : 0) + (weeklyData.lesson_completed ? 1 : 0)) * 50}
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
                            {((weeklyData.dm_scheduled ? 1 : 0) + (weeklyData.lesson_completed ? 1 : 0)) * 50}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Card>
        </>
      )}

      {/* カレンダータブ */}
      {activeTab === 1 && (
        <Card sx={{ 
          border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
          '&:hover': {
            boxShadow: isDarkMode ? '0 4px 20px rgba(255,255,255,0.1)' : '0 4px 20px rgba(0,0,0,0.1)'
          }
        }}>
          <CardContent>
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
                  {getInstructors().map((instructor) => (
                    <MenuItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* カレンダー */}
            <Box sx={{ mb: 3 }}>
              {/* 月ナビゲーション */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <IconButton 
                  onClick={() => {
                    const prevMonth = new Date(currentMonth);
                    prevMonth.setMonth(prevMonth.getMonth() - 1);
                    setCurrentMonth(prevMonth);
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                </Typography>
                
                <IconButton 
                  onClick={() => {
                    const nextMonth = new Date(currentMonth);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    setCurrentMonth(nextMonth);
                  }}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </Box>

              {/* カレンダーグリッド */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: 1,
                border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
                borderRadius: 1
              }}>
                {/* 曜日ヘッダー */}
                {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                  <Box key={day} sx={{ 
                    p: 1, 
                    textAlign: 'center', 
                    fontWeight: 600,
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0'
                  }}>
                    <Typography variant="body2">{day}</Typography>
                  </Box>
                ))}

                {/* カレンダー日付 */}
                {(() => {
                  const { firstDayOfWeek, daysInMonth } = getDaysInMonth(currentMonth);
                  const days = [];
                  
                  // 前月の日付（空白セル）
                  for (let i = 0; i < firstDayOfWeek; i++) {
                    days.push(
                      <Box key={`empty-${i}`} sx={{ 
                        p: 1, 
                        minHeight: 60,
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                      }} />
                    );
                  }
                  
                  // 当月の日付
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateKey = getDateKey(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const events = getEventsForDate(dateKey);
                    const eventDisplay = getEventDisplay(events);
                    const isToday = formatDate(new Date()) === dateKey;
                    
                    days.push(
                      <Box key={day} sx={{ 
                        p: 1, 
                        minHeight: 60,
                        border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
                        backgroundColor: isToday ? (isDarkMode ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)') : 'transparent',
                        position: 'relative',
                        cursor: events.length > 0 ? 'pointer' : 'default',
                        '&:hover': {
                          backgroundColor: events.length > 0 ? (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'transparent'
                        }
                      }}
                      onClick={() => handleDateClick(dateKey, events)}
                      >
                        <Typography variant="body2" sx={{ 
                          fontWeight: isToday ? 600 : 400,
                          color: isToday ? 'primary.main' : 'inherit'
                        }}>
                          {day}
                        </Typography>
                        
                        {eventDisplay && (
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
                            backgroundColor: eventDisplay.type === 'completed' ? 'success.main' : 
                                             eventDisplay.type === 'scheduled' ? 'warning.main' : 'primary.main',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {eventDisplay.count > 1 ? eventDisplay.count : 
                             eventDisplay.type === 'completed' ? '✓' : '⭐'}
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

      {/* ポップアップ */}
      <Dialog
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {selectedDate} のレッスン詳細
            </Typography>
            <IconButton onClick={() => setPopupOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedDateEvents.map((event, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                p: 2, 
                mb: 1,
                border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
                borderRadius: 1,
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
              }}>
                <Box sx={{ 
                  width: 24, 
                  height: 24, 
                  borderRadius: '50%', 
                  backgroundColor: event.type === 'completed' ? 'success.main' : 'warning.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  color: 'white'
                }}>
                  {event.type === 'completed' ? '✓' : '⭐'}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {event.studentName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.type === 'completed' ? 'レッスン実施済み' : '次回レッスン予定'}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Class1ManagementPage; 