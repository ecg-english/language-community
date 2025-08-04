import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_API_BASE || 'https://language-community-backend.onrender.com';

// リクエストインターセプター：認証トークンを自動追加
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('=== Axios Request Debug ===');
      console.log('Request URL:', config.url);
      console.log('Request method:', config.method);
      console.log('Token present:', !!token);
      console.log('Authorization header:', config.headers.Authorization);
    } else {
      console.log('=== Axios Request Debug ===');
      console.log('No token found in localStorage');
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