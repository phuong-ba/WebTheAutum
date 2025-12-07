import baseUrl from "./instance";

const shiftManagementApi = {
  // 1. Lấy danh sách ca làm việc
  getAllCaLamViec: async () => {
    const response = await baseUrl.get("ca-lam-viec");
    return response.data;
  },

  // 2. Thêm mới ca làm việc
  createCaLamViec: async (data) => {
    const response = await baseUrl.post("ca-lam-viec", data);
    return response.data;
  },

  // 3. Cập nhật ca làm việc
  updateCaLamViec: async (id, data) => {
    const response = await baseUrl.put(`ca-lam-viec/${id}`, data);
    return response.data;
  },

  // 4. Xóa ca làm việc
  deleteCaLamViec: async (id) => {
    const response = await baseUrl.delete(`ca-lam-viec/${id}`);
    return response.data;
  },

  // 5. Lấy danh sách phân ca
  getAllPhanCa: async (params = {}) => {
    const response = await baseUrl.get("phan-ca", { params });
    return response.data;
  },

  // 6. Thêm mới phân ca
  createPhanCa: async (data) => {
    const response = await baseUrl.post("phan-ca", data);
    return response.data;
  },

  // 7. Cập nhật phân ca
  updatePhanCa: async (id, data) => {
    const response = await baseUrl.put(`phan-ca/${id}`, data);
    return response.data;
  },

  // 8. Xóa phân ca
  deletePhanCa: async (id) => {
    const response = await baseUrl.delete(`phan-ca/${id}`);
    return response.data;
  },

  // 9. Lấy danh sách nhân viên có thể phân ca
  getNhanVienForPhanCa: async () => {
    const response = await baseUrl.get("nhan-vien/phan-ca-nhan-vien");
    return response.data;
  },

  // 10. Lấy thông tin phân ca theo ID
  getPhanCaById: async (id) => {
    const response = await baseUrl.get(`phan-ca/${id}`);
    return response.data;
  },

  // 11. Tìm kiếm phân ca theo điều kiện
  searchPhanCa: async (params = {}) => {
    const response = await baseUrl.get("phan-ca/search", { params });
    return response.data;
  },

  // 12. Xuất Excel danh sách ca làm việc
  exportCaLamViecExcel: async () => {
    const response = await baseUrl.get("ca-lam-viec/export", {
      responseType: 'blob'
    });
    return response.data;
  },

  // 13. Xuất Excel danh sách phân ca
  exportPhanCaExcel: async () => {
    const response = await baseUrl.get("phan-ca/export", {
      responseType: 'blob'
    });
    return response.data;
  },

  // 14. Lấy phân ca theo nhân viên
  getPhanCaByNhanVien: async (idNhanVien, params = {}) => {
    const response = await baseUrl.get(`phan-ca/nhan-vien/${idNhanVien}`, { params });
    return response.data;
  },

  // 15. Lấy phân ca theo ngày
  getPhanCaByDate: async (date) => {
    const response = await baseUrl.get("phan-ca/by-date", {
      params: { date }
    });
    return response.data;
  }
};

export default shiftManagementApi;