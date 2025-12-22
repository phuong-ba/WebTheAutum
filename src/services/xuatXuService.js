import baseUrl from "@/api/instance";

// Lấy tất cả xuất xứ
export const getAllXuatXu = async () => {
  const res = await baseUrl.get("xuat-xu/playlist");
  return res.data;
};

// Lọc xuất xứ + phân trang
export const filterXuatXu = async (params) => {
  const res = await baseUrl.get("xuat-xu/filter", {
    params: {
      pageNo: params.pageNo ?? 0,
      pageSize: params.pageSize ?? 10,
      ...params,
    },
  });
  return res.data;
};

// Thêm xuất xứ
export const addXuatXu = async (data) => {
  const res = await baseUrl.post("xuat-xu/add", data);
  return res.data;
};

// Cập nhật xuất xứ
export const updateXuatXu = async (id, data) => {
  const res = await baseUrl.put(`xuat-xu/update/${id}`, data);
  return res.data;
};

// Cập nhật trạng thái
export const updateTrangThaiXuatXu = async (id, trangThai) => {
  const res = await baseUrl.put(
    `xuat-xu/update-trang-thai/${id}`,
    null,
    { params: { trangThai } }
  );
  return res.data;
};

// Chi tiết xuất xứ
export const getXuatXuDetail = async (id) => {
  const res = await baseUrl.get(`xuat-xu/detail/${id}`);
  return res.data;
};