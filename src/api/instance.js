import axios from "axios";
import Cookies from "js-cookie";
import { message } from "antd";

const baseUrl = axios.create({
  baseURL: "http://localhost:8080/api/",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, 
});

baseUrl.interceptors.request.use(
  (config) => {
    const token = JSON.parse(Cookies.get("token") || "null");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

baseUrl.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("token");
      localStorage.removeItem("user_type");
      localStorage.removeItem("user_name");
      
      if (!window.location.pathname.includes('/login')) {
        message.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 500) {
      message.error("Lỗi máy chủ. Vui lòng thử lại sau!");
    }
    
    if (error.code === 'ECONNABORTED') {
      message.error("Kết nối quá thời gian. Vui lòng thử lại!");
    }
    
    return Promise.reject(error);
  }
);

export default baseUrl;