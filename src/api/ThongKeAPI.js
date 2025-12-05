import baseUrl from "./instance";

const ThongKeApi = {
  // Lấy tất cả thống kê trong một request (KHUYÊN DÙNG)
  getAllStatistics(period = 'month') {
    return baseUrl.get("thong-ke/all", {
      params: { period }
    });
  },

  // Lấy thống kê tổng quan (hôm nay, tuần, tháng, năm)
  getSummary() {
    return baseUrl.get("thong-ke/summary");
  },

  // Lấy dữ liệu biểu đồ doanh thu
  getRevenueChart(type = 'week') {
    return baseUrl.get("thong-ke/revenue-chart", {
      params: { type }
    });
  },

  // Lấy top sản phẩm bán chạy
  getTopProducts(period = 'month', limit = 5) {
    return baseUrl.get("thong-ke/top-products", {
      params: { period, limit }
    });
  },

  // Lấy phân bổ trạng thái đơn hàng
  getOrderStatus(period = 'month') {
    return baseUrl.get("thong-ke/order-status", {
      params: { period }
    });
  },

  // Lấy phân phối theo kênh (Online/Tại quầy)
  getChannelDistribution(period = 'month') {
    return baseUrl.get("thong-ke/channels", {
      params: { period }
    });
  },

  // Lấy thống kê theo brand/nhà sản xuất
  getBrandStatistics(period = 'month') {
    return baseUrl.get("thong-ke/brands", {
      params: { period }
    });
  },

  // Lấy bảng thống kê chi tiết (hôm nay, tuần, tháng, năm)
  getDetailTable() {
    return baseUrl.get("thong-ke/detail-table");
  },

  // 📄 Xuất báo cáo PDF
  exportPdf: async () => {
    return baseUrl.get("thong-ke/bao-cao/pdf", {
      responseType: "blob",
    });
  },

  // 🏆 Top sản phẩm bán chạy
  getTopSellingProducts() {
    return baseUrl.get("thong-ke/top-selling-products");
  },

  // ⚠️ Sản phẩm sắp hết hàng
  getLowStockProducts() {
    return baseUrl.get("thong-ke/low-stock-products");
  },
};

export default ThongKeApi;