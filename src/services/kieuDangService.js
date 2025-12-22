import baseUrl from "@/api/instance";

// Lấy tất cả kiểu dáng
export const getAllKieuDang = async () => {
  const res = await baseUrl.get("kieu-dang/playlist");
  return res.data;
};

// Lọc kiểu dáng + phân trang
export const filterKieuDang = async (params) => {
  const res = await baseUrl.get("kieu-dang/filter", {
    params: {
      pageNo: params.pageNo ?? 0,
      pageSize: params.pageSize ?? 10,
      ...params,
    },
  });
  return res.data;
};

// Thêm kiểu dáng
export const addKieuDang = async (data) => {
  const res = await baseUrl.post("kieu-dang/add", data);
  return res.data;
};

// Cập nhật kiểu dáng
export const updateKieuDang = async (id, data) => {
  const res = await baseUrl.put(`kieu-dang/update/${id}`, data);
  return res.data;
};

// Cập nhật trạng thái
export const updateTrangThaiKieuDang = async (id, trangThai) => {
  const res = await baseUrl.put(
    `kieu-dang/update-trang-thai/${id}`,
    null,
    { params: { trangThai } }
  );
  return res.data;
};

// Chi tiết kiểu dáng
export const getKieuDangDetail = async (id) => {
  const res = await baseUrl.get(`kieu-dang/detail/${id}`);
  return res.data;
};