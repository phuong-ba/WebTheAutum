import baseUrl from "./instance";

export const vnPayService = {
  // Tạo thanh toán VNPay
  createPayment: async (maHoaDon) => {
    try {
      const response = await baseUrl.post("vnpay/create-payment", null, {
        params: { maHoaDon }
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
      const response = await baseUrl.get("vnpay/check-payment-status", {
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
      const response = await baseUrl.post("vnpay/cancel-payment", null, {
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
      const response = await baseUrl.get("vnpay/supported-banks");
      return response.data;
    } catch (error) {
      console.error('Error getting supported banks:', error);
      throw error.response?.data || { success: false, message: 'Lỗi kết nối' };
    }
  },
};