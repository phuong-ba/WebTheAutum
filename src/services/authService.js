import baseUrl from '../api/instance.js';
import Cookies from "js-cookie";

export const authService = {
  login: async (email, password) => {
    const response = await baseUrl.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await baseUrl.post('/auth/register', userData);
    return response.data;
  },

  checkEmail: async (email) => {
    const response = await baseUrl.get(`/auth/check-email?email=${email}`);
    return response.data;
  },

  getUserInfo: async (token) => {
    const response = await baseUrl.get(`/auth/user-info?token=${token}`);
    return response.data;
  },

  logout: () => {
    Cookies.remove("token");
    localStorage.removeItem("user_type");
    localStorage.removeItem("user_name");
  },

  getToken: () => {
    return JSON.parse(Cookies.get("token") || "null");
  },

  isAuthenticated: () => {
    return !!Cookies.get("token");
  },

  getUserType: () => {
    return localStorage.getItem("user_type");
  },

  getUserName: () => {
    return localStorage.getItem("user_name");
  },

  saveAuthData: (token, userType, userName) => {
    Cookies.set("token", JSON.stringify(token), { expires: 7 }); 
    localStorage.setItem("user_type", userType);
    localStorage.setItem("user_name", userName);
  }
};