import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_API_BASE || '';

// リクエストインターセプター：認証トークンを自動追加
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター：エラーハンドリング
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 認証エラーの場合、ローカルストレージをクリア
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('401 error detected, but not redirecting to avoid infinite loop');
      // window.location.href = '/#/login'; // 一時的に無効化
    }
    return Promise.reject(error);
  }
);

export default axios; 