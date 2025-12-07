import baseUrl from "./instance";

const giaoCaApi = {
  // 1. Lấy danh sách giao ca
  getAllGiaoCa: async () => {
    const response = await baseUrl.get("giao-ca");
    return response.data;
  },

  // 2. Bắt đầu ca mới
  startGiaoCa: async (idNhanVien, soTienBatDau, ghiChu = "") => {
    const response = await baseUrl.post("giao-ca/start", {
      idNhanVien,
      soTienBatDau,
      ghiChu
    });
    return response.data;
  },

  // 3. Kết thúc ca
  endGiaoCa: async (idGiaoCa, idNhanVien, ghiChu = "") => {
    const response = await baseUrl.post(`giao-ca/${idGiaoCa}/end`, {
      idNhanVien,
      ghiChu
    });
    return response.data;
  },

  // 4. Lấy chi tiết giao ca
  getGiaoCaDetail: async (id) => {
    const response = await baseUrl.get(`giao-ca/${id}`);
    return response.data;
  },

  // 5. Xuất Excel danh sách giao ca
  exportGiaoCaToExcel: async () => {
    const response = await baseUrl.get("giao-ca/export", {
      responseType: 'blob'
    });
    return response.data;
  },

  // 6. Lấy giao ca đang hoạt động của nhân viên hiện tại
  getActiveGiaoCaOfCurrentUser: async () => {
    const response = await baseUrl.get("giao-ca/active");
    return response.data;
  },

  // 7. Lấy lịch sử giao ca theo nhân viên
  getGiaoCaByNhanVien: async (idNhanVien, params = {}) => {
    const response = await baseUrl.get(`giao-ca/nhan-vien/${idNhanVien}`, {
      params
    });
    return response.data;
  },

  // 8. Tìm kiếm giao ca (nếu có API)
  searchGiaoCa: async (params = {}) => {
    const response = await baseUrl.get("giao-ca/search", {
      params
    });
    return response.data;
  },

  // 9. Lấy thống kê giao ca
  getGiaoCaStatistics: async (params = {}) => {
    const response = await baseUrl.get("giao-ca/statistics", {
      params
    });
    return response.data;
  }
};

export default giaoCaApi;