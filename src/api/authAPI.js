import baseUrl from "./instance";

const authServiceAPI = {
  // 1. Đăng nhập nhân viên (admin/staff)
  login: async (email, matKhau) => {
    try {
      const response = await baseUrl.post("auth/login", { email, matKhau });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  },

  // 2. Đăng nhập khách hàng (customer)
  loginCustomer: async (email, matKhau) => {
    try {
      const response = await baseUrl.post("customer/auth/login", { email, matKhau });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  },

  // 3. Đăng ký tài khoản khách hàng
  registerCustomer: async ({ hoTen, email, matKhau, sdt = null, gioiTinh = true }) => {
    try {
      const response = await baseUrl.post("customer/auth/register", { 
        hoTen, 
        email, 
        matKhau, 
        sdt,
        gioiTinh
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  },

  // 4. Đăng ký tài khoản nhân viên
  register: async ({ hoTen, email, matKhau, diaChi = "", sdt = "" }) => {
    try {
      const response = await baseUrl.post("auth/register", { 
        hoTen, 
        email, 
        matKhau, 
        diaChi, 
        sdt 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  },

  // 5. Quên mật khẩu (gửi email reset) - cho nhân viên
  forgotPassword: async (email) => {
    try {
      const response = await baseUrl.post("auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  },

  // 6. Quên mật khẩu - cho khách hàng
  forgotPasswordCustomer: async (email) => {
    try {
      const response = await baseUrl.post("customer/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  },

  // 7. Đặt lại mật khẩu từ token (cho nhân viên)
  resetPassword: async (token, newPassword) => {
    try {
      const response = await baseUrl.post("auth/reset-password", { 
        token, 
        newPassword 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  },

  // 8. Đặt lại mật khẩu từ token (cho khách hàng) - MỚI THÊM
  resetPasswordCustomer: async (token, newPassword) => {
    try {
      const response = await baseUrl.post("customer/auth/reset-password", { 
        token, 
        newPassword 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  },

  // 9. Kiểm tra token hợp lệ
  validateToken: async (token) => {
    try {
      const response = await baseUrl.get("auth/validate-token", {
        params: { token }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Token không hợp lệ");
    }
  },

  // 10. Đổi mật khẩu (khi đã đăng nhập)
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await baseUrl.post("auth/change-password", {
        oldPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  },

  // 11. Lấy thông tin người dùng đang đăng nhập
  getProfile: async () => {
    try {
      const response = await baseUrl.get("auth/profile");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  },

  // 12. Đăng xuất
  logout: async () => {
    try {
      const response = await baseUrl.post("auth/logout");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  }
};

export default authServiceAPI;