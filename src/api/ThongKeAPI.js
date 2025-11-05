import axios from 'axios';

const API_URL = 'http://localhost:8080/api/thong-ke';

const ThongKeApi = {
  // Lấy tất cả thống kê trong một request (KHUYÊN DÙNG)
  getAllStatistics(period = 'month') {
    return axios.get(`${API_URL}/all`, {
      params: { period }
    });
  },

  // Lấy thống kê tổng quan (hôm nay, tuần, tháng, năm)
  getSummary() {
    return axios.get(`${API_URL}/summary`);
  },

  // Lấy dữ liệu biểu đồ doanh thu
  getRevenueChart(type = 'week') {
    return axios.get(`${API_URL}/revenue-chart`, {
      params: { type }
    });
  },

  // Lấy top sản phẩm bán chạy
  getTopProducts(period = 'month', limit = 5) {
    return axios.get(`${API_URL}/top-products`, {
      params: { period, limit }
    });
  },

  // Lấy phân bổ trạng thái đơn hàng
  getOrderStatus(period = 'month') {
    return axios.get(`${API_URL}/order-status`, {
      params: { period }
    });
  },

  // Lấy phân phối theo kênh (Online/Tại quầy)
  getChannelDistribution(period = 'month') {
    return axios.get(`${API_URL}/channels`, {
      params: { period }
    });
  },

  // Lấy thống kê theo brand/nhà sản xuất
  getBrandStatistics(period = 'month') {
    return axios.get(`${API_URL}/brands`, {
      params: { period }
    });
  },

  // Lấy bảng thống kê chi tiết (hôm nay, tuần, tháng, năm)
  getDetailTable() {
    return axios.get(`${API_URL}/detail-table`);
  },


    // 📄 Xuất báo cáo PDF
  exportPdf: async () => {
    return axios.get(`${API_URL}/bao-cao/pdf`, {
      responseType: "blob", // bắt buộc để nhận file PDF
    });
  },

// 🏆 Top sản phẩm bán chạy
getTopSellingProducts() {
  return axios.get(`${API_URL}/top-selling-products`);
},

// ⚠️ Sản phẩm sắp hết hàng
getLowStockProducts() {
  return axios.get(`${API_URL}/low-stock-products`);
},




};

export default ThongKeApi;