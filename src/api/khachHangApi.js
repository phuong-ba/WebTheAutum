import baseUrl from "./instance";

export const khachHangApi = {
  getAll: async () => {
    const res = await baseUrl.get(`khach-hang/all`);
    return res.data;
  },
  getById: async (id) => {
    const res = await baseUrl.get(`khach-hang/detail/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await baseUrl.post(`khach-hang/add`, data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await baseUrl.put(`khach-hang/update/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await baseUrl.delete(`khach-hang/delete/${id}`);
    return res.data;
  },
  search: async (keyword) => {
    const res = await baseUrl.get(`khach-hang/search`, {
      params: { keyword },
    });
    return res.data;
  },
  filter: async (gioiTinh, trangThai) => {
    const res = await baseUrl.get(`khach-hang/filter`, {
      params: { gioiTinh, trangThai },
    });
    return res.data;
  },
  checkEmailAndSDt: async (email, sdt) => {
    const res = await baseUrl.get(`khach-hang/check`, {
      params: { email, sdt },
    });
    return res.data;
  },
};