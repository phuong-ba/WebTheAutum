import baseUrl from "../api/instance.js";
import Cookies from "js-cookie";

export const authService = {
  login: async (email, password) => {
    const response = await baseUrl.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await baseUrl.post("/auth/register", userData);
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
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_img");
    localStorage.removeItem("giao_ca_info");
    localStorage.removeItem("giao_ca_status");
    localStorage.removeItem("login_success_data");
  },

  getToken: () => {
    return JSON.parse(Cookies.get("token") || "null");
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("auth_token");
  },

  getUserType: () => {
    return localStorage.getItem("user_type");
  },

  getUserName: () => {
    return localStorage.getItem("user_name");
  },

  // Lấy thông tin đăng nhập
  getAuthData: () => {
    return {
      token: localStorage.getItem("auth_token"),
      userId: localStorage.getItem("user_id"),
      userName: localStorage.getItem("user_name"),
      email: localStorage.getItem("user_email"),
      role: localStorage.getItem("user_role"),
      userImg: localStorage.getItem("user_img"),
    };
  },

  // Lấy role người dùng
  getUserRole: () => {
    return localStorage.getItem("user_role");
  },

  // Lấy ID người dùng
  getUserId: () => {
    return localStorage.getItem("user_id");
  },

  // Kiểm tra xem người dùng là Admin/Quản lý hay không
  isAdmin: () => {
    const role = localStorage.getItem("user_role");
    // Quản lý = admin
    return role && role.trim().toLowerCase() === "quản lý";
  },

  // Kiểm tra xem người dùng là Nhân viên hay không
  isEmployee: () => {
    const role = localStorage.getItem("user_role");
    return role && role.trim().toLowerCase() === "nhân viên";
  },

  // Lưu thông tin giao ca
  saveShiftInfo: (shiftData) => {
    if (shiftData) {
      console.log("💾 Lưu giao ca info:", shiftData);
      localStorage.setItem("giao_ca_info", JSON.stringify(shiftData));
      // Kiểm tra xem giao ca có kết thúc hay không
      // API trả về: isCompleted hoặc thoiGianKetThuc
      const isCompleted = shiftData.isCompleted || !!shiftData.thoiGianKetThuc;
      const status = isCompleted ? "completed" : "active";
      console.log("📌 Giao ca status:", status, "| isCompleted:", isCompleted);
      localStorage.setItem("giao_ca_status", status);
    }
  },

  // Lấy thông tin giao ca
  getShiftInfo: () => {
    const shiftData = localStorage.getItem("giao_ca_info");
    return shiftData ? JSON.parse(shiftData) : null;
  },

  // Lấy trạng thái giao ca
  getShiftStatus: () => {
    return localStorage.getItem("giao_ca_status") || "inactive";
  },

  // Kiểm tra giao ca có đang hoạt động không
  isShiftActive: () => {
    return localStorage.getItem("giao_ca_status") === "active";
  },

  // Xóa thông tin giao ca
  clearShiftInfo: () => {
    localStorage.removeItem("giao_ca_info");
    localStorage.removeItem("giao_ca_status");
  },

  saveAuthData: (token, userType, userName) => {
    Cookies.set("token", JSON.stringify(token), { expires: 7 });
    localStorage.setItem("user_type", userType);
    localStorage.setItem("user_name", userName);
  },
};
