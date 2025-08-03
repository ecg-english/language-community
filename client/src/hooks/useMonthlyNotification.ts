import { useState, useEffect } from 'react';
import axios from 'axios';

interface MonthlyNotification {
  shouldNotify: boolean;
  currentYear: number;
  currentMonth: number;
}

export const useMonthlyNotification = () => {
  const [notification, setNotification] = useState<MonthlyNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkNotification = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/auth/monthly-notification');
      setNotification(response.data);
    } catch (error: any) {
      console.error('月次通知確認エラー:', error);
      setError(error.response?.data?.error || '月次通知確認に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkNotification();
  }, []);

  return {
    notification,
    loading,
    error,
    refetch: checkNotification,
  };
}; 