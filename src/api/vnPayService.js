import axios from 'axios';

const API_URL = 'http://localhost:8080/api/vnpay'; // URL backend của bạn

export const vnPayService = {
  // Tạo thanh toán VNPay
  createPayment: async (maHoaDon) => {
    try {
      const response = await axios.post(`${API_URL}/create-payment`, null, {
        params: { maHoaDon },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating VNPay payment:', error);
      throw error.response?.data || { success: false, message: 'Lỗi kết nối' };
    }
  },

  // Kiểm tra trạng thái thanh toán
  checkPaymentStatus: async (maHoaDon) => {
    try {
      const response = await axios.get(`${API_URL}/check-payment-status`, {
        params: { maHoaDon },
      });
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error.response?.data || { success: false, message: 'Lỗi kết nối' };
    }
  },

  // Hủy thanh toán
  cancelPayment: async (maHoaDon) => {
    try {
      const response = await axios.post(`${API_URL}/cancel-payment`, null, {
        params: { maHoaDon },
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw error.response?.data || { success: false, message: 'Lỗi kết nối' };
    }
  },

  // Lấy danh sách ngân hàng hỗ trợ
  getSupportedBanks: async () => {
    try {
      const response = await axios.get(`${API_URL}/supported-banks`);
      return response.data;
    } catch (error) {
      console.error('Error getting supported banks:', error);
      throw error.response?.data || { success: false, message: 'Lỗi kết nối' };
    }
  },
};